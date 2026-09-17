package org.iskcon.iys.shared.security;

import org.iskcon.iys.shared.exception.UnauthorizedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * Utility class providing static accessors to the currently-authenticated
 * {@link UserPrincipal} from the Spring Security context.
 *
 * <p>Usage in service layer:
 * <pre>
 *   UserPrincipal me = SecurityUtils.getCurrentUser();
 *   UUID myId = me.getUserId();
 * </pre>
 */
@Component
public final class SecurityUtils {

    private SecurityUtils() {}

    /**
     * Returns the {@link UserPrincipal} for the current request.
     *
     * @throws UnauthorizedException if no authenticated user is present
     */
    public static UserPrincipal getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || !(auth.getPrincipal() instanceof UserPrincipal)) {
            throw new UnauthorizedException("No authenticated user in current request context.");
        }
        return (UserPrincipal) auth.getPrincipal();
    }

    /**
     * Returns the current user, or {@code null} if not authenticated.
     * Use in contexts where authentication is optional.
     */
    public static UserPrincipal getCurrentUserOrNull() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated() && auth.getPrincipal() instanceof UserPrincipal) {
            return (UserPrincipal) auth.getPrincipal();
        }
        return null;
    }
}
