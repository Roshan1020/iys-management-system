package org.iskcon.iys.modules.devotee.application;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.iskcon.iys.modules.devotee.domain.DevoteeProfile;
import org.iskcon.iys.modules.devotee.domain.enums.InitiationStatus;
import org.iskcon.iys.modules.devotee.domain.enums.ProfileType;
import org.iskcon.iys.modules.devotee.infrastructure.DevoteeRepository;
import org.iskcon.iys.modules.identity.event.UserRegisteredEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

import java.time.LocalDate;

@Component
@RequiredArgsConstructor
@Slf4j
public class DevoteeEventListener {

    private final DevoteeRepository devoteeRepository;

    @EventListener
    public void onUserRegistered(UserRegisteredEvent event) {
        if (!devoteeRepository.existsByUserId(event.userId())) {
            DevoteeProfile devoteeProfile = DevoteeProfile.builder()
                    .userId(event.userId())
                    .centreId(event.centreId())
                    .legalName(event.legalName() != null && !event.legalName().isBlank() ? event.legalName() : event.email())
                    .initiatedName(event.initiatedName())
                    .phone(event.phone())
                    .profileType(ProfileType.OTHER)
                    .initiationStatus(InitiationStatus.UNINITIATED)
                    .joinDate(LocalDate.now())
                    .isRegular(true)
                    .build();
            devoteeRepository.save(devoteeProfile);
            log.info("Auto-provisioned DevoteeProfile for user {} via UserRegisteredEvent", event.userId());
        }
    }
}
