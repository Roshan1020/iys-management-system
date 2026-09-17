package org.iskcon.iys.modules.identity.application;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.iskcon.iys.modules.identity.domain.RefreshToken;
import org.iskcon.iys.modules.identity.domain.User;
import org.iskcon.iys.modules.identity.domain.UserRole;
import org.iskcon.iys.modules.identity.domain.enums.UserStatus;
import org.iskcon.iys.modules.identity.dto.ChangePasswordRequest;
import org.iskcon.iys.modules.identity.dto.LoginRequest;
import org.iskcon.iys.modules.identity.dto.TokenResponse;
import org.iskcon.iys.modules.identity.infrastructure.RefreshTokenRepository;
import org.iskcon.iys.modules.identity.infrastructure.UserRepository;
import org.iskcon.iys.modules.identity.infrastructure.UserRoleRepository;
import org.iskcon.iys.shared.exception.ErrorCode;
import org.iskcon.iys.shared.exception.ResourceNotFoundException;
import org.iskcon.iys.shared.exception.UnauthorizedException;
import org.iskcon.iys.shared.security.JwtService;
import org.iskcon.iys.shared.security.UserPrincipal;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class AuthServiceImpl implements AuthService {

    private final AuthenticationManager authenticationManager;
    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final RedisTemplate<String, String> redisTemplate;

    @Value("${iys.security.jwt.refresh-token-expiry-ms}")
    private long refreshExpiryMs;

    @Value("${iys.redis.token-blacklist-prefix}")
    private String blacklistPrefix;

    @Value("${iys.redis.token-blacklist-ttl-seconds}")
    private long blacklistTtlSeconds;

    @Override
    public TokenResponse login(LoginRequest request, String ipAddress, String deviceInfo) {
        try {
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.email(), request.password())
            );

            UserPrincipal principal = (UserPrincipal) authentication.getPrincipal();

            User user = userRepository.findById(principal.getUserId())
                    .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.USER_NOT_FOUND, "User not found"));

            user.setLastLoginAt(Instant.now());
            user.setFailedLoginCount(0);
            userRepository.save(user);

            String accessToken = jwtService.generateAccessToken(
                    principal.getUserId(),
                    principal.getCentreId(),
                    principal.getUsername(),
                    principal.getRoles(),
                    principal.getPermissions()
            );

            String refreshTokenString = jwtService.generateRefreshToken();

            RefreshToken refreshToken = RefreshToken.builder()
                    .userId(user.getId())
                    .tokenHash(hashToken(refreshTokenString))
                    .ipAddress(ipAddress)
                    .deviceInfo(deviceInfo)
                    .issuedAt(Instant.now())
                    .expiresAt(Instant.now().plusMillis(refreshExpiryMs))
                    .build();

            refreshTokenRepository.save(refreshToken);

            return TokenResponse.builder()
                    .accessToken(accessToken)
                    .refreshToken(refreshTokenString)
                    .tokenType("Bearer")
                    .expiresInMs(jwtService.getRefreshTokenExpiryMs())
                    .userId(principal.getUserId())
                    .email(principal.getUsername())
                    .centreId(principal.getCentreId())
                    .roles(principal.getRoles())
                    .build();

        } catch (BadCredentialsException ex) {
            throw new UnauthorizedException("Invalid email or password.");
        }
    }

    @Override
    public TokenResponse refreshToken(String refreshTokenValue) {
        String hashedToken = hashToken(refreshTokenValue);

        RefreshToken refreshToken = refreshTokenRepository.findByTokenHash(hashedToken)
                .orElseThrow(() -> new UnauthorizedException("Invalid refresh token."));

        if (!refreshToken.isValid()) {
            throw new UnauthorizedException("Refresh token is expired or revoked.");
        }

        User user = userRepository.findById(refreshToken.getUserId())
                .orElseThrow(() -> new UnauthorizedException("User not found."));

        if (user.getStatus() != UserStatus.ACTIVE) {
            throw new UnauthorizedException("User account is not active.");
        }

        List<UserRole> activeRoles = userRoleRepository.findActiveRolesByUserId(user.getId());

        List<String> roles = activeRoles.stream()
                .map(ur -> ur.getRole().getName())
                .distinct()
                .collect(Collectors.toList());

        List<String> permissions = activeRoles.stream()
                .flatMap(ur -> ur.getRole().getPermissions().stream())
                .map(p -> p.toPermissionString())
                .distinct()
                .collect(Collectors.toList());

        // Rotate: revoke old, issue new
        refreshToken.setRevokedAt(Instant.now());
        refreshToken.setRevokedReason("ROTATION");
        refreshTokenRepository.save(refreshToken);

        String newAccessToken = jwtService.generateAccessToken(
                user.getId(),
                user.getCentreId(),
                user.getEmail(),
                roles,
                permissions
        );
        String newRefreshTokenString = jwtService.generateRefreshToken();

        RefreshToken newRefreshToken = RefreshToken.builder()
                .userId(user.getId())
                .tokenHash(hashToken(newRefreshTokenString))
                .ipAddress(refreshToken.getIpAddress())
                .deviceInfo(refreshToken.getDeviceInfo())
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusMillis(refreshExpiryMs))
                .build();

        refreshTokenRepository.save(newRefreshToken);

        return TokenResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshTokenString)
                .tokenType("Bearer")
                .expiresInMs(refreshExpiryMs)
                .userId(user.getId())
                .email(user.getEmail())
                .centreId(user.getCentreId())
                .roles(roles)
                .build();
    }

    @Override
    public void logout(String accessToken, String jti) {
        if (jti != null) {
            try {
                redisTemplate.opsForValue().set(
                        blacklistPrefix + jti,
                        "revoked",
                        blacklistTtlSeconds,
                        TimeUnit.SECONDS
                );
                log.debug("Token JTI {} added to Redis blacklist", jti);
            } catch (Exception ex) {
                log.warn("Failed to blacklist token JTI {}. Redis unavailable: {}", jti, ex.getMessage());
            }
        }
    }

    @Override
    public void changePassword(UUID userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.USER_NOT_FOUND, "User not found."));

        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) {
            throw new UnauthorizedException("Current password is incorrect.");
        }

        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        userRepository.save(user);
        log.info("Password changed for user: {}", userId);
    }

    // ── Private helpers ──────────────────────────────────────────

    private String hashToken(String token) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(token.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }
}
