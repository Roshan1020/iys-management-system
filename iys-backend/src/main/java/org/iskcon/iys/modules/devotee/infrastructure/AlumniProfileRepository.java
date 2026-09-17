package org.iskcon.iys.modules.devotee.infrastructure;

import org.iskcon.iys.modules.devotee.domain.AlumniProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface AlumniProfileRepository extends JpaRepository<AlumniProfile, UUID> {
    Optional<AlumniProfile> findByDevoteeProfileId(UUID devoteeId);
}
