package org.iskcon.iys.modules.identity;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.iskcon.iys.modules.identity.api.AuthController;
import org.iskcon.iys.modules.identity.application.AuthService;
import org.iskcon.iys.modules.identity.application.UserService;
import org.iskcon.iys.modules.identity.dto.LoginRequest;
import org.iskcon.iys.modules.identity.dto.RegisterRequest;
import org.iskcon.iys.modules.identity.dto.TokenResponse;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
@Tag("unit")
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AuthService authService;

    @MockBean
    private UserService userService;

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
    void login_whenValidCredentials_returns200WithToken() throws Exception {
        LoginRequest req = new LoginRequest("test@test.com", "pass1234");
        TokenResponse res = TokenResponse.builder()
                .accessToken("access-token")
                .tokenType("Bearer")
                .build();
        when(authService.login(any(), any(), any())).thenReturn(res);

        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").value("access-token"));
    }

    @Test
    void login_whenBlankEmail_returns400() throws Exception {
        LoginRequest req = new LoginRequest("", "pass1234");

        mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(roles = {"SUPER_ADMIN"})
    void register_whenValidRequest_returns201() throws Exception {
        RegisterRequest req = new RegisterRequest(
                "test@test.com",
                "password123",
                "Legal Name",
                UUID.randomUUID(),
                "1234567890",
                "Initiated Name"
        );
        TokenResponse res = TokenResponse.builder()
                .accessToken("access-token")
                .tokenType("Bearer")
                .build();
        when(userService.register(any())).thenReturn(res);

        mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").value("access-token"));
    }
}
