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
                .studentProfile(toStudentResponse(profile.getStudentProfile()))
                .professionalProfile(toProfessionalResponse(profile.getProfessionalProfile()))
                .alumniProfile(toAlumniResponse(profile.getAlumniProfile()))
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
                .institution(req.getEffectiveInstitution())
                .course(req.getEffectiveCourse())
                .specialisation(req.getEffectiveSpecialisation())
                .yearOfStudy(req.getEffectiveYearOfStudy())
                .expectedGraduation(req.getEffectiveExpectedGraduation())
                .studentIdNumber(req.studentIdNumber())
                .hostelResident(req.isEffectiveHostelResident())
                .build();
    }

    public static void updateStudentProfile(StudentProfile sp, StudentProfileRequest req) {
        if (req == null) return;
        if (req.getEffectiveInstitution() != null) sp.setInstitution(req.getEffectiveInstitution());
        if (req.getEffectiveCourse() != null) sp.setCourse(req.getEffectiveCourse());
        if (req.getEffectiveSpecialisation() != null) sp.setSpecialisation(req.getEffectiveSpecialisation());
        if (req.getEffectiveYearOfStudy() != null) sp.setYearOfStudy(req.getEffectiveYearOfStudy());
        if (req.getEffectiveExpectedGraduation() != null) sp.setExpectedGraduation(req.getEffectiveExpectedGraduation());
        if (req.studentIdNumber() != null) sp.setStudentIdNumber(req.studentIdNumber());
        sp.setHostelResident(req.isEffectiveHostelResident());
    }

    public static ProfessionalProfile toProfessionalProfile(ProfessionalProfileRequest req, DevoteeProfile profile) {
        if (req == null) return null;
        return ProfessionalProfile.builder()
                .devoteeProfile(profile)
                .company(req.getEffectiveCompany())
                .designation(req.getEffectiveDesignation())
                .industry(req.getEffectiveIndustry())
                .employmentType(req.getEffectiveEmploymentType())
                .experienceYears(req.getEffectiveExperienceYears())
                .annualIncomeRange(req.annualIncomeRange())
                .linkedinUrl(req.linkedinUrl())
                .isMentorWilling(req.isEffectiveMentorWilling())
                .build();
    }

    public static void updateProfessionalProfile(ProfessionalProfile pp, ProfessionalProfileRequest req) {
        if (req == null) return;
        if (req.getEffectiveCompany() != null) pp.setCompany(req.getEffectiveCompany());
        if (req.getEffectiveDesignation() != null) pp.setDesignation(req.getEffectiveDesignation());
        if (req.getEffectiveIndustry() != null) pp.setIndustry(req.getEffectiveIndustry());
        if (req.employmentType() != null) pp.setEmploymentType(req.getEffectiveEmploymentType());
        if (req.getEffectiveExperienceYears() != null) pp.setExperienceYears(req.getEffectiveExperienceYears());
        if (req.annualIncomeRange() != null) pp.setAnnualIncomeRange(req.annualIncomeRange());
        if (req.linkedinUrl() != null) pp.setLinkedinUrl(req.linkedinUrl());
        pp.setMentorWilling(req.isEffectiveMentorWilling());
    }

    public static AlumniProfile toAlumniProfile(AlumniProfileRequest req, DevoteeProfile profile) {
        if (req == null) return null;
        return AlumniProfile.builder()
                .devoteeProfile(profile)
                .graduationYear(req.graduationYear())
                .institution(req.institution())
                .degree(req.getEffectiveDegree())
                .currentProfession(req.currentProfession())
                .currentCompany(req.getEffectiveCurrentCompany())
                .cityOfResidence(req.cityOfResidence())
                .isActiveDevotee(req.isEffectiveActiveDevotee())
                .wantsToConnect(req.isEffectiveWantsToConnect())
                .build();
    }

    public static void updateAlumniProfile(AlumniProfile ap, AlumniProfileRequest req) {
        if (req == null) return;
        if (req.graduationYear() != null) ap.setGraduationYear(req.graduationYear());
        if (req.institution() != null) ap.setInstitution(req.institution());
        if (req.getEffectiveDegree() != null) ap.setDegree(req.getEffectiveDegree());
        if (req.currentProfession() != null) ap.setCurrentProfession(req.currentProfession());
        if (req.getEffectiveCurrentCompany() != null) ap.setCurrentCompany(req.getEffectiveCurrentCompany());
        if (req.cityOfResidence() != null) ap.setCityOfResidence(req.cityOfResidence());
        ap.setActiveDevotee(req.isEffectiveActiveDevotee());
        ap.setWantsToConnect(req.isEffectiveWantsToConnect());
    }

    public static StudentProfileResponse toStudentResponse(StudentProfile sp) {
        if (sp == null) return null;
        return StudentProfileResponse.builder()
                .id(sp.getId())
                .institution(sp.getInstitution())
                .course(sp.getCourse())
                .specialisation(sp.getSpecialisation())
                .yearOfStudy(sp.getYearOfStudy())
                .expectedGraduation(sp.getExpectedGraduation())
                .studentIdNumber(sp.getStudentIdNumber())
                .hostelResident(sp.isHostelResident())
                .build();
    }

    public static ProfessionalProfileResponse toProfessionalResponse(ProfessionalProfile pp) {
        if (pp == null) return null;
        return ProfessionalProfileResponse.builder()
                .id(pp.getId())
                .company(pp.getCompany())
                .designation(pp.getDesignation())
                .industry(pp.getIndustry())
                .employmentType(pp.getEmploymentType())
                .experienceYears(pp.getExperienceYears())
                .annualIncomeRange(pp.getAnnualIncomeRange())
                .linkedinUrl(pp.getLinkedinUrl())
                .isMentorWilling(pp.isMentorWilling())
                .build();
    }

    public static AlumniProfileResponse toAlumniResponse(AlumniProfile ap) {
        if (ap == null) return null;
        return AlumniProfileResponse.builder()
                .id(ap.getId())
                .graduationYear(ap.getGraduationYear())
                .institution(ap.getInstitution())
                .degree(ap.getDegree())
                .currentProfession(ap.getCurrentProfession())
                .currentCompany(ap.getCurrentCompany())
                .cityOfResidence(ap.getCityOfResidence())
                .isActiveDevotee(ap.isActiveDevotee())
                .wantsToConnect(ap.isWantsToConnect())
                .build();
    }
}
