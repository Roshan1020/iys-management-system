package org.iskcon.iys.shared.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.SecurityRequirement;
import io.swagger.v3.oas.models.security.SecurityScheme;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * SpringDoc OpenAPI 3.1 configuration.
 *
 * <p>Configures a JWT Bearer security scheme so that Swagger UI shows
 * an "Authorize" button for testing protected endpoints.
 */
@Configuration
public class OpenApiConfig {

    private static final String SECURITY_SCHEME_NAME = "BearerAuth";

    @Bean
    public OpenAPI openAPI() {
        return new OpenAPI()
                .info(new Info()
                        .title("IYS — ISKCON Youth Management System API")
                        .description("REST API for the multi-centre ISKCON Youth Management Platform. "
                                + "All endpoints require a valid JWT access token unless marked public.")
                        .version("v1.0.0")
                        .contact(new Contact()
                                .name("IYS Development Team")
                                .email("dev@iskcon-iys.org"))
                        .license(new License()
                                .name("Private — ISKCON Internal")))
                .addSecurityItem(new SecurityRequirement().addList(SECURITY_SCHEME_NAME))
                .components(new Components()
                        .addSecuritySchemes(SECURITY_SCHEME_NAME,
                                new SecurityScheme()
                                        .name(SECURITY_SCHEME_NAME)
                                        .type(SecurityScheme.Type.HTTP)
                                        .scheme("bearer")
                                        .bearerFormat("JWT")
                                        .description("Paste the access token received from POST /api/v1/auth/login")));
    }
}
