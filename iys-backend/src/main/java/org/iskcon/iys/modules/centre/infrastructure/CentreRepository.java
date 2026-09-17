package org.iskcon.iys.modules.centre.infrastructure;

import java.util.Optional;
import java.util.UUID;
import org.iskcon.iys.modules.centre.domain.Centre;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CentreRepository extends JpaRepository<Centre, UUID> {
    Optional<Centre> findByShortCodeIgnoreCase(String shortCode);
    Page<Centre> findAllByIsActive(boolean isActive, Pageable pageable);
}
