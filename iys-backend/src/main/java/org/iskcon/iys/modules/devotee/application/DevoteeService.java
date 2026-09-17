package org.iskcon.iys.modules.devotee.application;

import org.iskcon.iys.modules.devotee.domain.enums.ProfileType;
import org.iskcon.iys.modules.devotee.dto.*;
import org.iskcon.iys.shared.dto.PageResponse;
import org.springframework.data.domain.Pageable;

import java.util.UUID;

public interface DevoteeService {
    DevoteeResponse createDevotee(CreateDevoteeRequest request);
    DevoteeResponse getDevoteeById(UUID id);
    DevoteeResponse getDevoteeByUserId(UUID userId);
    PageResponse<DevoteeSummaryResponse> getDevoteesByCentre(UUID centreId, ProfileType profileType, String search, Pageable pageable);
    DevoteeResponse updateDevotee(UUID id, UpdateDevoteeRequest request);
    void deleteDevotee(UUID id);
    DevoteeResponse upsertStudentProfile(UUID devoteeId, StudentProfileRequest request);
    DevoteeResponse upsertProfessionalProfile(UUID devoteeId, ProfessionalProfileRequest request);
    DevoteeResponse upsertAlumniProfile(UUID devoteeId, AlumniProfileRequest request);
}
