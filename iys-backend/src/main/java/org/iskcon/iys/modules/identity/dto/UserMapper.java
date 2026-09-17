package org.iskcon.iys.modules.identity.dto;

import java.util.List;
import org.iskcon.iys.modules.identity.domain.User;

public class UserMapper {

    private UserMapper() {}

    public static UserResponse toResponse(User user, List<String> roles, List<String> permissions) {
        if (user == null) {
            return null;
        }
        return UserResponse.builder()
                .id(user.getId())
                .centreId(user.getCentreId())
                .email(user.getEmail())
                .phone(user.getPhone())
                .status(user.getStatus())
                .createdAt(user.getCreatedAt())
                .lastLoginAt(user.getLastLoginAt())
                .roles(roles)
                .permissions(permissions)
                .build();
    }

    public static UserSummaryResponse toSummary(User user) {
        if (user == null) {
            return null;
        }
        return UserSummaryResponse.builder()
                .id(user.getId())
                .centreId(user.getCentreId())
                .email(user.getEmail())
                .status(user.getStatus())
                .build();
    }
}
