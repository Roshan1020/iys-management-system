package org.iskcon.iys.modules.devotee.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

@JsonIgnoreProperties(ignoreUnknown = true)
public record AlumniProfileRequest(
        Integer graduationYear,
        String institution,
        String degree,
        String currentProfession,
        String currentCompany,
        String cityOfResidence,
        Boolean isActiveDevotee,
        Boolean wantsToConnect,
        // Frontend aliases
        String highestDegree,
        String currentOrganization,
        Boolean mentorshipOffered
) {
    public AlumniProfileRequest(
            Integer graduationYear,
            String institution,
            String degree,
            String currentProfession,
            String currentCompany,
            String cityOfResidence,
            boolean isActiveDevotee,
            boolean wantsToConnect
    ) {
        this(graduationYear, institution, degree, currentProfession, currentCompany, cityOfResidence, isActiveDevotee, wantsToConnect,
                null, null, null);
    }

    public String getEffectiveDegree() {
        if (degree != null && !degree.isBlank()) return degree.trim();
        if (highestDegree != null && !highestDegree.isBlank()) return highestDegree.trim();
        return null;
    }

    public String getEffectiveCurrentCompany() {
        if (currentCompany != null && !currentCompany.isBlank()) return currentCompany.trim();
        if (currentOrganization != null && !currentOrganization.isBlank()) return currentOrganization.trim();
        return null;
    }

    public boolean isEffectiveActiveDevotee() {
        return isActiveDevotee != null ? isActiveDevotee : true;
    }

    public boolean isEffectiveWantsToConnect() {
        if (wantsToConnect != null) return wantsToConnect;
        if (mentorshipOffered != null) return mentorshipOffered;
        return false;
    }
}
