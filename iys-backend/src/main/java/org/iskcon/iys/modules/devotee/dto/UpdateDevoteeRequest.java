package org.iskcon.iys.modules.devotee.dto;

import jakarta.validation.constraints.Size;
import org.iskcon.iys.modules.devotee.domain.enums.InitiationStatus;
import org.iskcon.iys.modules.devotee.domain.enums.ProfileType;
import org.iskcon.iys.modules.identity.domain.enums.GenderType;

import java.time.LocalDate;
import java.util.UUID;

public record UpdateDevoteeRequest(
        UUID centreId,
        @Size(max = 150) String legalName,
        String initiatedName,
        String spiritualMaster,
        ProfileType profileType,
        InitiationStatus initiationStatus,
        LocalDate initiatedDate,
        LocalDate dob,
        GenderType gender,
        String phone,
        String address,
        String city,
        String state,
        String pincode,
        LocalDate joinDate,
        Boolean isRegular,
        String notes
) {
}
