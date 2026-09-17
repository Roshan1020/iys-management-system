package org.iskcon.iys.modules.devotee.dto;

public record AlumniProfileRequest(
        Integer graduationYear,
        String institution,
        String degree,
        String currentProfession,
        String currentCompany,
        String cityOfResidence,
        boolean isActiveDevotee,
        boolean wantsToConnect
) {
}
