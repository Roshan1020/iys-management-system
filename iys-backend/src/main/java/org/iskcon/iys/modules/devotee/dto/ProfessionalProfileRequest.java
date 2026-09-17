package org.iskcon.iys.modules.devotee.dto;

import org.iskcon.iys.modules.devotee.domain.enums.EmploymentType;

public record ProfessionalProfileRequest(
        String company,
        String designation,
        String industry,
        EmploymentType employmentType,
        Integer experienceYears,
        String annualIncomeRange,
        String linkedinUrl,
        boolean isMentorWilling
) {
}
