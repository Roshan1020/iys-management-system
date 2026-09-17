package org.iskcon.iys.modules.identity.dto;

import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoleResponse {
    private UUID id;
    private String name;
    private String description;
    private UUID centreId;
    private boolean isSystemRole;
}
