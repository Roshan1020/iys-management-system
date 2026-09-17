package org.iskcon.iys.modules.devotee.infrastructure;

import org.iskcon.iys.modules.devotee.domain.ProfessionalProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProfessionalProfileRepository extends JpaRepository<ProfessionalProfile, UUID> {
    Optional<ProfessionalProfile> findByDevoteeProfileId(UUID devoteeId);
}
