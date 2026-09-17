package org.iskcon.iys.modules.identity.application;

import java.util.UUID;
import org.iskcon.iys.modules.identity.domain.enums.UserStatus;
import org.iskcon.iys.modules.identity.dto.AssignRoleRequest;
import org.iskcon.iys.modules.identity.dto.RegisterRequest;
import org.iskcon.iys.modules.identity.dto.TokenResponse;
import org.iskcon.iys.modules.identity.dto.UserResponse;
import org.iskcon.iys.shared.dto.PageResponse;
import org.springframework.data.domain.Pageable;

public interface UserService {
    TokenResponse register(RegisterRequest request);
    UserResponse getUserById(UUID id);
    UserResponse getMe();
    PageResponse<UserResponse> getUsersByCentre(UUID centreId, UserStatus status, Pageable pageable);
    UserResponse assignRole(UUID userId, AssignRoleRequest request);
    UserResponse revokeRole(UUID userId, UUID roleId, UUID centreId);
    void updateUserStatus(UUID userId, UserStatus newStatus);
    java.util.List<org.iskcon.iys.modules.identity.dto.RoleResponse> getAllRoles();
    UUID getOrCreateDevoteeUser(String email, UUID centreId, String phone);
}
