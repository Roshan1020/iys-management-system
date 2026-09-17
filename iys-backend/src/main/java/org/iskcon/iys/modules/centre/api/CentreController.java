package org.iskcon.iys.modules.centre.api;

import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import java.util.UUID;
import org.iskcon.iys.modules.centre.application.CentreService;
import org.iskcon.iys.modules.centre.dto.CentreResponse;
import org.iskcon.iys.modules.centre.dto.CreateCentreRequest;
import org.iskcon.iys.modules.centre.dto.UpdateCentreRequest;
import org.iskcon.iys.shared.dto.ApiResponse;
import org.iskcon.iys.shared.dto.PageResponse;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/centres")
@Tag(name = "Centres")
public class CentreController {

    private final CentreService centreService;

    public CentreController(CentreService centreService) {
        this.centreService = centreService;
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<PageResponse<CentreResponse>>> getAllCentres(
            @RequestParam(defaultValue = "true") boolean activeOnly,
            Pageable pageable) {
        return ResponseEntity.ok(ApiResponse.success(centreService.getAllCentres(activeOnly, pageable)));
    }

    @PostMapping
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<CentreResponse>> createCentre(@Valid @RequestBody CreateCentreRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(centreService.createCentre(request)));
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<CentreResponse>> getCentreById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success(centreService.getCentreById(id)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<ApiResponse<CentreResponse>> updateCentre(
            @PathVariable UUID id, 
            @Valid @RequestBody UpdateCentreRequest request) {
        return ResponseEntity.ok(ApiResponse.success(centreService.updateCentre(id, request)));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Void> deleteCentre(@PathVariable UUID id) {
        centreService.deleteCentre(id);
        return ResponseEntity.noContent().build();
    }
}
