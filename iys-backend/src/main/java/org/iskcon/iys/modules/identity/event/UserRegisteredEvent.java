package org.iskcon.iys.modules.identity.event;

import java.util.UUID;

public record UserRegisteredEvent(
        UUID userId,
        UUID centreId,
        String email,
        String legalName,
        String initiatedName,
        String phone
) {
}
