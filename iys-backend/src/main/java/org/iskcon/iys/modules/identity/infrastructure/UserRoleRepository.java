package org.iskcon.iys.modules.identity.infrastructure;

import java.util.List;
import java.util.UUID;
import org.iskcon.iys.modules.identity.domain.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRoleRepository extends JpaRepository<UserRole, UUID> {
    
    @Query("SELECT ur FROM UserRole ur JOIN FETCH ur.role r JOIN FETCH r.permissions WHERE ur.userId = :userId AND ur.revokedAt IS NULL")
    List<UserRole> findActiveRolesByUserId(@Param("userId") UUID userId);
    
    boolean existsByUserIdAndRoleIdAndCentreIdAndRevokedAtIsNull(UUID userId, UUID roleId, UUID centreId);
}
