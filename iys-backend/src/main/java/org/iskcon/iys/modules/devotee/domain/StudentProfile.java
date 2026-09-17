package org.iskcon.iys.modules.devotee.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "student_profiles")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class StudentProfile {

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

    @Column(name = "institution")
    private String institution;

    @Column(name = "course")
    private String course;

    @Column(name = "specialisation")
    private String specialisation;

    @JdbcTypeCode(SqlTypes.SMALLINT)
    @Column(name = "year_of_study")
    private Integer yearOfStudy;

    @Column(name = "expected_graduation")
    private LocalDate expectedGraduation;

    @Column(name = "student_id_number")
    private String studentIdNumber;

    @Column(name = "hostel_resident")
    private boolean hostelResident;
}
