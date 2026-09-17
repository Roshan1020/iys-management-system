package org.iskcon.iys.modules.identity;

import org.iskcon.iys.modules.identity.application.AuthServiceImpl;
import org.iskcon.iys.modules.identity.domain.Permission;
import org.iskcon.iys.modules.identity.domain.RefreshToken;
import org.iskcon.iys.modules.identity.domain.Role;
import org.iskcon.iys.modules.identity.domain.User;
import org.iskcon.iys.modules.identity.domain.UserRole;
import org.iskcon.iys.modules.identity.domain.enums.UserStatus;
import org.iskcon.iys.modules.identity.dto.ChangePasswordRequest;
import org.iskcon.iys.modules.identity.dto.LoginRequest;
import org.iskcon.iys.modules.identity.dto.TokenResponse;
import org.iskcon.iys.modules.identity.infrastructure.RefreshTokenRepository;
import org.iskcon.iys.modules.identity.infrastructure.UserRepository;
import org.iskcon.iys.modules.identity.infrastructure.UserRoleRepository;
import org.iskcon.iys.shared.exception.UnauthorizedException;
import org.iskcon.iys.shared.security.JwtService;
import org.iskcon.iys.shared.security.UserPrincipal;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@Tag("unit")
class AuthServiceTest {

    @InjectMocks
    private AuthServiceImpl authService;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserRoleRepository userRoleRepository;

    @Mock
    private RefreshTokenRepository refreshTokenRepository;

    @Mock
    private JwtService jwtService;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private RedisTemplate<String, String> redisTemplate;

    @Test
    void login_whenValidCredentials_returnsTokenResponse() {
        LoginRequest req = new LoginRequest("test@test.com", "pass");
        UUID userId = UUID.randomUUID();
        UUID centreId = UUID.randomUUID();
        UserPrincipal principal = new UserPrincipal(userId, centreId, "test@test.com", "pass", List.of("DEVOTEE"));
        Authentication auth = new UsernamePasswordAuthenticationToken(principal, null, principal.getAuthorities());
        when(authenticationManager.authenticate(any())).thenReturn(auth);

        User user = User.builder()
                .centreId(centreId)
                .email("test@test.com")
                .status(UserStatus.ACTIVE)
                .build();
        user.setId(userId);
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(userRepository.save(any(User.class))).thenReturn(user);

        when(jwtService.generateAccessToken(eq(userId), eq(centreId), eq("test@test.com"), anyList(), anyList()))
                .thenReturn("access-token");
        when(jwtService.generateRefreshToken()).thenReturn("refresh-token-raw");
        when(jwtService.getRefreshTokenExpiryMs()).thenReturn(604800000L);

        TokenResponse res = authService.login(req, "127.0.0.1", "test-agent");
        assertNotNull(res);
        assertEquals("access-token", res.getAccessToken());
        assertEquals("Bearer", res.getTokenType());
    }

    @Test
    void login_whenBadCredentials_throwsUnauthorizedException() {
        LoginRequest req = new LoginRequest("test@test.com", "pass");
        when(authenticationManager.authenticate(any())).thenThrow(new BadCredentialsException("Bad creds"));

        assertThrows(UnauthorizedException.class, () -> authService.login(req, "127.0.0.1", "test-agent"));
    }

    @Test
    void refreshToken_whenValidToken_returnsNewTokenResponse() {
        String rawToken = "raw-refresh-token";
        UUID userId = UUID.randomUUID();
        UUID centreId = UUID.randomUUID();

        RefreshToken rt = RefreshToken.builder()
                .userId(userId)
                .tokenHash("some-hash")
                .ipAddress("127.0.0.1")
                .deviceInfo("agent")
                .issuedAt(Instant.now())
                .expiresAt(Instant.now().plusSeconds(3600))
                .build();
        when(refreshTokenRepository.findByTokenHash(anyString())).thenReturn(Optional.of(rt));

        User user = User.builder()
                .centreId(centreId)
                .email("test@test.com")
                .status(UserStatus.ACTIVE)
                .build();
        user.setId(userId);
        when(userRepository.findById(userId)).thenReturn(Optional.of(user));

        Permission perm = Permission.builder().module("devotee").action("read").scope("own").build();
        Role role = Role.builder().name("DEVOTEE").permissions(Set.of(perm)).build();
        UserRole ur = UserRole.builder().userId(userId).roleId(UUID.randomUUID()).centreId(centreId).role(role).build();
        when(userRoleRepository.findActiveRolesByUserId(userId)).thenReturn(List.of(ur));

        when(jwtService.generateAccessToken(eq(userId), eq(centreId), eq("test@test.com"), anyList(), anyList()))
                .thenReturn("new-access-token");
        when(jwtService.generateRefreshToken()).thenReturn("new-refresh-raw");

        TokenResponse res = authService.refreshToken(rawToken);
        assertNotNull(res);
        assertEquals("new-access-token", res.getAccessToken());
        assertEquals("Bearer", res.getTokenType());
    }

    @Test
    void changePassword_whenCurrentPasswordCorrect_updatesPassword() {
        ChangePasswordRequest req = new ChangePasswordRequest("oldPass", "newPass");
        UUID userId = UUID.randomUUID();

        User user = User.builder()
                .email("test@test.com")
                .passwordHash("hashedOld")
                .status(UserStatus.ACTIVE)
                .build();
        user.setId(userId);

        when(userRepository.findById(userId)).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("oldPass", "hashedOld")).thenReturn(true);
        when(passwordEncoder.encode("newPass")).thenReturn("hashedNew");

        authService.changePassword(userId, req);

        verify(passwordEncoder).encode("newPass");
        verify(userRepository).save(user);
    }
}
