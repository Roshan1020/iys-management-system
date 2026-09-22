package org.iskcon.iys.modules.devotee.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.iskcon.iys.modules.devotee.domain.enums.EmploymentType;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProfessionalProfileResponse {
    private UUID id;
    private String company;
    private String designation;
    private String industry;
    private EmploymentType employmentType;
    private Integer experienceYears;
    private String annualIncomeRange;
    private String linkedinUrl;
    private boolean isMentorWilling;

    // Aliases for frontend convenience
    public String getCompanyName() {
        return company;
    }

    public Integer getTotalExpYears() {
        return experienceYears;
    }

    public boolean isMentorshipOffered() {
        return isMentorWilling;
    }
}
