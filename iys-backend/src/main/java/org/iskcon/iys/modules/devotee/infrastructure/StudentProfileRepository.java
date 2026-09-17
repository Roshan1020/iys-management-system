package org.iskcon.iys.modules.devotee.infrastructure;

import org.iskcon.iys.modules.devotee.domain.StudentProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface StudentProfileRepository extends JpaRepository<StudentProfile, UUID> {
    Optional<StudentProfile> findByDevoteeProfileId(UUID devoteeId);
}
