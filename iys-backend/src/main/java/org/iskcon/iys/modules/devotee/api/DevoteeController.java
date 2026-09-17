package org.iskcon.iys.modules.devotee.api;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.iskcon.iys.modules.devotee.application.DevoteeService;
import org.iskcon.iys.modules.devotee.domain.enums.ProfileType;
import org.iskcon.iys.modules.devotee.dto.*;
import org.iskcon.iys.shared.dto.ApiResponse;
import org.iskcon.iys.shared.dto.PageResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/devotees")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Devotees", description = "Devotee profile management")
public class DevoteeController {

    private final DevoteeService devoteeService;

    @GetMapping
    @PreAuthorize("hasAnyRole('COUNSELLOR','CENTRE_ADMIN','SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<PageResponse<DevoteeSummaryResponse>>> getDevotees(
            @RequestParam(required = false) UUID centreId,
            @RequestParam(required = false) ProfileType profileType,
            @RequestParam(required = false) String search,
            Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(devoteeService.getDevoteesByCentre(centreId, profileType, search, pageable)));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('CENTRE_ADMIN','SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<DevoteeResponse>> createDevotee(@Valid @RequestBody CreateDevoteeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(devoteeService.createDevotee(request)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('COUNSELLOR','CENTRE_ADMIN','SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<DevoteeResponse>> getDevoteeById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(devoteeService.getDevoteeById(id)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('COUNSELLOR','CENTRE_ADMIN','SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<DevoteeResponse>> updateDevotee(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateDevoteeRequest request) {
        return ResponseEntity.ok(ApiResponse.success(devoteeService.updateDevotee(id, request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('CENTRE_ADMIN','SUPER_ADMIN')")
    public ResponseEntity<Void> deleteDevotee(@PathVariable UUID id) {
        devoteeService.deleteDevotee(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/student-profile")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Object>> getStudentProfile(@PathVariable UUID id) {
        // Assume service retrieves full devotee with profile or returns a nested dto logic. Here we reuse DevoteeResponse.
        return ResponseEntity.ok(ApiResponse.success(null)); // Placeholder as logic can vary. Returning ok.
    }

    @PutMapping("/{id}/student-profile")
    @PreAuthorize("hasAnyRole('COUNSELLOR','CENTRE_ADMIN','SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<DevoteeResponse>> upsertStudentProfile(
            @PathVariable UUID id,
            @Valid @RequestBody StudentProfileRequest request) {
        return ResponseEntity.ok(ApiResponse.success(devoteeService.upsertStudentProfile(id, request)));
    }

    @GetMapping("/{id}/professional-profile")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Object>> getProfessionalProfile(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PutMapping("/{id}/professional-profile")
    @PreAuthorize("hasAnyRole('COUNSELLOR','CENTRE_ADMIN','SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<DevoteeResponse>> upsertProfessionalProfile(
            @PathVariable UUID id,
            @Valid @RequestBody ProfessionalProfileRequest request) {
        return ResponseEntity.ok(ApiResponse.success(devoteeService.upsertProfessionalProfile(id, request)));
    }

    @GetMapping("/{id}/alumni-profile")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Object>> getAlumniProfile(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(null));
    }

    @PutMapping("/{id}/alumni-profile")
    @PreAuthorize("hasAnyRole('COUNSELLOR','CENTRE_ADMIN','SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<DevoteeResponse>> upsertAlumniProfile(
            @PathVariable UUID id,
            @Valid @RequestBody AlumniProfileRequest request) {
        return ResponseEntity.ok(ApiResponse.success(devoteeService.upsertAlumniProfile(id, request)));
    }
}
