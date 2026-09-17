package org.iskcon.iys.modules.identity.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.iskcon.iys.modules.identity.domain.enums.UserStatus;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    private UUID id;
    private UUID centreId;
    private String email;
    private String phone;
    private UserStatus status;
    private Instant createdAt;
    private Instant lastLoginAt;
    private List<String> roles;
    private List<String> permissions;
}
