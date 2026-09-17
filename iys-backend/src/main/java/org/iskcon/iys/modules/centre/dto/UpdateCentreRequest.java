package org.iskcon.iys.modules.centre.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import org.springframework.lang.Nullable;

@Schema(description = "Request object for updating an existing centre")
public record UpdateCentreRequest(
    @Nullable String name,
    @Nullable @Size(max = 10) String shortCode,
    @Nullable String city,
    @Nullable String state,
    @Nullable String country,
    @Nullable String timezone,
    @Nullable String address,
    @Nullable @Email String contactEmail,
    @Nullable String contactPhone,
    @Nullable Boolean isActive,
    @Nullable String logoUrl
) {}
