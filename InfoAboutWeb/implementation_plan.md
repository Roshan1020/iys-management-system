# IYS Platform — Phase 1 Implementation Plan

## Overview

Implementing the complete Spring Boot backend for Phase 1: Identity, Centre, and Devotee modules.
**60+ files** across 4 layers. Executing with parallel subagents.

---

## Key Technical Decisions

| Concern | Decision |
|---------|----------|
| **Soft delete** | `@SQLRestriction("deleted_at IS NULL")` (Hibernate 6) |
| **Audit fields** | `@MappedSuperclass BaseAuditEntity` |
| **JWT library** | JJWT 0.12.6 |
| **DI style** | Constructor injection via `@RequiredArgsConstructor` |
| **DTO pattern** | Java records for Requests · Lombok classes for Responses |
| **Mapper pattern** | Manual static mapper classes (no annotation processor) |
| **Transactions** | `@Transactional` on service impl layer |
| **Soft delete enforcement** | `@SQLRestriction` + Spring Data partial-unique indexes |
| **Centre isolation** | JWT `centreId` claim + explicit `findBy...AndCentreId` queries |
| **OpenAPI** | SpringDoc 2.6.0 with JWT security scheme |
| **Integration tests** | `@SpringBootTest` + Testcontainers PostgreSQL |
| **Unit tests** | `@WebMvcTest` for controllers · `@ExtendWith(MockitoExtension)` for services |

---

## Project Root

```
d:\MyProject_2025\IYS_Managment_System\iys-backend\
```

---

## File Execution Plan

### Stream 1 — Foundation (written first, everything depends on this)

```
iys-backend/
├── pom.xml
├── docker-compose.yml
├── src/main/resources/
│   ├── application.yml
│   └── application-dev.yml
├── src/main/java/org/iskcon/iys/
│   ├── IysApplication.java
│   ├── shared/
│   │   ├── domain/
│   │   │   └── BaseAuditEntity.java          ← @MappedSuperclass with all audit fields
│   │   ├── dto/
│   │   │   ├── ApiResponse.java              ← Generic response wrapper
│   │   │   └── PageResponse.java             ← Pagination wrapper
│   │   ├── exception/
│   │   │   ├── ErrorCode.java                ← Enum of all error codes
│   │   │   ├── IysException.java             ← Base runtime exception
│   │   │   ├── ResourceNotFoundException.java
│   │   │   ├── DuplicateResourceException.java
│   │   │   ├── UnauthorizedException.java
│   │   │   ├── ForbiddenException.java
│   │   │   └── GlobalExceptionHandler.java   ← @RestControllerAdvice
│   │   ├── security/
│   │   │   ├── UserPrincipal.java            ← UserDetails impl + JWT claims
│   │   │   ├── JwtService.java               ← Token generation/validation (JJWT 0.12)
│   │   │   ├── JwtAuthFilter.java            ← OncePerRequestFilter
│   │   │   ├── IysPermissionEvaluator.java   ← Custom PermissionEvaluator
│   │   │   └── SecurityUtils.java            ← Static helper to get current user
│   │   └── config/
│   │       ├── SecurityConfig.java           ← SecurityFilterChain + CORS + CSRF
│   │       ├── JpaConfig.java                ← JPA auditing, auditor provider
│   │       ├── OpenApiConfig.java            ← SpringDoc JWT security scheme
│   │       └── RedisConfig.java              ← RedisTemplate bean
│   └── db/migration/  (Flyway SQL files)
│       ├── V1.0__create_extensions_and_functions.sql
│       ├── V1.1__create_centres_table.sql
│       ├── V1.2__create_identity_tables.sql
│       ├── V2.0__create_devotee_tables.sql
│       ├── V10.2__seed_permissions.sql
│       └── V10.3__seed_default_roles.sql
```

### Stream 2 — Centre Module

```
modules/centre/
├── domain/Centre.java
├── infrastructure/CentreRepository.java
├── dto/
│   ├── CreateCentreRequest.java (record)
│   ├── UpdateCentreRequest.java (record)
│   ├── CentreResponse.java
│   └── CentreMapper.java
├── application/
│   ├── CentreService.java (interface)
│   └── CentreServiceImpl.java
└── api/CentreController.java
```

### Stream 3 — Identity Module

```
modules/identity/
├── domain/
│   ├── enums/ {UserStatus, GenderType}
│   ├── Permission.java
│   ├── Role.java
│   ├── RolePermission.java
│   ├── User.java
│   ├── UserRole.java
│   └── RefreshToken.java
├── infrastructure/
│   ├── UserRepository.java
│   ├── RoleRepository.java
│   ├── PermissionRepository.java
│   ├── UserRoleRepository.java
│   └── RefreshTokenRepository.java
├── dto/
│   ├── LoginRequest.java (record)
│   ├── RegisterRequest.java (record)
│   ├── TokenResponse.java
│   ├── RefreshTokenRequest.java (record)
│   ├── ChangePasswordRequest.java (record)
│   ├── UserResponse.java
│   ├── UserSummaryResponse.java
│   ├── RoleResponse.java
│   └── UserMapper.java
├── application/
│   ├── CustomUserDetailsService.java
│   ├── AuthService.java (interface)
│   ├── AuthServiceImpl.java
│   ├── UserService.java (interface)
│   └── UserServiceImpl.java
└── api/
    ├── AuthController.java
    └── UserController.java
```

