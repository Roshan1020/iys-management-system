package org.iskcon.iys.modules.devotee.application;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.iskcon.iys.modules.devotee.domain.AlumniProfile;
import org.iskcon.iys.modules.devotee.domain.DevoteeProfile;
import org.iskcon.iys.modules.devotee.domain.ProfessionalProfile;
import org.iskcon.iys.modules.devotee.domain.StudentProfile;
import org.iskcon.iys.modules.devotee.domain.enums.ProfileType;
import org.iskcon.iys.modules.devotee.dto.*;
import org.iskcon.iys.modules.devotee.infrastructure.AlumniProfileRepository;
import org.iskcon.iys.modules.devotee.infrastructure.DevoteeRepository;
import org.iskcon.iys.modules.devotee.infrastructure.ProfessionalProfileRepository;
import org.iskcon.iys.modules.devotee.infrastructure.StudentProfileRepository;
import org.iskcon.iys.shared.dto.PageResponse;
import org.iskcon.iys.shared.exception.DuplicateResourceException;
import org.iskcon.iys.shared.exception.ErrorCode;
import org.iskcon.iys.shared.exception.ForbiddenException;
import org.iskcon.iys.shared.exception.ResourceNotFoundException;
import org.iskcon.iys.shared.security.SecurityUtils;
import org.iskcon.iys.shared.security.UserPrincipal;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.iskcon.iys.modules.identity.application.UserService;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.UUID;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class DevoteeServiceImpl implements DevoteeService {

    private final DevoteeRepository devoteeRepository;
    private final StudentProfileRepository studentProfileRepository;
    private final ProfessionalProfileRepository professionalProfileRepository;
    private final AlumniProfileRepository alumniProfileRepository;
    private final UserService userService;

    private void checkCentreAccess(UUID centreId) {
        UserPrincipal currentUser = SecurityUtils.getCurrentUser();
        if (currentUser == null) {
            throw new ForbiddenException("Unauthenticated access.");
        }
        if (centreId == null) {
            if (!currentUser.isSuperAdmin()) {
                throw new ForbiddenException("Access denied to view all centres.");
            }
            return;
        }
        if (!currentUser.isSuperAdmin() && !centreId.equals(currentUser.getCentreId())) {
            throw new ForbiddenException("Access denied to centre data.");
        }
    }

    @Override
    public DevoteeResponse createDevotee(CreateDevoteeRequest request) {
        checkCentreAccess(request.centreId());

        UUID targetUserId = (request.userId() != null)
                ? request.userId()
                : userService.getOrCreateDevoteeUser(request.email(), request.centreId(), request.phone());

        if (devoteeRepository.existsByUserId(targetUserId)) {
            throw new DuplicateResourceException(ErrorCode.DEVOTEE_PROFILE_EXISTS, "Devotee profile already exists for this user.");
        }

        DevoteeProfile entity = DevoteeMapper.toEntity(request);
        entity.setUserId(targetUserId);
        UUID currentUserId = SecurityUtils.getCurrentUser() != null ? SecurityUtils.getCurrentUser().getUserId() : null;
        entity.setCreatedBy(currentUserId);
        entity.setUpdatedBy(currentUserId);
        DevoteeProfile saved = devoteeRepository.save(entity);
        return DevoteeMapper.toResponse(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public DevoteeResponse getDevoteeById(UUID id) {
        DevoteeProfile devotee = devoteeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.DEVOTEE_NOT_FOUND, "Devotee not found"));
        checkCentreAccess(devotee.getCentreId());
        return DevoteeMapper.toResponse(devotee);
    }

    @Override
    @Transactional(readOnly = true)
    public DevoteeResponse getDevoteeByUserId(UUID userId) {
        DevoteeProfile devotee = devoteeRepository.findByUserId(userId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.DEVOTEE_NOT_FOUND, "Devotee not found"));
        checkCentreAccess(devotee.getCentreId());
        return DevoteeMapper.toResponse(devotee);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<DevoteeSummaryResponse> getDevoteesByCentre(UUID centreId, ProfileType profileType, String search, Pageable pageable) {
        UserPrincipal currentUser = SecurityUtils.getCurrentUser();
        UUID effectiveCentreId = centreId;
        if (effectiveCentreId == null && (currentUser == null || !currentUser.isSuperAdmin())) {
            effectiveCentreId = currentUser != null ? currentUser.getCentreId() : null;
        }

        if (effectiveCentreId != null) {
            checkCentreAccess(effectiveCentreId);
        }

        Page<DevoteeProfile> page;
        if (effectiveCentreId == null) {
            if (search != null && !search.isBlank()) {
                page = devoteeRepository.searchAll(search, pageable);
            } else if (profileType != null) {
                page = devoteeRepository.findAllByProfileType(profileType, pageable);
            } else {
                page = devoteeRepository.findAll(pageable);
            }
        } else {
            if (search != null && !search.isBlank()) {
                page = devoteeRepository.searchByCentreId(effectiveCentreId, search, pageable);
            } else if (profileType != null) {
                page = devoteeRepository.findAllByCentreIdAndProfileType(effectiveCentreId, profileType, pageable);
            } else {
                page = devoteeRepository.findAllByCentreId(effectiveCentreId, pageable);
            }
        }
        return PageResponse.from(page.map(DevoteeMapper::toSummary));
    }

    @Override
    public DevoteeResponse updateDevotee(UUID id, UpdateDevoteeRequest request) {
        DevoteeProfile devotee = devoteeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.DEVOTEE_NOT_FOUND, "Devotee not found"));
        checkCentreAccess(devotee.getCentreId());
        if (request.centreId() != null) {
            checkCentreAccess(request.centreId());
        }
        DevoteeMapper.updateEntity(devotee, request);
        devotee.setUpdatedBy(SecurityUtils.getCurrentUser().getUserId());
        DevoteeProfile updated = devoteeRepository.save(devotee);
        return DevoteeMapper.toResponse(updated);
    }

    @Override
    public void deleteDevotee(UUID id) {
        DevoteeProfile devotee = devoteeRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.DEVOTEE_NOT_FOUND, "Devotee not found"));
        checkCentreAccess(devotee.getCentreId());
        devotee.setDeletedAt(Instant.now());
        devotee.setDeletedBy(SecurityUtils.getCurrentUser().getUserId());
        devoteeRepository.save(devotee);
    }

    @Override
    public DevoteeResponse upsertStudentProfile(UUID devoteeId, StudentProfileRequest request) {
        DevoteeProfile devotee = devoteeRepository.findById(devoteeId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.DEVOTEE_NOT_FOUND, "Devotee not found"));
        checkCentreAccess(devotee.getCentreId());

        StudentProfile studentProfile = studentProfileRepository.findByDevoteeProfileId(devoteeId)
                .orElse(DevoteeMapper.toStudentProfile(request, devotee));

        if (studentProfile.getId() != null) {
            DevoteeMapper.updateStudentProfile(studentProfile, request);
        }
        studentProfileRepository.save(studentProfile);
        devotee.setStudentProfile(studentProfile);
        return DevoteeMapper.toResponse(devotee);
    }

    @Override
    public DevoteeResponse upsertProfessionalProfile(UUID devoteeId, ProfessionalProfileRequest request) {
        DevoteeProfile devotee = devoteeRepository.findById(devoteeId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.DEVOTEE_NOT_FOUND, "Devotee not found"));
        checkCentreAccess(devotee.getCentreId());

        ProfessionalProfile professionalProfile = professionalProfileRepository.findByDevoteeProfileId(devoteeId)
                .orElse(DevoteeMapper.toProfessionalProfile(request, devotee));

        if (professionalProfile.getId() != null) {
            DevoteeMapper.updateProfessionalProfile(professionalProfile, request);
        }
        professionalProfileRepository.save(professionalProfile);
        devotee.setProfessionalProfile(professionalProfile);
        return DevoteeMapper.toResponse(devotee);
    }

    @Override
    public DevoteeResponse upsertAlumniProfile(UUID devoteeId, AlumniProfileRequest request) {
        DevoteeProfile devotee = devoteeRepository.findById(devoteeId)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.DEVOTEE_NOT_FOUND, "Devotee not found"));
        checkCentreAccess(devotee.getCentreId());

        AlumniProfile alumniProfile = alumniProfileRepository.findByDevoteeProfileId(devoteeId)
                .orElse(DevoteeMapper.toAlumniProfile(request, devotee));

        if (alumniProfile.getId() != null) {
            DevoteeMapper.updateAlumniProfile(alumniProfile, request);
        }
        alumniProfileRepository.save(alumniProfile);
        devotee.setAlumniProfile(alumniProfile);
        return DevoteeMapper.toResponse(devotee);
    }
}
