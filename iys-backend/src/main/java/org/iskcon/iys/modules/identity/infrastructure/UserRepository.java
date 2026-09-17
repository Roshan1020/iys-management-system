package org.iskcon.iys.modules.identity.infrastructure;

import java.util.Optional;
import java.util.UUID;
import org.iskcon.iys.modules.identity.domain.User;
import org.iskcon.iys.modules.identity.domain.enums.UserStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {
    Optional<User> findByEmail(String email);
    
    boolean existsByEmailAndDeletedAtIsNull(String email);
    
    Page<User> findAllByCentreId(UUID centreId, Pageable pageable);
    
    @Query("SELECT u FROM User u WHERE u.centreId = :centreId AND u.status = :status AND u.deletedAt IS NULL")
    Page<User> findByCentreIdAndStatus(@Param("centreId") UUID centreId, @Param("status") UserStatus status, Pageable pageable);

    @Query("SELECT u FROM User u WHERE u.status = :status AND u.deletedAt IS NULL")
    Page<User> findAllByStatus(@Param("status") UserStatus status, Pageable pageable);
}
