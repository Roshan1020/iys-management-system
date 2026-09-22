package org.iskcon.iys.modules.devotee.dto;

import lombok.*;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DevoteeResponse {
    private UUID id;
    private UUID userId;
    private UUID centreId;
    private String legalName;
    private String initiatedName;
    private String spiritualMaster;
    private String initiationStatus;
    private LocalDate initiatedDate;
    private LocalDate dob;
    private String gender;
    private String profileType;
    private String profilePhotoUrl;
    private String phone;
    private String address;
    private String city;
    private String state;
    private String pincode;
    private LocalDate joinDate;
    private boolean isRegular;
    private String notes;
    private StudentProfileResponse studentProfile;
    private ProfessionalProfileResponse professionalProfile;
    private AlumniProfileResponse alumniProfile;
    private Instant createdAt;
    private Instant updatedAt;
}
