package org.iskcon.iys.modules.identity.dto;

import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public record AssignRoleRequest(
    UUID roleId,
    String roleName,
    @NotNull UUID centreId
) {}
