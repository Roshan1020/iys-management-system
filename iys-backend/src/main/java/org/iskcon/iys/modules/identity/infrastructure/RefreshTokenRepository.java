package org.iskcon.iys.modules.identity.infrastructure;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.iskcon.iys.modules.identity.domain.RefreshToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, UUID> {
    Optional<RefreshToken> findByTokenHash(String tokenHash);
    void deleteByUserId(UUID userId);
    void deleteByExpiresAtBefore(Instant now);
    List<RefreshToken> findByUserIdAndRevokedAtIsNull(UUID userId);
}
