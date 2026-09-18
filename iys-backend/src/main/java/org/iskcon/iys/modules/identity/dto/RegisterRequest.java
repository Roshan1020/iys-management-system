package org.iskcon.iys.modules.identity.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;

public record RegisterRequest(
        @NotBlank @Email String email,
        @NotBlank @Size(min = 8, max = 100) String password,
        @NotBlank String legalName,
        @NotNull UUID centreId,
        String phone,
        String initiatedName,
        String profileType,
        String city,
        String initiationStatus) {

    public RegisterRequest(String email, String password, String legalName, UUID centreId, String phone, String initiatedName) {
        this(email, password, legalName, centreId, phone, initiatedName, null, null, null);
    }
}
