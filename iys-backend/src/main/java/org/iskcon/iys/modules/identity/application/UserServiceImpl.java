package org.iskcon.iys.modules.identity.application;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.iskcon.iys.modules.identity.domain.Role;
import org.iskcon.iys.modules.identity.domain.User;
import org.iskcon.iys.modules.identity.domain.UserRole;
import org.iskcon.iys.modules.identity.domain.enums.UserStatus;
import org.iskcon.iys.modules.identity.dto.AssignRoleRequest;
import org.iskcon.iys.modules.identity.dto.RegisterRequest;
import org.iskcon.iys.modules.identity.dto.TokenResponse;
import org.iskcon.iys.modules.identity.dto.UserMapper;
import org.iskcon.iys.modules.identity.dto.RoleResponse;
import org.iskcon.iys.modules.identity.dto.UserResponse;
import org.iskcon.iys.modules.identity.infrastructure.RoleRepository;
import org.iskcon.iys.modules.identity.infrastructure.UserRepository;
import org.iskcon.iys.modules.identity.infrastructure.UserRoleRepository;
import org.iskcon.iys.shared.dto.PageResponse;
import org.iskcon.iys.shared.exception.DuplicateResourceException;
import org.iskcon.iys.shared.exception.ErrorCode;
import org.iskcon.iys.shared.exception.ForbiddenException;
import org.iskcon.iys.shared.exception.ResourceNotFoundException;
import org.iskcon.iys.shared.exception.UnauthorizedException;
import org.iskcon.iys.shared.security.JwtService;
import org.iskcon.iys.shared.security.SecurityUtils;
import org.iskcon.iys.shared.security.UserPrincipal;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;
    private final UserRoleRepository userRoleRepository;
    private final RoleRepository roleRepository;
    private final JwtService jwtService;
    private final PasswordEncoder passwordEncoder;
    private final org.springframework.context.ApplicationEventPublisher eventPublisher;

    @Override
    public TokenResponse register(RegisterRequest request) {
        if (userRepository.existsByEmailAndDeletedAtIsNull(request.email())) {
            throw new DuplicateResourceException(ErrorCode.EMAIL_ALREADY_EXISTS, "Email is already in use.");
        }

        Role devoteeRole = roleRepository.findByNameAndCentreIdIsNull("DEVOTEE")
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.RESOURCE_NOT_FOUND, "System role DEVOTEE not found"));

        User user = User.builder()
                .centreId(request.centreId())
                .email(request.email())
                .passwordHash(passwordEncoder.encode(request.password()))
                .phone(request.phone())
                .status(UserStatus.PENDING_VERIFICATION)
                .build();
        
        user = userRepository.save(user);

        UserRole userRole = UserRole.builder()
                .userId(user.getId())
                .roleId(devoteeRole.getId())
                .role(devoteeRole)
                .centreId(request.centreId())
                .build();
        userRoleRepository.save(userRole);

        // Publish UserRegisteredEvent to decouple identity from devotee profile provisioning (RULE 3)
        eventPublisher.publishEvent(new org.iskcon.iys.modules.identity.event.UserRegisteredEvent(
                user.getId(),
                request.centreId(),
                user.getEmail(),
                request.legalName(),
                request.initiatedName(),
                request.phone(),
                request.profileType(),
                request.city(),
                request.initiationStatus()
        ));

        UserPrincipal principal = new UserPrincipal(
                user.getId(),
                user.getCentreId(),
                user.getEmail(),
                user.getPasswordHash(),
                false,
                List.of("DEVOTEE"),
                List.of()
        );

        String accessToken = jwtService.generateAccessToken(principal);

        return TokenResponse.builder()
                .accessToken(accessToken)
                .expiresInMs(jwtService.getAccessTokenExpiryMs())
                .userId(principal.getUserId())
                .email(principal.getUsername())
                .centreId(principal.getCentreId())
                .roles(principal.getRoles())
                .build();
    }

    @Override
    public UserResponse getUserById(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.RESOURCE_NOT_FOUND, "User not found"));
        
        return buildUserResponse(user);
    }

    @Override
    public UserResponse getMe() {
        UserPrincipal currentUser = SecurityUtils.getCurrentUser();
        if (currentUser == null) {
            throw new UnauthorizedException("Not authenticated");
        }
        return getUserById(currentUser.getUserId());
    }

    @Override
    public PageResponse<UserResponse> getUsersByCentre(UUID centreId, UserStatus status, Pageable pageable) {
        UserPrincipal currentUser = SecurityUtils.getCurrentUser();
        Page<User> page;

        if (centreId == null) {
            if (currentUser == null || !currentUser.getRoles().contains("SUPER_ADMIN")) {
                throw new org.iskcon.iys.shared.exception.ForbiddenException("Access denied to view all centres");
            }
            page = (status != null) ? userRepository.findAllByStatus(status, pageable) : userRepository.findAll(pageable);
        } else {
            if (currentUser == null || (!currentUser.getRoles().contains("SUPER_ADMIN") && !currentUser.getCentreId().equals(centreId))) {
                throw new org.iskcon.iys.shared.exception.ForbiddenException("Access denied to this centre");
            }
            page = (status != null) ? userRepository.findByCentreIdAndStatus(centreId, status, pageable) : userRepository.findAllByCentreId(centreId, pageable);
        }

        return PageResponse.from(page.map(this::buildUserResponse));
    }

    @Override
    public UserResponse assignRole(UUID userId, AssignRoleRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.RESOURCE_NOT_FOUND, "User not found"));

        UUID targetCentreId = request.centreId() != null ? request.centreId() : user.getCentreId();

        UserPrincipal currentUser = SecurityUtils.getCurrentUser();
        if (currentUser != null && !currentUser.isSuperAdmin()) {
            if (!currentUser.belongsToCentre(user.getCentreId()) || !currentUser.belongsToCentre(targetCentreId)) {
                throw new ForbiddenException("Access denied: You can only assign roles within your centre");
            }
        }

        Role targetRole = null;
        if (request.roleId() != null) {
            targetRole = roleRepository.findById(request.roleId()).orElse(null);
        }

        if (targetRole == null && request.roleName() != null && !request.roleName().isBlank()) {
            targetRole = roleRepository.findByNameAndCentreIdIsNull(request.roleName())
                    .or(() -> roleRepository.findAll().stream()
                            .filter(r -> r.getName().equalsIgnoreCase(request.roleName()))
                            .findFirst())
                    .orElse(null);
        }

        if (targetRole == null) {
            throw new ResourceNotFoundException(ErrorCode.RESOURCE_NOT_FOUND, "Role not found");
        }

        UUID targetRoleId = targetRole.getId();

        boolean alreadyAssigned = userRoleRepository.existsByUserIdAndRoleIdAndCentreIdAndRevokedAtIsNull(
                userId, targetRoleId, targetCentreId);

        if (alreadyAssigned) {
            throw new DuplicateResourceException(ErrorCode.DUPLICATE_RESOURCE, "Role is already assigned to this user in this centre");
        }

        UUID assignedBy = SecurityUtils.getCurrentUser() != null ? SecurityUtils.getCurrentUser().getUserId() : null;

        UserRole userRole = UserRole.builder()
                .userId(userId)
                .roleId(targetRoleId)
                .role(targetRole)
                .centreId(targetCentreId)
                .assignedBy(assignedBy)
                .build();

        userRoleRepository.save(userRole);

        // Auto-activate user if they were pending verification
        if (user.getStatus() == UserStatus.PENDING_VERIFICATION) {
            user.setStatus(UserStatus.ACTIVE);
            user = userRepository.save(user);
        }

        return buildUserResponse(user);
    }

    @Override
    public List<RoleResponse> getAllRoles() {
        return roleRepository.findAll().stream()
                .map(r -> RoleResponse.builder()
                        .id(r.getId())
                        .name(r.getName())
                        .description(r.getDescription())
                        .centreId(r.getCentreId())
                        .isSystemRole(r.isSystemRole())
                        .build())
                .toList();
    }

    @Override
    public UserResponse revokeRole(UUID userId, UUID roleId, UUID centreId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.RESOURCE_NOT_FOUND, "User not found"));

        UUID targetCentreId = centreId != null ? centreId : user.getCentreId();

        UserPrincipal currentUser = SecurityUtils.getCurrentUser();
        if (currentUser != null && !currentUser.isSuperAdmin()) {
            if (!currentUser.belongsToCentre(user.getCentreId()) || (targetCentreId != null && !currentUser.belongsToCentre(targetCentreId))) {
                throw new ForbiddenException("Access denied: You can only revoke roles within your centre");
            }
        }

        List<UserRole> activeRoles = userRoleRepository.findActiveRolesByUserId(userId);
        
        UserRole targetRole = activeRoles.stream()
                .filter(ur -> ur.getRoleId().equals(roleId) && (targetCentreId == null || ur.getCentreId().equals(targetCentreId)))
                .findFirst()
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.RESOURCE_NOT_FOUND, "Active role not found for this user"));

        UUID revokedBy = SecurityUtils.getCurrentUser() != null ? SecurityUtils.getCurrentUser().getUserId() : null;
        
        targetRole.setRevokedAt(Instant.now());
        targetRole.setRevokedBy(revokedBy);
        userRoleRepository.save(targetRole);

        return buildUserResponse(user);
    }

    @Override
    public void updateUserStatus(UUID userId, UserStatus newStatus) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.RESOURCE_NOT_FOUND, "User not found"));
        
        UserPrincipal currentUser = SecurityUtils.getCurrentUser();
        if (currentUser != null && !currentUser.isSuperAdmin()) {
            if (!currentUser.belongsToCentre(user.getCentreId())) {
                throw new ForbiddenException("Access denied: You can only update user status within your centre");
            }
        }

        user.setStatus(newStatus);
        userRepository.save(user);
        log.info("User {} status updated to {}", userId, newStatus);
    }

    private UserResponse buildUserResponse(User user) {
        List<UserRole> activeRoles = userRoleRepository.findActiveRolesByUserId(user.getId());
        List<String> roles = activeRoles.stream()
                .map(ur -> {
                    if (ur.getRole() != null) {
                        return ur.getRole().getName();
                    }
                    return roleRepository.findById(ur.getRoleId())
                            .map(Role::getName)
                            .orElse("UNKNOWN");
                })
                .distinct()
                .collect(Collectors.toList());

        List<String> permissions = activeRoles.stream()
                .flatMap(ur -> {
                    Role r = ur.getRole() != null ? ur.getRole() : roleRepository.findById(ur.getRoleId()).orElse(null);
                    return r != null && r.getPermissions() != null
                            ? r.getPermissions().stream()
                            : Stream.empty();
                })
                .map(p -> p.toPermissionString())
                .distinct()
                .collect(Collectors.toList());

        return UserMapper.toResponse(user, roles, permissions);
    }

    @Override
    public UUID getOrCreateDevoteeUser(String email, UUID centreId, String phone) {
        String targetEmail = (email != null && !email.isBlank())
                ? email.trim()
                : "devotee." + UUID.randomUUID().toString().substring(0, 8) + "@iys.org";

        User user = userRepository.findByEmail(targetEmail).orElse(null);
        if (user == null) {
            user = User.builder()
                    .centreId(centreId)
                    .email(targetEmail)
                    .passwordHash(passwordEncoder.encode(UUID.randomUUID().toString()))
                    .phone(phone != null && !phone.isBlank() ? phone.trim() : null)
                    .status(UserStatus.ACTIVE)
                    .build();
            user = userRepository.save(user);

            Role devoteeRole = roleRepository.findByNameAndCentreIdIsNull("DEVOTEE")
                    .orElse(null);
            if (devoteeRole != null) {
                UserRole userRole = UserRole.builder()
                        .userId(user.getId())
                        .roleId(devoteeRole.getId())
                        .role(devoteeRole)
                        .centreId(centreId)
                        .build();
                userRoleRepository.save(userRole);
            }
        } else {
            UserPrincipal currentUser = SecurityUtils.getCurrentUser();
            if (currentUser != null && !currentUser.isSuperAdmin() && user.getCentreId() != null && !user.getCentreId().equals(centreId)) {
                throw new ForbiddenException("A user with this email address already belongs to another youth centre.");
            }
        }
        return user.getId();
    }
}
