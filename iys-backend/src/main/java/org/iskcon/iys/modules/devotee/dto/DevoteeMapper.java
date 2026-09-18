package org.iskcon.iys.modules.devotee.dto;

import org.iskcon.iys.modules.devotee.domain.AlumniProfile;
import org.iskcon.iys.modules.devotee.domain.DevoteeProfile;
import org.iskcon.iys.modules.devotee.domain.ProfessionalProfile;
import org.iskcon.iys.modules.devotee.domain.StudentProfile;
import org.iskcon.iys.modules.devotee.domain.enums.InitiationStatus;
import org.iskcon.iys.modules.devotee.domain.enums.ProfileType;

import java.time.LocalDate;

public class DevoteeMapper {

    public static DevoteeResponse toResponse(DevoteeProfile profile) {
        if (profile == null) return null;
        return DevoteeResponse.builder()
                .id(profile.getId())
                .userId(profile.getUserId())
                .centreId(profile.getCentreId())
                .legalName(profile.getLegalName())
                .initiatedName(profile.getInitiatedName())
                .spiritualMaster(profile.getSpiritualMaster())
                .initiationStatus(profile.getInitiationStatus() != null ? profile.getInitiationStatus().name() : null)
                .initiatedDate(profile.getInitiatedDate())
                .dob(profile.getDob())
                .gender(profile.getGender() != null ? profile.getGender().name() : null)
                .profileType(profile.getProfileType() != null ? profile.getProfileType().name() : null)
                .profilePhotoUrl(profile.getProfilePhotoUrl())
                .phone(profile.getPhone())
                .address(profile.getAddress())
                .city(profile.getCity())
                .state(profile.getState())
                .pincode(profile.getPincode())
                .joinDate(profile.getJoinDate())
                .isRegular(profile.isRegular())
                .notes(profile.getNotes())
                .createdAt(profile.getCreatedAt())
                .updatedAt(profile.getUpdatedAt())
                .build();
    }

    public static DevoteeSummaryResponse toSummary(DevoteeProfile profile) {
        if (profile == null) return null;
        return DevoteeSummaryResponse.builder()
                .id(profile.getId())
                .centreId(profile.getCentreId())
                .legalName(profile.getLegalName())
                .initiatedName(profile.getInitiatedName())
                .profileType(profile.getProfileType() != null ? profile.getProfileType().name() : null)
                .initiationStatus(profile.getInitiationStatus() != null ? profile.getInitiationStatus().name() : null)
                .city(profile.getCity())
                .createdAt(profile.getCreatedAt())
                .build();
    }

    public static DevoteeProfile toEntity(CreateDevoteeRequest request) {
        if (request == null) return null;
        return DevoteeProfile.builder()
                .userId(request.userId())
                .centreId(request.centreId())
                .legalName(request.legalName() != null ? request.legalName().trim() : null)
                .initiatedName(request.initiatedName() != null && !request.initiatedName().trim().isBlank() ? request.initiatedName().trim() : null)
                .spiritualMaster(request.spiritualMaster() != null && !request.spiritualMaster().trim().isBlank() ? request.spiritualMaster().trim() : null)
                .profileType(request.profileType() != null ? request.profileType() : ProfileType.OTHER)
                .initiationStatus(request.initiationStatus() != null ? request.initiationStatus() : InitiationStatus.UNINITIATED)
                .initiatedDate(request.initiatedDate())
                .dob(request.dob())
                .gender(request.gender())
                .phone(request.phone() != null && !request.phone().trim().isBlank() ? request.phone().trim() : null)
                .address(request.address())
                .city(request.city() != null && !request.city().trim().isBlank() ? request.city().trim() : null)
                .state(request.state())
                .pincode(request.pincode())
                .joinDate(request.joinDate() != null ? request.joinDate() : LocalDate.now())
                .isRegular(request.isRegular())
                .notes(request.notes() != null && !request.notes().trim().isBlank() ? request.notes().trim() : null)
                .build();
    }

