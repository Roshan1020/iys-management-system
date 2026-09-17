package org.iskcon.iys;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * IYS — ISKCON Youth Management System
 *
 * <p>Modular monolith: each module under {@code org.iskcon.iys.modules} is a
 * self-contained vertical slice (api / application / domain / infrastructure / dto).
 * Modules communicate only via public service interfaces and Spring Application Events —
 * making the future extraction into microservices a pure wiring change.</p>
 */
@SpringBootApplication
@ConfigurationPropertiesScan
@EnableAsync
public class IysApplication {

    public static void main(String[] args) {
        SpringApplication.run(IysApplication.class, args);
    }
}
