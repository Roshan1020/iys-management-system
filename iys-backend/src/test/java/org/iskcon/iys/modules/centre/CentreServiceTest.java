package org.iskcon.iys.modules.centre;

import org.iskcon.iys.modules.centre.application.CentreServiceImpl;
import org.iskcon.iys.modules.centre.domain.Centre;
import org.iskcon.iys.modules.centre.dto.CentreResponse;
import org.iskcon.iys.modules.centre.dto.CreateCentreRequest;
import org.iskcon.iys.modules.centre.infrastructure.CentreRepository;
import org.iskcon.iys.shared.exception.DuplicateResourceException;
import org.iskcon.iys.shared.exception.ResourceNotFoundException;
import org.iskcon.iys.shared.security.SecurityUtils;
import org.iskcon.iys.shared.security.UserPrincipal;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.Collections;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@Tag("unit")
class CentreServiceTest {

    @InjectMocks
    private CentreServiceImpl centreService;

    @Mock
    private CentreRepository centreRepository;

    private MockedStatic<SecurityUtils> securityUtilsMockedStatic;

    @BeforeEach
    void setUp() {
        UserPrincipal principal = new UserPrincipal(
                UUID.randomUUID(), UUID.randomUUID(), "test@test.com", "pass",
                List.of("SUPER_ADMIN")
        );
        securityUtilsMockedStatic = mockStatic(SecurityUtils.class);
        securityUtilsMockedStatic.when(SecurityUtils::getCurrentUser).thenReturn(principal);
        securityUtilsMockedStatic.when(SecurityUtils::getCurrentUserOrNull).thenReturn(principal);
    }

    @AfterEach
    void tearDown() {
        securityUtilsMockedStatic.close();
    }

    @Test
    void createCentre_whenValidRequest_returnsCentreResponse() {
        CreateCentreRequest req = new CreateCentreRequest("Pune", "PUN");
        when(centreRepository.findByShortCodeIgnoreCase("PUN")).thenReturn(Optional.empty());

        Centre centre = new Centre();
        centre.setId(UUID.randomUUID());
        centre.setName("Pune");
        centre.setShortCode("PUN");
        when(centreRepository.save(any(Centre.class))).thenReturn(centre);

        CentreResponse res = centreService.createCentre(req);
        assertNotNull(res);
        assertEquals("Pune", res.getName());
    }

    @Test
    void createCentre_whenDuplicateShortCode_throwsDuplicateResourceException() {
        CreateCentreRequest req = new CreateCentreRequest("Pune", "PUN");
        when(centreRepository.findByShortCodeIgnoreCase("PUN")).thenReturn(Optional.of(new Centre()));

        assertThrows(DuplicateResourceException.class, () -> centreService.createCentre(req));
    }

    @Test
    void getCentreById_whenExists_returnsCentreResponse() {
        UUID id = UUID.randomUUID();
        Centre centre = new Centre();
        centre.setId(id);
        when(centreRepository.findById(id)).thenReturn(Optional.of(centre));

        CentreResponse res = centreService.getCentreById(id);
        assertNotNull(res);
        assertEquals(id, res.getId());
    }

    @Test
    void getCentreById_whenNotExists_throwsResourceNotFoundException() {
        UUID id = UUID.randomUUID();
        when(centreRepository.findById(id)).thenReturn(Optional.empty());
        assertThrows(ResourceNotFoundException.class, () -> centreService.getCentreById(id));
    }

    @Test
    void deleteCentre_whenExists_setsDeletedAt() {
        UUID id = UUID.randomUUID();
        Centre centre = new Centre();
        centre.setId(id);
        when(centreRepository.findById(id)).thenReturn(Optional.of(centre));

        centreService.deleteCentre(id);

        verify(centreRepository).save(centre);
        assertNotNull(centre.getDeletedAt());
    }

    @Test
    void getAllCentres_whenCentreAdmin_returnsOnlyBelongedCentre() {
        UUID centreAdminCentreId = UUID.randomUUID();
        UserPrincipal centreAdmin = new UserPrincipal(
                UUID.randomUUID(), centreAdminCentreId, "admin@centre.org", "pass",
                List.of("CENTRE_ADMIN")
        );
        securityUtilsMockedStatic.when(SecurityUtils::getCurrentUserOrNull).thenReturn(centreAdmin);

        Centre myCentre = new Centre();
        myCentre.setId(centreAdminCentreId);
        myCentre.setName("Pune East");
        myCentre.setActive(true);

        when(centreRepository.findById(centreAdminCentreId)).thenReturn(Optional.of(myCentre));

        var res = centreService.getAllCentres(true, org.springframework.data.domain.PageRequest.of(0, 10));
        assertNotNull(res);
        assertEquals(1, res.getContent().size());
        assertEquals("Pune East", res.getContent().get(0).getName());
    }

    @Test
    void getCentreById_whenCentreAdminAccessesOtherCentre_throwsForbiddenException() {
        UUID myCentreId = UUID.randomUUID();
        UUID otherCentreId = UUID.randomUUID();
        UserPrincipal centreAdmin = new UserPrincipal(
                UUID.randomUUID(), myCentreId, "admin@centre.org", "pass",
                List.of("CENTRE_ADMIN")
        );
        securityUtilsMockedStatic.when(SecurityUtils::getCurrentUserOrNull).thenReturn(centreAdmin);

        assertThrows(org.iskcon.iys.shared.exception.ForbiddenException.class, 
                () -> centreService.getCentreById(otherCentreId));
    }
}
