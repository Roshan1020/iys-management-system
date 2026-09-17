package org.iskcon.iys.modules.devotee.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcType;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.dialect.PostgreSQLEnumJdbcType;
import org.hibernate.type.SqlTypes;
import org.iskcon.iys.modules.devotee.domain.enums.EmploymentType;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "professional_profiles")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ProfessionalProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "created_at")
    @CreationTimestamp
    private Instant createdAt;

    @Column(name = "updated_at")
    @UpdateTimestamp
    private Instant updatedAt;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "devotee_id", nullable = false, unique = true)
    private DevoteeProfile devoteeProfile;

    @Column(name = "company")
    private String company;

    @Column(name = "designation")
    private String designation;

    @Column(name = "industry")
    private String industry;

    @Enumerated(EnumType.STRING)
    @JdbcType(PostgreSQLEnumJdbcType.class)
    @Column(name = "employment_type")
    private EmploymentType employmentType;

    @JdbcTypeCode(SqlTypes.SMALLINT)
    @Column(name = "experience_years")
    private Integer experienceYears;

    @Column(name = "annual_income_range")
    private String annualIncomeRange;

    @Column(name = "linkedin_url")
    private String linkedinUrl;

    @Column(name = "is_mentor_willing")
    private boolean isMentorWilling;
}
