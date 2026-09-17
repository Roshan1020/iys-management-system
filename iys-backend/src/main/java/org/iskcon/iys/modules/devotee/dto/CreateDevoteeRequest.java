package org.iskcon.iys.modules.devotee.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import org.iskcon.iys.modules.devotee.domain.enums.InitiationStatus;
import org.iskcon.iys.modules.devotee.domain.enums.ProfileType;
import org.iskcon.iys.modules.identity.domain.enums.GenderType;

import java.time.LocalDate;
import java.util.UUID;

public record CreateDevoteeRequest(
        UUID userId,
        String email,
        @NotNull UUID centreId,
        @NotBlank @Size(max = 150) String legalName,
        String initiatedName,
        String spiritualMaster,
        @NotNull ProfileType profileType,
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
        boolean isRegular,
        String notes
) {
    public CreateDevoteeRequest(
            UUID userId,
            UUID centreId,
            String legalName,
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
            boolean isRegular,
            String notes
    ) {
        this(userId, null, centreId, legalName, initiatedName, spiritualMaster, profileType, initiationStatus,
                initiatedDate, dob, gender, phone, address, city, state, pincode, joinDate, isRegular, notes);
    }
}
