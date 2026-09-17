package org.iskcon.iys.shared.config;

import org.iskcon.iys.shared.security.SecurityUtils;
import org.iskcon.iys.shared.security.UserPrincipal;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.domain.AuditorAware;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

import java.util.Optional;
import java.util.UUID;

/**
 * JPA configuration: wires the Spring Data auditor provider so that
 * {@code @CreatedBy} and {@code @LastModifiedBy} are automatically populated
 * with the current user's UUID on every entity save.
 */
@Configuration
@EnableJpaAuditing(auditorAwareRef = "auditorProvider")
public class JpaConfig {

    /**
     * Returns the UUID of the currently-authenticated user.
     * Returns {@link Optional#empty()} for system/anonymous operations.
     */
    @Bean
    public AuditorAware<UUID> auditorProvider() {
        return () -> {
            UserPrincipal principal = SecurityUtils.getCurrentUserOrNull();
            return Optional.ofNullable(principal != null ? principal.getUserId() : null);
        };
    }
}
