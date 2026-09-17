package org.iskcon.iys.modules.devotee.domain;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "alumni_profiles")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AlumniProfile {

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

    @JdbcTypeCode(SqlTypes.SMALLINT)
    @Column(name = "graduation_year")
    private Integer graduationYear;

    @Column(name = "institution")
    private String institution;

    @Column(name = "degree")
    private String degree;

    @Column(name = "current_profession")
    private String currentProfession;

    @Column(name = "current_company")
    private String currentCompany;

    @Column(name = "city_of_residence")
    private String cityOfResidence;

    @Column(name = "is_active_devotee", columnDefinition = "boolean default true")
    private boolean isActiveDevotee;

    @Column(name = "wants_to_connect")
    private boolean wantsToConnect;
}
