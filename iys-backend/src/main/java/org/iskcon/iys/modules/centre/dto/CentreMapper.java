package org.iskcon.iys.modules.centre.dto;

import org.iskcon.iys.modules.centre.domain.Centre;

public class CentreMapper {

    private CentreMapper() {}

    public static CentreResponse toResponse(Centre centre) {
        if (centre == null) {
            return null;
        }
        return CentreResponse.builder()
                .id(centre.getId())
                .name(centre.getName())
                .shortCode(centre.getShortCode())
                .city(centre.getCity())
                .state(centre.getState())
                .country(centre.getCountry())
                .timezone(centre.getTimezone())
                .address(centre.getAddress())
                .contactEmail(centre.getContactEmail())
                .contactPhone(centre.getContactPhone())
                .logoUrl(centre.getLogoUrl())
                .isActive(centre.isActive())
                .createdAt(centre.getCreatedAt())
                .updatedAt(centre.getUpdatedAt())
                .build();
    }

    public static Centre toEntity(CreateCentreRequest request) {
        if (request == null) {
            return null;
        }
        Centre.CentreBuilder builder = Centre.builder()
                .name(request.name())
                .shortCode(request.shortCode())
                .city(request.city())
                .state(request.state())
                .address(request.address())
                .contactEmail(request.contactEmail())
                .contactPhone(request.contactPhone());
        
        if (request.country() != null) builder.country(request.country());
        if (request.timezone() != null) builder.timezone(request.timezone());
        
        return builder.build();
    }

    public static void updateEntity(Centre centre, UpdateCentreRequest request) {
        if (request == null || centre == null) {
            return;
        }
        if (request.name() != null) centre.setName(request.name());
        if (request.shortCode() != null) centre.setShortCode(request.shortCode());
        if (request.city() != null) centre.setCity(request.city());
        if (request.state() != null) centre.setState(request.state());
        if (request.country() != null) centre.setCountry(request.country());
        if (request.timezone() != null) centre.setTimezone(request.timezone());
        if (request.address() != null) centre.setAddress(request.address());
        if (request.contactEmail() != null) centre.setContactEmail(request.contactEmail());
        if (request.contactPhone() != null) centre.setContactPhone(request.contactPhone());
        if (request.isActive() != null) centre.setActive(request.isActive());
        if (request.logoUrl() != null) centre.setLogoUrl(request.logoUrl());
    }
}
