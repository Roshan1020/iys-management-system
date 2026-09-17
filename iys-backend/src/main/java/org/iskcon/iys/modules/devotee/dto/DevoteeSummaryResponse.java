package org.iskcon.iys.modules.devotee.dto;

import lombok.*;

import java.time.Instant;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DevoteeSummaryResponse {
    private UUID id;
    private UUID centreId;
    private String legalName;
    private String initiatedName;
    private String profileType;
    private String initiationStatus;
    private String city;
    private Instant createdAt;
}
