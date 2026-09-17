package org.iskcon.iys.modules.identity.infrastructure;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.iskcon.iys.modules.identity.domain.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RoleRepository extends JpaRepository<Role, UUID> {
    Optional<Role> findByNameAndCentreIdIsNull(String name);
    List<Role> findAllByCentreIdIsNull();
    boolean existsByNameAndCentreIdIsNull(String name);
}
