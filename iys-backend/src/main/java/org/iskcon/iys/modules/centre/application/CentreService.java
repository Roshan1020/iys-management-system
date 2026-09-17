package org.iskcon.iys.modules.centre.application;

import java.util.UUID;
import org.iskcon.iys.modules.centre.dto.CentreResponse;
import org.iskcon.iys.modules.centre.dto.CreateCentreRequest;
import org.iskcon.iys.modules.centre.dto.UpdateCentreRequest;
import org.iskcon.iys.shared.dto.PageResponse;
import org.springframework.data.domain.Pageable;

public interface CentreService {
    CentreResponse createCentre(CreateCentreRequest request);
    CentreResponse getCentreById(UUID id);
    PageResponse<CentreResponse> getAllCentres(boolean activeOnly, Pageable pageable);
    CentreResponse updateCentre(UUID id, UpdateCentreRequest request);
    void deleteCentre(UUID id);
    CentreResponse getCentreByShortCode(String shortCode);
}
