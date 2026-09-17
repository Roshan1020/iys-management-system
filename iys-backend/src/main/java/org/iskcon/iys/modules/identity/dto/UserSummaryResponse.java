package org.iskcon.iys.modules.identity.dto;

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
public class UserSummaryResponse {
    private UUID id;
    private UUID centreId;
    private String email;
    private UserStatus status;
}
