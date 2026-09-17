package org.iskcon.iys.modules.devotee.infrastructure;

import org.iskcon.iys.modules.devotee.domain.DevoteeProfile;
import org.iskcon.iys.modules.devotee.domain.enums.ProfileType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface DevoteeRepository extends JpaRepository<DevoteeProfile, UUID> {
    Optional<DevoteeProfile> findByUserId(UUID userId);
    
    boolean existsByUserId(UUID userId);
    
    Page<DevoteeProfile> findAllByCentreId(UUID centreId, Pageable pageable);
    
    Page<DevoteeProfile> findAllByCentreIdAndProfileType(UUID centreId, ProfileType profileType, Pageable pageable);
    
    Page<DevoteeProfile> findAllByProfileType(ProfileType profileType, Pageable pageable);

    @Query("SELECT d FROM DevoteeProfile d WHERE d.centreId = :centreId AND (LOWER(d.legalName) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(d.initiatedName) LIKE LOWER(CONCAT('%', :search, '%'))) AND d.deletedAt IS NULL")
    Page<DevoteeProfile> searchByCentreId(@Param("centreId") UUID centreId, @Param("search") String search, Pageable pageable);

    @Query("SELECT d FROM DevoteeProfile d WHERE (LOWER(d.legalName) LIKE LOWER(CONCAT('%', :search, '%')) OR LOWER(d.initiatedName) LIKE LOWER(CONCAT('%', :search, '%'))) AND d.deletedAt IS NULL")
    Page<DevoteeProfile> searchAll(@Param("search") String search, Pageable pageable);
}
