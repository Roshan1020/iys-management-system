package org.iskcon.iys.modules.identity.api;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.iskcon.iys.modules.identity.application.AuthService;
import org.iskcon.iys.modules.identity.application.UserService;
import org.iskcon.iys.modules.identity.dto.ChangePasswordRequest;
import org.iskcon.iys.modules.identity.dto.LoginRequest;
import org.iskcon.iys.modules.identity.dto.RefreshTokenRequest;
import org.iskcon.iys.modules.identity.dto.RegisterRequest;
import org.iskcon.iys.modules.identity.dto.TokenResponse;
import org.iskcon.iys.shared.dto.ApiResponse;
import org.iskcon.iys.shared.security.JwtService;
import org.iskcon.iys.shared.security.SecurityUtils;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Authentication", description = "Login, logout, token refresh")
public class AuthController {

    private final AuthService authService;
    private final UserService userService;
    private final JwtService jwtService;

    @PostMapping("/login")
    @Operation(summary = "Login")
    public ResponseEntity<ApiResponse<TokenResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpServletRequest) {
        
        String ipAddress = httpServletRequest.getRemoteAddr();
        String deviceInfo = httpServletRequest.getHeader("User-Agent");
        
        TokenResponse tokenResponse = authService.login(request, ipAddress, deviceInfo);
        return ResponseEntity.ok(ApiResponse.success(tokenResponse));
    }

    @PostMapping("/register")
    @Operation(summary = "Register new user")
    public ResponseEntity<ApiResponse<TokenResponse>> register(@Valid @RequestBody RegisterRequest request) {
        TokenResponse tokenResponse = userService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(tokenResponse));
    }

    @PostMapping("/refresh")
    @Operation(summary = "Refresh access token")
    public ResponseEntity<ApiResponse<TokenResponse>> refresh(@Valid @RequestBody RefreshTokenRequest request) {
        TokenResponse tokenResponse = authService.refreshToken(request.refreshToken());
        return ResponseEntity.ok(ApiResponse.success(tokenResponse));
    }

    @PostMapping("/logout")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Logout current session")
    public ResponseEntity<ApiResponse<String>> logout(@RequestHeader("Authorization") String authHeader) {
        String token = authHeader.substring(7);
        String jti = jwtService.parseAndValidate(token).getId();
        authService.logout(token, jti);
        return ResponseEntity.ok(ApiResponse.success("Logged out successfully."));
    }

    @PostMapping("/change-password")
    @PreAuthorize("isAuthenticated()")
    @Operation(summary = "Change own password")
    public ResponseEntity<ApiResponse<String>> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        authService.changePassword(SecurityUtils.getCurrentUser().getUserId(), request);
        return ResponseEntity.ok(ApiResponse.success("Password changed."));
    }
}
