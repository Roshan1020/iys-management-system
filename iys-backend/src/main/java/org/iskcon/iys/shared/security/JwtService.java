package org.iskcon.iys.shared.security;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import lombok.extern.slf4j.Slf4j;
import org.iskcon.iys.shared.exception.ErrorCode;
import org.iskcon.iys.shared.exception.UnauthorizedException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.*;

/**
 * Centralised JWT service using JJWT 0.12.x API.
 *
 * <p>Responsibilities:
 * <ul>
 *   <li>Generate access tokens with full claims (userId, centreId, roles, permissions)</li>
 *   <li>Generate opaque refresh token strings</li>
 *   <li>Validate and parse access tokens</li>
 *   <li>Extract the JTI (JWT ID) for Redis-based revocation</li>
 * </ul>
 */
@Slf4j
@Service
public class JwtService {

    @Value("${iys.security.jwt.secret}")
    private String jwtSecret;

    @Value("${iys.security.jwt.access-token-expiry-ms}")
    private long accessTokenExpiryMs;

    @Value("${iys.security.jwt.refresh-token-expiry-ms}")
    private long refreshTokenExpiryMs;

    // ── Key ─────────────────────────────────────────────────────

    private SecretKey getSigningKey() {
        byte[] keyBytes = Decoders.BASE64.decode(Base64.getEncoder().encodeToString(jwtSecret.getBytes()));
        return Keys.hmacShaKeyFor(keyBytes);
    }

    // ── Token Generation ────────────────────────────────────────

    /**
     * Builds a signed JWT access token carrying all authorisation claims.
     *
     * @param userId      the user's UUID (becomes the {@code sub} claim)
     * @param centreId    the user's home centre UUID
     * @param email       the user's email (for logging / debugging)
     * @param roles       list of role names assigned to the user
     * @param permissions list of permission strings (module:action or module:action:scope)
     * @return signed compact JWT string
     */
    public String generateAccessToken(UUID userId,
                                      UUID centreId,
                                      String email,
                                      List<String> roles,
                                      List<String> permissions) {
        Date now    = new Date();
        Date expiry = new Date(now.getTime() + accessTokenExpiryMs);

        return Jwts.builder()
                .id(UUID.randomUUID().toString())   // JTI — used for blacklisting
                .subject(userId.toString())
                .claim("centreId",    centreId != null ? centreId.toString() : null)
                .claim("email",       email)
                .claim("roles",       roles)
                .claim("permissions", permissions)
                .issuedAt(now)
                .expiration(expiry)
                .signWith(getSigningKey())
                .compact();
    }

    /**
     * Builds a signed JWT access token directly from a UserPrincipal.
     */
    public String generateAccessToken(UserPrincipal principal) {
        return generateAccessToken(
                principal.getUserId(),
                principal.getCentreId(),
                principal.getUsername(),
                principal.getRoles(),
                principal.getPermissions()
        );
    }

    /** Generates a random, opaque refresh token (UUID v4). Not a JWT. */
    public String generateRefreshToken() {
        return UUID.randomUUID().toString().replace("-", "") +
               UUID.randomUUID().toString().replace("-", "");
    }

    public long getAccessTokenExpiryMs() {
        return accessTokenExpiryMs;
    }

    public long getRefreshTokenExpiryMs() {
        return refreshTokenExpiryMs;
    }

    // ── Validation & Parsing ────────────────────────────────────

    /**
     * Parses and validates a JWT access token.
     *
     * @param token the compact JWT string
     * @return parsed {@link Claims}
     * @throws UnauthorizedException if the token is invalid, expired, or malformed
     */
    public Claims parseAndValidate(String token) {
        try {
            return Jwts.parser()
                    .verifyWith(getSigningKey())
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (ExpiredJwtException ex) {
            log.debug("JWT expired: {}", ex.getMessage());
            throw new UnauthorizedException(ErrorCode.TOKEN_EXPIRED + ": JWT token has expired.");
        } catch (MalformedJwtException | IllegalArgumentException ex) {
            log.debug("Malformed JWT: {}", ex.getMessage());
            throw new UnauthorizedException(ErrorCode.TOKEN_INVALID + ": JWT token is malformed.");
        } catch (JwtException ex) {
            log.debug("JWT validation failed: {}", ex.getMessage());
            throw new UnauthorizedException(ErrorCode.TOKEN_INVALID + ": JWT token validation failed.");
        }
    }

    /**
     * Extracts the JTI (JWT ID) from a token without full validation.
     * Used only for emergency scenarios — prefer {@link #parseAndValidate(String)}.
     */
    public String extractJti(String token) {
        return parseAndValidate(token).getId();
    }

    /**
     * Builds a {@link UserPrincipal} from a validated JWT's {@link Claims}.
     */
    @SuppressWarnings("unchecked")
    public UserPrincipal buildPrincipal(Claims claims) {
        UUID userId   = UUID.fromString(claims.getSubject());
        String centreIdStr = claims.get("centreId", String.class);
        UUID centreId = centreIdStr != null ? UUID.fromString(centreIdStr) : null;
        String email  = claims.get("email", String.class);

        List<String> roles       = (List<String>) claims.getOrDefault("roles", List.of());
        List<String> permissions = (List<String>) claims.getOrDefault("permissions", List.of());

        return new UserPrincipal(userId, centreId, email, null, true, roles, permissions);
    }
}
