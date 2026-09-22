package org.iskcon.iys.modules.devotee.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AlumniProfileResponse {
    private UUID id;
    private Integer graduationYear;
    private String institution;
    private String degree;
    private String currentProfession;
    private String currentCompany;
    private String cityOfResidence;
    private boolean isActiveDevotee;
    private boolean wantsToConnect;

    // Aliases for frontend convenience
    public String getHighestDegree() {
        return degree;
    }

    public String getCurrentOrganization() {
        return currentCompany;
    }

    public boolean isMentorshipOffered() {
        return wantsToConnect;
    }
}
