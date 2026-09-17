package org.iskcon.iys.modules.centre.application;

import java.time.Instant;
import java.util.UUID;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.iskcon.iys.modules.centre.domain.Centre;
import org.iskcon.iys.modules.centre.dto.CentreMapper;
import org.iskcon.iys.modules.centre.dto.CentreResponse;
import org.iskcon.iys.modules.centre.dto.CreateCentreRequest;
import org.iskcon.iys.modules.centre.dto.UpdateCentreRequest;
import org.iskcon.iys.modules.centre.infrastructure.CentreRepository;
import org.iskcon.iys.shared.dto.PageResponse;
import org.iskcon.iys.shared.exception.DuplicateResourceException;
import org.iskcon.iys.shared.exception.ErrorCode;
import org.iskcon.iys.shared.exception.ResourceNotFoundException;
import org.iskcon.iys.shared.security.SecurityUtils;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
@RequiredArgsConstructor
@Slf4j
public class CentreServiceImpl implements CentreService {

    private final CentreRepository centreRepository;

    @Override
    public CentreResponse createCentre(CreateCentreRequest request) {
        if (centreRepository.findByShortCodeIgnoreCase(request.shortCode()).isPresent()) {
            throw new DuplicateResourceException(ErrorCode.CENTRE_CODE_EXISTS, "Centre short code already exists.");
        }
        Centre centre = CentreMapper.toEntity(request);
        Centre saved = centreRepository.save(centre);
        return CentreMapper.toResponse(saved);
    }

    @Override
    public CentreResponse getCentreById(UUID id) {
        Centre centre = centreRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.RESOURCE_NOT_FOUND, "Centre not found."));
        return CentreMapper.toResponse(centre);
    }

    @Override
    public PageResponse<CentreResponse> getAllCentres(boolean activeOnly, Pageable pageable) {
        Page<Centre> page = activeOnly ? 
                centreRepository.findAllByIsActive(true, pageable) : 
                centreRepository.findAll(pageable);
        return PageResponse.from(page.map(CentreMapper::toResponse));
    }

    @Override
    public CentreResponse updateCentre(UUID id, UpdateCentreRequest request) {
        Centre centre = centreRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.RESOURCE_NOT_FOUND, "Centre not found."));
        
        if (request.shortCode() != null && !request.shortCode().equalsIgnoreCase(centre.getShortCode())) {
            if (centreRepository.findByShortCodeIgnoreCase(request.shortCode()).isPresent()) {
                throw new DuplicateResourceException(ErrorCode.CENTRE_CODE_EXISTS, "Centre short code already exists.");
            }
        }
        
        CentreMapper.updateEntity(centre, request);
        return CentreMapper.toResponse(centreRepository.save(centre));
    }

    @Override
    public void deleteCentre(UUID id) {
        Centre centre = centreRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.RESOURCE_NOT_FOUND, "Centre not found."));
        centre.setDeletedAt(Instant.now());
        if (SecurityUtils.getCurrentUser() != null) {
            centre.setDeletedBy(SecurityUtils.getCurrentUser().getUserId());
        }
        centreRepository.save(centre);
    }

    @Override
    public CentreResponse getCentreByShortCode(String shortCode) {
        Centre centre = centreRepository.findByShortCodeIgnoreCase(shortCode)
                .orElseThrow(() -> new ResourceNotFoundException(ErrorCode.RESOURCE_NOT_FOUND, "Centre not found."));
        return CentreMapper.toResponse(centre);
    }
}
