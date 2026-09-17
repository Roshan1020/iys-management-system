package org.iskcon.iys.modules.devotee;

import org.iskcon.iys.modules.devotee.application.DevoteeServiceImpl;
import org.iskcon.iys.modules.devotee.domain.DevoteeProfile;
import org.iskcon.iys.modules.devotee.domain.enums.ProfileType;
import org.iskcon.iys.modules.devotee.dto.CreateDevoteeRequest;
import org.iskcon.iys.modules.devotee.dto.DevoteeResponse;
import org.iskcon.iys.modules.devotee.infrastructure.AlumniProfileRepository;
import org.iskcon.iys.modules.devotee.infrastructure.DevoteeRepository;
import org.iskcon.iys.modules.devotee.infrastructure.ProfessionalProfileRepository;
import org.iskcon.iys.modules.devotee.infrastructure.StudentProfileRepository;
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
class DevoteeServiceTest {

    @InjectMocks
    private DevoteeServiceImpl devoteeService;

    @Mock
    private DevoteeRepository devoteeRepository;

    @Mock
    private StudentProfileRepository studentProfileRepository;

    @Mock
    private ProfessionalProfileRepository professionalProfileRepository;

    @Mock
    private AlumniProfileRepository alumniProfileRepository;

    private MockedStatic<SecurityUtils> securityUtilsMockedStatic;

    @BeforeEach
    void setUp() {
        UserPrincipal principal = new UserPrincipal(
                UUID.randomUUID(), UUID.randomUUID(), "test@test.com", "pass",
                List.of("SUPER_ADMIN")
        );
        securityUtilsMockedStatic = mockStatic(SecurityUtils.class);
        securityUtilsMockedStatic.when(SecurityUtils::getCurrentUser).thenReturn(principal);
    }

    @AfterEach
    void tearDown() {
        securityUtilsMockedStatic.close();
    }

    @Test
    void createDevotee_whenNewUser_returnsDevoteeResponse() {
        UUID userId = UUID.randomUUID();
        UUID centreId = UUID.randomUUID();
        CreateDevoteeRequest req = new CreateDevoteeRequest(userId, centreId, "Legal Name", null, null, ProfileType.STUDENT, null, null, null, null, null, null, null, null, null, null, false, null);
        
        when(devoteeRepository.existsByUserId(userId)).thenReturn(false);
        
        DevoteeProfile saved = new DevoteeProfile();
        saved.setId(UUID.randomUUID());
        saved.setUserId(userId);
        saved.setCentreId(centreId);
        saved.setLegalName("Legal Name");
        when(devoteeRepository.save(any(DevoteeProfile.class))).thenReturn(saved);

        DevoteeResponse response = devoteeService.createDevotee(req);

        assertNotNull(response);
        assertEquals("Legal Name", response.getLegalName());
    }

    @Test
    void createDevotee_whenAlreadyExists_throwsDuplicateResourceException() {
        UUID userId = UUID.randomUUID();
        CreateDevoteeRequest req = new CreateDevoteeRequest(userId, UUID.randomUUID(), "Legal Name", null, null, ProfileType.STUDENT, null, null, null, null, null, null, null, null, null, null, false, null);

        when(devoteeRepository.existsByUserId(userId)).thenReturn(true);

        assertThrows(DuplicateResourceException.class, () -> devoteeService.createDevotee(req));
    }

    @Test
    void getDevoteeById_whenExists_returnsDevoteeResponse() {
        UUID id = UUID.randomUUID();
        DevoteeProfile dev = new DevoteeProfile();
        dev.setId(id);
        dev.setCentreId(UUID.randomUUID());
        when(devoteeRepository.findById(id)).thenReturn(Optional.of(dev));

        DevoteeResponse res = devoteeService.getDevoteeById(id);
        assertNotNull(res);
        assertEquals(id, res.getId());
    }

    @Test
    void getDevoteeById_whenNotExists_throwsResourceNotFoundException() {
        UUID id = UUID.randomUUID();
        when(devoteeRepository.findById(id)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> devoteeService.getDevoteeById(id));
    }

    @Test
    void deleteDevotee_whenExists_setsDeletedAt() {
        UUID id = UUID.randomUUID();
        DevoteeProfile dev = new DevoteeProfile();
        dev.setId(id);
        dev.setCentreId(UUID.randomUUID());
        
        when(devoteeRepository.findById(id)).thenReturn(Optional.of(dev));

        devoteeService.deleteDevotee(id);

        verify(devoteeRepository).save(dev);
        assertNotNull(dev.getDeletedAt());
        assertNotNull(dev.getDeletedBy());
    }
}
