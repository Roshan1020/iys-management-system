package org.iskcon.iys.modules.centre;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.iskcon.iys.modules.centre.api.CentreController;
import org.iskcon.iys.modules.centre.application.CentreService;
import org.iskcon.iys.modules.centre.dto.CentreResponse;
import org.iskcon.iys.modules.centre.dto.CreateCentreRequest;
import org.iskcon.iys.shared.security.JwtService;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(CentreController.class)
@AutoConfigureMockMvc(addFilters = false)
@org.springframework.context.annotation.Import(CentreControllerTest.TestSecurityConfig.class)
@Tag("unit")
class CentreControllerTest {

    @org.springframework.boot.test.context.TestConfiguration
    @org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity
    static class TestSecurityConfig {
    }

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private CentreService centreService;

    @MockBean
    private JwtService jwtService;

    @MockBean
    private org.iskcon.iys.shared.security.JwtAuthFilter jwtAuthFilter;

    @MockBean
    private org.springframework.security.core.userdetails.UserDetailsService userDetailsService;

    @MockBean
    private org.iskcon.iys.shared.security.IysPermissionEvaluator permissionEvaluator;

    @MockBean
    private RedisTemplate<String, String> redisTemplate;

    @Test
    @WithMockUser(roles = {"SUPER_ADMIN"})
    void createCentre_whenSuperAdmin_returns201() throws Exception {
        CreateCentreRequest req = new CreateCentreRequest("Pune", "PUN");
        CentreResponse res = CentreResponse.builder().name("Pune").shortCode("PUN").build();
        when(centreService.createCentre(any())).thenReturn(res);

        mockMvc.perform(post("/api/v1/centres")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.name").value("Pune"));
    }

    @Test
    @WithMockUser(roles = {"CENTRE_ADMIN"})
    void getCentreById_whenAuthorized_returns200() throws Exception {
        UUID id = UUID.randomUUID();
        CentreResponse res = CentreResponse.builder().id(id).name("Pune").build();
        when(centreService.getCentreById(id)).thenReturn(res);

        mockMvc.perform(get("/api/v1/centres/{id}", id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    @WithMockUser(roles = {"COUNSELLOR"})
    void createCentre_whenUnauthorized_returns403() throws Exception {
        CreateCentreRequest req = new CreateCentreRequest("Pune", "PUN");
        
        mockMvc.perform(post("/api/v1/centres")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isForbidden());
    }
}
