package org.iskcon.iys.modules.identity.api;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.Map;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.iskcon.iys.modules.identity.application.UserService;
import org.iskcon.iys.modules.identity.domain.enums.UserStatus;
import org.iskcon.iys.modules.identity.dto.AssignRoleRequest;
import org.iskcon.iys.modules.identity.dto.RoleResponse;
import org.iskcon.iys.modules.identity.dto.UserResponse;
import org.iskcon.iys.shared.dto.ApiResponse;
import org.iskcon.iys.shared.dto.PageResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Users")
public class UserController {

    private final UserService userService;

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<UserResponse>> getMe() {
        return ResponseEntity.ok(ApiResponse.success(userService.getMe()));
    }

    @GetMapping("/roles")
    @PreAuthorize("hasRole('CENTRE_ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<java.util.List<RoleResponse>>> getAllRoles() {
        return ResponseEntity.ok(ApiResponse.success(userService.getAllRoles()));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('CENTRE_ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<UserResponse>> getUserById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(userService.getUserById(id)));
    }

    @GetMapping
    @PreAuthorize("hasRole('CENTRE_ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<PageResponse<UserResponse>>> getUsersByCentre(
            @RequestParam(required = false) UUID centreId,
            @RequestParam(required = false) UserStatus status,
            Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(userService.getUsersByCentre(centreId, status, pageable)));
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasRole('CENTRE_ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<String>> updateUserStatus(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {
        UserStatus newStatus = UserStatus.valueOf(body.get("status"));
        userService.updateUserStatus(id, newStatus);
        return ResponseEntity.ok(ApiResponse.success("User status updated."));
    }

    @PostMapping("/{id}/roles")
    @PreAuthorize("hasRole('CENTRE_ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<UserResponse>> assignRole(
            @PathVariable UUID id,
            @Valid @RequestBody AssignRoleRequest request) {
        return ResponseEntity.ok(ApiResponse.success(userService.assignRole(id, request)));
    }

    @DeleteMapping("/{id}/roles/{roleId}")
    @PreAuthorize("hasRole('CENTRE_ADMIN') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<UserResponse>> revokeRole(
            @PathVariable UUID id,
            @PathVariable UUID roleId,
            @RequestParam UUID centreId) {
        return ResponseEntity.ok(ApiResponse.success(userService.revokeRole(id, roleId, centreId)));
    }
}
