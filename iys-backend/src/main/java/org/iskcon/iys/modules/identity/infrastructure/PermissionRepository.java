package org.iskcon.iys.modules.identity.infrastructure;

import java.util.List;
import java.util.UUID;
import org.iskcon.iys.modules.identity.domain.Permission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PermissionRepository extends JpaRepository<Permission, UUID> {
    List<Permission> findAllByModule(String module);
}
