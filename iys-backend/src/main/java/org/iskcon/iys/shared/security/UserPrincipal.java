package org.iskcon.iys.shared.security;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Collection;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * Spring Security {@link UserDetails} implementation that carries all
 * identity context needed by the application without DB round-trips per request.
 *
 * <p>Built by {@link org.iskcon.iys.modules.identity.application.CustomUserDetailsService}
 * at login time, then reconstructed from JWT claims in {@link JwtAuthFilter}.</p>
 */
public class UserPrincipal implements UserDetails {

    private final UUID   userId;
    private final UUID   centreId;
    private final String email;
    private final String passwordHash;  // only present when loaded via UserDetailsService
    private final boolean active;
    private final List<String> roles;
    private final List<String> permissions;
    private final Collection<? extends GrantedAuthority> authorities;

    public UserPrincipal(UUID userId,
                         UUID centreId,
                         String email,
                         String passwordHash,
                         boolean active,
                         List<String> roles,
                         List<String> permissions) {
        this.userId       = userId;
        this.centreId     = centreId;
        this.email        = email;
        this.passwordHash = passwordHash;
        this.active       = active;
        this.roles        = roles;
        this.permissions  = permissions;

        // Merge roles (ROLE_ prefix) + permissions into a single authority list
        this.authorities = Stream.concat(
                roles.stream().map(r -> new SimpleGrantedAuthority("ROLE_" + r)),
                permissions.stream().map(SimpleGrantedAuthority::new)
        ).collect(Collectors.toUnmodifiableList());
    }

    public UserPrincipal(UUID userId,
                         UUID centreId,
                         String email,
                         String passwordHash,
                         List<String> roles) {
        this(userId, centreId, email, passwordHash, true, roles, List.of());
    }

    // ── Getters ─────────────────────────────────────────────────

    public UUID getUserId()              { return userId; }
    public UUID getCentreId()            { return centreId; }
    public List<String> getRoles()       { return roles; }
    public List<String> getPermissions() { return permissions; }

    // ── UserDetails ─────────────────────────────────────────────

    @Override public Collection<? extends GrantedAuthority> getAuthorities() { return authorities; }
    @Override public String getPassword()  { return passwordHash; }
    @Override public String getUsername()  { return email; }
    @Override public boolean isAccountNonExpired()   { return true; }
    @Override public boolean isAccountNonLocked()    { return active; }
    @Override public boolean isCredentialsNonExpired(){ return true; }
    @Override public boolean isEnabled()             { return active; }

    // ── Helper: does this principal have a given role? ──────────

    public boolean hasRole(String role) {
        return roles.contains(role);
    }

    public boolean isSuperAdmin() {
        return roles.contains("SUPER_ADMIN");
    }

    /** Returns true if this user's home centre matches the given centreId (or is a SUPER_ADMIN). */
    public boolean belongsToCentre(UUID targetCentreId) {
        return isSuperAdmin() || centreId.equals(targetCentreId);
    }
}
