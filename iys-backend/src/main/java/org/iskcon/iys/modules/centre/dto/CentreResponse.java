package org.iskcon.iys.modules.centre.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.Instant;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CentreResponse {
    private UUID id;
    private String name;
    private String shortCode;
    private String city;
    private String state;
    private String country;
    private String timezone;
    private String address;
    private String contactEmail;
    private String contactPhone;
    private String logoUrl;

    @JsonProperty("isActive")
    private boolean isActive;

    private Instant createdAt;
    private Instant updatedAt;
}
