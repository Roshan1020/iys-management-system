package org.iskcon.iys.modules.devotee.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.time.LocalDate;

@JsonIgnoreProperties(ignoreUnknown = true)
public record StudentProfileRequest(
        String institution,
        String course,
        String specialisation,
        Integer yearOfStudy,
        LocalDate expectedGraduation,
        String studentIdNumber,
        Boolean hostelResident,
        String collegeName,
        String degree,
        String branch,
        Integer currentYear,
        Integer graduationYear,
        String hostelOrDayScholar
) {
    public StudentProfileRequest(
            String institution,
            String course,
            String specialisation,
            Integer yearOfStudy,
            LocalDate expectedGraduation,
            String studentIdNumber,
            boolean hostelResident
    ) {
        this(institution, course, specialisation, yearOfStudy, expectedGraduation, studentIdNumber, hostelResident,
                null, null, null, null, null, null);
    }

    public String getEffectiveInstitution() {
        if (institution != null && !institution.isBlank()) return institution.trim();
        if (collegeName != null && !collegeName.isBlank()) return collegeName.trim();
        return null;
    }

    public String getEffectiveCourse() {
        if (course != null && !course.isBlank()) return course.trim();
        if (degree != null && !degree.isBlank()) return degree.trim();
        return null;
    }

    public String getEffectiveSpecialisation() {
        if (specialisation != null && !specialisation.isBlank()) return specialisation.trim();
        if (branch != null && !branch.isBlank()) return branch.trim();
        return null;
    }

    public Integer getEffectiveYearOfStudy() {
        if (yearOfStudy != null) return yearOfStudy;
        if (currentYear != null) return currentYear;
        return null;
    }

    public LocalDate getEffectiveExpectedGraduation() {
        if (expectedGraduation != null) return expectedGraduation;
        if (graduationYear != null) return LocalDate.of(graduationYear, 6, 30);
        return null;
    }

    public boolean isEffectiveHostelResident() {
        if (hostelResident != null) return hostelResident;
        if (hostelOrDayScholar != null) return hostelOrDayScholar.toLowerCase().contains("hostel");
        return false;
    }
}
