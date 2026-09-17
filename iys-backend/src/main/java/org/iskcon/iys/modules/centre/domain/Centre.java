package org.iskcon.iys.modules.centre.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.SQLRestriction;
import org.iskcon.iys.shared.domain.BaseAuditEntity;

@Entity
@Table(name = "centres")
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Centre extends BaseAuditEntity {

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "short_code", nullable = false, unique = true, length = 10)
    private String shortCode;

    @Column(name = "city", nullable = false)
    private String city;

    @Column(name = "state")
    private String state;

    @Builder.Default
    @Column(name = "country", nullable = false)
    private String country = "India";

    @Builder.Default
    @Column(name = "timezone", nullable = false)
    private String timezone = "Asia/Kolkata";

    @Column(name = "address")
    private String address;

    @Column(name = "contact_email")
    private String contactEmail;

    @Column(name = "contact_phone")
    private String contactPhone;

    @Column(name = "logo_url")
    private String logoUrl;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private boolean isActive = true;
}
