package org.iskcon.iys.modules.devotee.dto;

import java.time.LocalDate;

public record StudentProfileRequest(
        String institution,
        String course,
        String specialisation,
        Integer yearOfStudy,
        LocalDate expectedGraduation,
        String studentIdNumber,
        boolean hostelResident
) {
}