### Stream 4 — Devotee Module

```
modules/devotee/
├── domain/
│   ├── enums/ {ProfileType, InitiationStatus, EmploymentType}
│   ├── DevoteeProfile.java
│   ├── StudentProfile.java
│   ├── ProfessionalProfile.java
│   └── AlumniProfile.java
├── infrastructure/
│   ├── DevoteeRepository.java
│   ├── StudentProfileRepository.java
│   └── ProfessionalProfileRepository.java
├── dto/
│   ├── CreateDevoteeRequest.java (record)
│   ├── UpdateDevoteeRequest.java (record)
│   ├── DevoteeResponse.java
│   ├── DevoteeSummaryResponse.java
│   ├── StudentProfileRequest.java (record)
│   ├── ProfessionalProfileRequest.java (record)
│   ├── AlumniProfileRequest.java (record)
│   └── DevoteeMapper.java
├── application/
│   ├── DevoteeService.java (interface)
│   └── DevoteeServiceImpl.java
└── api/DevoteeController.java
```

### Stream 5 — Tests

```
src/test/java/org/iskcon/iys/
├── shared/
│   └── AbstractIntegrationTest.java      ← Testcontainers base class
├── modules/
│   ├── centre/
│   │   ├── CentreServiceTest.java         ← Mockito unit test
│   │   └── CentreControllerTest.java      ← @WebMvcTest
│   ├── identity/
│   │   ├── AuthServiceTest.java           ← Mockito unit test
│   │   ├── AuthControllerTest.java        ← @WebMvcTest
│   │   └── AuthIntegrationTest.java       ← @SpringBootTest + Testcontainers
│   └── devotee/
│       ├── DevoteeServiceTest.java        ← Mockito unit test
│       └── DevoteeControllerTest.java     ← @WebMvcTest
```

---

## API Endpoints (Phase 1)

### Auth (`/api/v1/auth`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/register` | None | Register new user + create devotee profile |
| POST | `/login` | None | Login, get token pair |
| POST | `/refresh` | Cookie | Refresh access token |
| POST | `/logout` | Bearer | Logout, blacklist token |
| POST | `/change-password` | Bearer | Change own password |

### Users (`/api/v1/users`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/me` | Bearer | Get own profile |
| GET | `/{id}` | CENTRE_ADMIN | Get user by ID |
| GET | `/` | CENTRE_ADMIN | List users in centre |
| PUT | `/{id}/status` | CENTRE_ADMIN | Activate/suspend user |
| POST | `/{id}/roles` | CENTRE_ADMIN | Assign role to user |
| DELETE | `/{id}/roles/{roleId}` | CENTRE_ADMIN | Revoke role from user |

### Centres (`/api/v1/centres`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | SUPER_ADMIN | List all centres |
| POST | `/` | SUPER_ADMIN | Create centre |
| GET | `/{id}` | CENTRE_ADMIN | Get centre by ID |
| PUT | `/{id}` | SUPER_ADMIN | Update centre |
| DELETE | `/{id}` | SUPER_ADMIN | Soft-delete centre |

### Devotees (`/api/v1/devotees`)
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | `/` | COUNSELLOR+ | List devotees in centre |
| POST | `/` | CENTRE_ADMIN | Create devotee profile |
| GET | `/{id}` | COUNSELLOR+ | Get devotee by ID |
| PUT | `/{id}` | COUNSELLOR+ | Update devotee |
| DELETE | `/{id}` | CENTRE_ADMIN | Soft-delete devotee |
| GET | `/{id}/student-profile` | COUNSELLOR+ | Get student sub-profile |
| PUT | `/{id}/student-profile` | COUNSELLOR+ | Upsert student sub-profile |
| GET | `/{id}/professional-profile` | COUNSELLOR+ | Get professional sub-profile |
| PUT | `/{id}/professional-profile` | COUNSELLOR+ | Upsert professional sub-profile |
| GET | `/{id}/alumni-profile` | COUNSELLOR+ | Get alumni sub-profile |
| PUT | `/{id}/alumni-profile` | COUNSELLOR+ | Upsert alumni sub-profile |

---

## Verification Plan

### Unit Tests
```bash
./mvnw test -pl iys-backend -Dgroups="unit"
```

### Integration Tests (requires Docker for Testcontainers)
```bash
./mvnw test -pl iys-backend -Dgroups="integration"
```

### Build Verification
```bash
./mvnw clean verify -pl iys-backend
```

### Manual Verification
1. Start `docker-compose up -d` (PostgreSQL + Redis)
2. Run application with `spring.profiles.active=dev`
3. Access Swagger UI at `http://localhost:8080/swagger-ui.html`
4. Verify Flyway migrations ran: check `flyway_schema_history` table
5. Test auth flow: register → login → access protected endpoint → logout
