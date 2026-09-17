package org.iskcon.iys.modules.centre.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

@Schema(description = "Request object for creating a new centre")
public record CreateCentreRequest(
    @NotBlank String name,
    @NotBlank @Size(max = 10) String shortCode,
    @NotBlank String city,
    String state,
    @Schema(description = "Country name, defaults to India if not provided") String country,
    String timezone,
    String address,
    @Email String contactEmail,
    String contactPhone
) {
    public CreateCentreRequest(String name, String shortCode) {
        this(name, shortCode, "Pune", null, "India", "Asia/Kolkata", null, null, null);
    }
}
