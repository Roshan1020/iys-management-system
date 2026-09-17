package org.iskcon.iys.modules.identity.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

@Schema(description = "Request object for user login")
public record LoginRequest(
    @NotBlank @Email String email,
    @NotBlank String password
) {}
