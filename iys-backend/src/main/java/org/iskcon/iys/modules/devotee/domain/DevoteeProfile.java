package org.iskcon.iys.modules.devotee.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcType;
import org.hibernate.annotations.SQLRestriction;
import org.hibernate.dialect.PostgreSQLEnumJdbcType;
import org.iskcon.iys.modules.devotee.domain.enums.InitiationStatus;
import org.iskcon.iys.modules.devotee.domain.enums.ProfileType;
import org.iskcon.iys.modules.identity.domain.enums.GenderType;
import org.iskcon.iys.shared.domain.BaseAuditEntity;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "devotee_profiles")
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DevoteeProfile extends BaseAuditEntity {

    @Column(name = "user_id", unique = true, nullable = false)
    private UUID userId;

    @Column(name = "centre_id", nullable = false)
    private UUID centreId;

    @Column(name = "initiated_name")
    private String initiatedName;

    @Column(name = "legal_name", nullable = false)
    private String legalName;

    @Column(name = "spiritual_master")
    private String spiritualMaster;

    @Enumerated(EnumType.STRING)
    @JdbcType(PostgreSQLEnumJdbcType.class)
    @Column(name = "initiation_status")
    private InitiationStatus initiationStatus;

    @Column(name = "initiated_date")
    private LocalDate initiatedDate;

    @Column(name = "dob")
    private LocalDate dob;

    @Enumerated(EnumType.STRING)
    @JdbcType(PostgreSQLEnumJdbcType.class)
    @Column(name = "gender")
    private GenderType gender;

    @Enumerated(EnumType.STRING)
    @JdbcType(PostgreSQLEnumJdbcType.class)
    @Column(name = "profile_type")
    private ProfileType profileType;

    @Column(name = "profile_photo_url")
    private String profilePhotoUrl;

    @Column(name = "phone")
    private String phone;

    @Column(columnDefinition = "TEXT", name = "address")
    private String address;

    @Column(name = "city")
    private String city;

    @Column(name = "state")
    private String state;

    @Column(name = "pincode")
    private String pincode;

    @Column(name = "join_date")
    private LocalDate joinDate;

    @Column(name = "is_regular")
    private boolean isRegular;

    @Column(columnDefinition = "TEXT", name = "notes")
    private String notes;

    @OneToOne(mappedBy = "devoteeProfile", cascade = CascadeType.ALL, fetch = FetchType.LAZY, optional = true)
    private StudentProfile studentProfile;

    @OneToOne(mappedBy = "devoteeProfile", cascade = CascadeType.ALL, fetch = FetchType.LAZY, optional = true)
    private ProfessionalProfile professionalProfile;

    @OneToOne(mappedBy = "devoteeProfile", cascade = CascadeType.ALL, fetch = FetchType.LAZY, optional = true)
    private AlumniProfile alumniProfile;
}
