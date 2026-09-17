package org.iskcon.iys.modules.identity.application;

import java.util.UUID;
import org.iskcon.iys.modules.identity.dto.ChangePasswordRequest;
import org.iskcon.iys.modules.identity.dto.LoginRequest;
import org.iskcon.iys.modules.identity.dto.TokenResponse;

public interface AuthService {
    TokenResponse login(LoginRequest request, String ipAddress, String deviceInfo);
    TokenResponse refreshToken(String refreshTokenValue);
    void logout(String accessToken, String jti);
    void changePassword(UUID userId, ChangePasswordRequest request);
}
