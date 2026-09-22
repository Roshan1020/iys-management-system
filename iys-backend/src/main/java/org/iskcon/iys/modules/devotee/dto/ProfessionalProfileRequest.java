package org.iskcon.iys.modules.devotee.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import org.iskcon.iys.modules.devotee.domain.enums.EmploymentType;

@JsonIgnoreProperties(ignoreUnknown = true)
public record ProfessionalProfileRequest(
        String company,
        String designation,
        String industry,
        EmploymentType employmentType,
        Integer experienceYears,
        String annualIncomeRange,
        String linkedinUrl,
        Boolean isMentorWilling,
        // Frontend aliases
        String companyName,
        Integer totalExpYears,
        String workCity,
        Boolean mentorshipOffered
) {
    public ProfessionalProfileRequest(
            String company,
            String designation,
            String industry,
            EmploymentType employmentType,
            Integer experienceYears,
            String annualIncomeRange,
            String linkedinUrl,
            boolean isMentorWilling
    ) {
        this(company, designation, industry, employmentType, experienceYears, annualIncomeRange, linkedinUrl, isMentorWilling,
                null, null, null, null);
    }

    public String getEffectiveCompany() {
        if (company != null && !company.isBlank()) return company.trim();
        if (companyName != null && !companyName.isBlank()) return companyName.trim();
        return null;
    }

    public String getEffectiveDesignation() {
        return designation != null && !designation.isBlank() ? designation.trim() : null;
    }

    public String getEffectiveIndustry() {
        return industry != null && !industry.isBlank() ? industry.trim() : null;
    }

    public EmploymentType getEffectiveEmploymentType() {
        return employmentType != null ? employmentType : EmploymentType.FULL_TIME;
    }

    public Integer getEffectiveExperienceYears() {
        if (experienceYears != null) return experienceYears;
        if (totalExpYears != null) return totalExpYears;
        return 0;
    }

    public boolean isEffectiveMentorWilling() {
        if (isMentorWilling != null) return isMentorWilling;
        if (mentorshipOffered != null) return mentorshipOffered;
        return false;
    }
}
