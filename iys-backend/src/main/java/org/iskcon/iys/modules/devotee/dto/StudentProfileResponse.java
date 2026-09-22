package org.iskcon.iys.modules.devotee.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentProfileResponse {
    private UUID id;
    private String institution;
    private String course;
    private String specialisation;
    private Integer yearOfStudy;
    private LocalDate expectedGraduation;
    private String studentIdNumber;
    private boolean hostelResident;

    // Aliases for frontend convenience
    public String getCollegeName() {
        return institution;
    }

    public String getDegree() {
        return course;
    }

    public String getBranch() {
        return specialisation;
    }

    public Integer getGraduationYear() {
        return expectedGraduation != null ? expectedGraduation.getYear() : null;
    }

    public Integer getCurrentYear() {
        return yearOfStudy;
    }

    public String getHostelOrDayScholar() {
        return hostelResident ? "Hosteller" : "Day Scholar";
    }
}