    public static void updateEntity(DevoteeProfile profile, UpdateDevoteeRequest request) {
        if (request == null) return;
        if (request.centreId() != null) profile.setCentreId(request.centreId());
        if (request.legalName() != null) profile.setLegalName(request.legalName());
        if (request.initiatedName() != null) profile.setInitiatedName(request.initiatedName());
        if (request.spiritualMaster() != null) profile.setSpiritualMaster(request.spiritualMaster());
        if (request.profileType() != null) profile.setProfileType(request.profileType());
        if (request.initiationStatus() != null) profile.setInitiationStatus(request.initiationStatus());
        if (request.initiatedDate() != null) profile.setInitiatedDate(request.initiatedDate());
        if (request.dob() != null) profile.setDob(request.dob());
        if (request.gender() != null) profile.setGender(request.gender());
        if (request.phone() != null) profile.setPhone(request.phone());
        if (request.address() != null) profile.setAddress(request.address());
        if (request.city() != null) profile.setCity(request.city());
        if (request.state() != null) profile.setState(request.state());
        if (request.pincode() != null) profile.setPincode(request.pincode());
        if (request.joinDate() != null) profile.setJoinDate(request.joinDate());
        if (request.isRegular() != null) profile.setRegular(request.isRegular());
        if (request.notes() != null) profile.setNotes(request.notes());
    }

    public static StudentProfile toStudentProfile(StudentProfileRequest req, DevoteeProfile profile) {
        if (req == null) return null;
        return StudentProfile.builder()
                .devoteeProfile(profile)
                .institution(req.institution())
                .course(req.course())
                .specialisation(req.specialisation())
                .yearOfStudy(req.yearOfStudy())
                .expectedGraduation(req.expectedGraduation())
                .studentIdNumber(req.studentIdNumber())
                .hostelResident(req.hostelResident())
                .build();
    }

    public static void updateStudentProfile(StudentProfile sp, StudentProfileRequest req) {
        if (req == null) return;
        if (req.institution() != null) sp.setInstitution(req.institution());
        if (req.course() != null) sp.setCourse(req.course());
        if (req.specialisation() != null) sp.setSpecialisation(req.specialisation());
        if (req.yearOfStudy() != null) sp.setYearOfStudy(req.yearOfStudy());
        if (req.expectedGraduation() != null) sp.setExpectedGraduation(req.expectedGraduation());
        if (req.studentIdNumber() != null) sp.setStudentIdNumber(req.studentIdNumber());
        sp.setHostelResident(req.hostelResident());
    }

    public static ProfessionalProfile toProfessionalProfile(ProfessionalProfileRequest req, DevoteeProfile profile) {
        if (req == null) return null;
        return ProfessionalProfile.builder()
                .devoteeProfile(profile)
                .company(req.company())
                .designation(req.designation())
                .industry(req.industry())
                .employmentType(req.employmentType())
                .experienceYears(req.experienceYears())
                .annualIncomeRange(req.annualIncomeRange())
                .linkedinUrl(req.linkedinUrl())
                .isMentorWilling(req.isMentorWilling())
                .build();
    }

    public static void updateProfessionalProfile(ProfessionalProfile pp, ProfessionalProfileRequest req) {
        if (req == null) return;
        if (req.company() != null) pp.setCompany(req.company());
        if (req.designation() != null) pp.setDesignation(req.designation());
        if (req.industry() != null) pp.setIndustry(req.industry());
        if (req.employmentType() != null) pp.setEmploymentType(req.employmentType());
        if (req.experienceYears() != null) pp.setExperienceYears(req.experienceYears());
        if (req.annualIncomeRange() != null) pp.setAnnualIncomeRange(req.annualIncomeRange());
        if (req.linkedinUrl() != null) pp.setLinkedinUrl(req.linkedinUrl());
        pp.setMentorWilling(req.isMentorWilling());
    }

    public static AlumniProfile toAlumniProfile(AlumniProfileRequest req, DevoteeProfile profile) {
        if (req == null) return null;
        return AlumniProfile.builder()
                .devoteeProfile(profile)
                .graduationYear(req.graduationYear())
                .institution(req.institution())
                .degree(req.degree())
                .currentProfession(req.currentProfession())
                .currentCompany(req.currentCompany())
                .cityOfResidence(req.cityOfResidence())
                .isActiveDevotee(req.isActiveDevotee())
                .wantsToConnect(req.wantsToConnect())
                .build();
    }

    public static void updateAlumniProfile(AlumniProfile ap, AlumniProfileRequest req) {
        if (req == null) return;
        if (req.graduationYear() != null) ap.setGraduationYear(req.graduationYear());
        if (req.institution() != null) ap.setInstitution(req.institution());
        if (req.degree() != null) ap.setDegree(req.degree());
        if (req.currentProfession() != null) ap.setCurrentProfession(req.currentProfession());
        if (req.currentCompany() != null) ap.setCurrentCompany(req.currentCompany());
        if (req.cityOfResidence() != null) ap.setCityOfResidence(req.cityOfResidence());
        ap.setActiveDevotee(req.isActiveDevotee());
        ap.setWantsToConnect(req.wantsToConnect());
    }
}
