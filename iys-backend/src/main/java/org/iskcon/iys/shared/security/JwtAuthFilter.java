package org.iskcon.iys.shared.security;

import io.jsonwebtoken.Claims;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.iskcon.iys.shared.exception.UnauthorizedException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * JWT authentication filter — runs once per request.
 *
 * <p>Pipeline:
 * <ol>
 *   <li>Extract Bearer token from {@code Authorization} header</li>
 *   <li>Parse and validate JWT signature and expiry</li>
 *   <li>Check Redis token blacklist (handles logout/revocation)</li>
 *   <li>Build {@link UserPrincipal} from claims</li>
 *   <li>Set {@link org.springframework.security.core.Authentication} in SecurityContext</li>
 * </ol>
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final RedisTemplate<String, String> redisTemplate;

    @Value("${iys.redis.token-blacklist-prefix}")
    private String blacklistPrefix;

    private static final String BEARER_PREFIX = "Bearer ";
    private static final String AUTH_HEADER   = "Authorization";

    @Override
    protected void doFilterInternal(@NonNull HttpServletRequest  request,
                                    @NonNull HttpServletResponse response,
                                    @NonNull FilterChain         filterChain)
            throws ServletException, IOException {

        String token = extractToken(request);

        if (token == null) {
            filterChain.doFilter(request, response);
            return;
        }

        try {
            // 1. Validate and parse
            Claims claims = jwtService.parseAndValidate(token);

            // 2. Check Redis blacklist (token revoked on logout)
            String jti = claims.getId();
            if (isBlacklisted(jti)) {
                log.debug("Token JTI {} is blacklisted (revoked)", jti);
                filterChain.doFilter(request, response);
                return;
            }

            // 3. Build principal and set authentication
            if (SecurityContextHolder.getContext().getAuthentication() == null) {
                UserPrincipal principal = jwtService.buildPrincipal(claims);

                UsernamePasswordAuthenticationToken authToken =
                        new UsernamePasswordAuthenticationToken(
                                principal, null, principal.getAuthorities());
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));

                SecurityContextHolder.getContext().setAuthentication(authToken);
                log.debug("Authenticated user: {} (centre: {})", principal.getUsername(), principal.getCentreId());
            }

        } catch (UnauthorizedException ex) {
            // Token invalid/expired — clear context and continue (Spring Security handles 401)
            log.debug("JWT auth failed: {}", ex.getMessage());
            SecurityContextHolder.clearContext();
        }

        filterChain.doFilter(request, response);
    }

    private String extractToken(HttpServletRequest request) {
        String header = request.getHeader(AUTH_HEADER);
        if (StringUtils.hasText(header) && header.startsWith(BEARER_PREFIX)) {
            return header.substring(BEARER_PREFIX.length());
        }
        return null;
    }

    private boolean isBlacklisted(String jti) {
        if (jti == null) return false;
        try {
            return Boolean.TRUE.equals(redisTemplate.hasKey(blacklistPrefix + jti));
        } catch (Exception ex) {
            // Redis unavailable — fail open (log warning, don't break auth)
            log.warn("Redis unavailable for blacklist check. Allowing token. Error: {}", ex.getMessage());
            return false;
        }
    }
}
