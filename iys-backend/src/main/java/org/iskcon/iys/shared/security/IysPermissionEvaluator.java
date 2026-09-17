package org.iskcon.iys.shared.security;

import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.PermissionEvaluator;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Component;

import java.io.Serializable;
import java.util.UUID;

/**
 * Custom {@link PermissionEvaluator} enabling fine-grained {@code @PreAuthorize} checks.
 *
 * <p>Usage in service methods:
 * <pre>
 *   {@literal @}PreAuthorize("hasPermission(#centreId, 'centre', 'admin:manage')")
 *   public void adminAction(UUID centreId) { ... }
 * </pre>
 *
 * <p>Current implementation resolves:
 * <ul>
 *   <li>{@code hasPermission(targetId, targetType, permission)} →
 *       checks that the principal has the permission AND belongs to the same centre</li>
 * </ul>
 */
@Slf4j
@Component
public class IysPermissionEvaluator implements PermissionEvaluator {

    /**
     * Evaluates {@code hasPermission(target, permission)} where target is a domain object.
     * Not used in IYS — we always work with IDs.
     */
    @Override
    public boolean hasPermission(Authentication auth, Object targetDomainObject, Object permission) {
        return false; // not used
    }

    /**
     * Evaluates {@code hasPermission(targetId, targetType, permission)}.
     *
     * @param auth       the current authentication
     * @param targetId   the ID of the target resource (e.g. centreId as String or UUID)
     * @param targetType the type name (e.g. "centre", "devotee", "event")
     * @param permission the permission string (e.g. "admin:manage", "devotee:read:centre")
     */
    @Override
    public boolean hasPermission(Authentication auth,
                                 Serializable targetId,
                                 String targetType,
                                 Object permission) {

        if (auth == null || !(auth.getPrincipal() instanceof UserPrincipal principal)) {
            return false;
        }

        String permissionStr = permission.toString();

        // SUPER_ADMIN bypasses all permission checks
        if (principal.isSuperAdmin()) {
            return true;
        }

        // Check that the principal has the required permission
        if (!principal.getPermissions().contains(permissionStr)) {
            log.debug("Permission denied: user {} lacks permission '{}'", principal.getUserId(), permissionStr);
            return false;
        }

        // If targetId is a centreId, enforce centre isolation
        if (targetId != null && "centre".equals(targetType)) {
            try {
                UUID targetCentreId = targetId instanceof UUID
                        ? (UUID) targetId
                        : UUID.fromString(targetId.toString());
                boolean belongs = principal.belongsToCentre(targetCentreId);
                if (!belongs) {
                    log.debug("Centre isolation denied: user {} (centre {}) tried to access centre {}",
                            principal.getUserId(), principal.getCentreId(), targetCentreId);
                }
                return belongs;
            } catch (IllegalArgumentException ex) {
                log.warn("Invalid UUID for centre check: {}", targetId);
                return false;
            }
        }

        return true;
    }
}
