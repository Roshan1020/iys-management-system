package org.iskcon.iys.modules.identity.application;

import java.util.List;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.iskcon.iys.modules.identity.domain.User;
import org.iskcon.iys.modules.identity.domain.UserRole;
import org.iskcon.iys.modules.identity.domain.enums.UserStatus;
import org.iskcon.iys.modules.identity.infrastructure.UserRepository;
import org.iskcon.iys.modules.identity.infrastructure.UserRoleRepository;
import org.iskcon.iys.shared.security.UserPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("User not found with email: " + email));

        if (user.getDeletedAt() != null) {
            throw new UsernameNotFoundException("User account is deleted");
        }

        if (user.getStatus() == UserStatus.INACTIVE || user.getStatus() == UserStatus.SUSPENDED) {
            throw new UsernameNotFoundException("User account is " + user.getStatus());
        }

        List<UserRole> activeRoles = userRoleRepository.findActiveRolesByUserId(user.getId());

        List<String> roles = activeRoles.stream()
                .map(ur -> ur.getRole().getName())
                .distinct()
                .collect(Collectors.toList());

        List<String> permissions = activeRoles.stream()
                .flatMap(ur -> ur.getRole().getPermissions().stream())
                .map(p -> p.toPermissionString())
                .distinct()
                .collect(Collectors.toList());

        return new UserPrincipal(
                user.getId(),
                user.getCentreId(),
                user.getEmail(),
                user.getPasswordHash(),
                user.getStatus() == UserStatus.ACTIVE,
                roles,
                permissions
        );
    }
}
