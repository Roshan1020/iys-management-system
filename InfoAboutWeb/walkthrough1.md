# Phase 1 Implementation Walkthrough — IYS Backend

## Overview

We have implemented **Phase 1 (Foundation, Identity, Centre, and Devotee modules)** for the **ISKCON Youth Management Platform (IYS)**. The project is structured as a clean, modular monolith built with:

- **Language & Framework**: Java 17/21, Spring Boot 3.3.4
- **Security & Identity**: Spring Security 6, JJWT 0.12.6 (stateless Bearer authentication, refresh token rotation, Redis blacklist support)
- **Database & Persistence**: PostgreSQL 16, Spring Data JPA, Hibernate 6 (`@SQLRestriction`), Flyway migrations
- **Documentation**: SpringDoc OpenAPI 3.1 / Swagger UI
- **Testing**: JUnit 5, Mockito, Spring Boot Test, Testcontainers (PostgreSQL)

---

## Architecture & Directory Structure

```
d:\MyProject_2025\IYS_Managment_System\iys-backend\
├── pom.xml
├── docker-compose.yml
├── README.md
├── src/
│   ├── main/
│   │   ├── java/org/iskcon/iys/
│   │   │   ├── IysApplication.java
│   │   │   ├── shared/
│   │   │   │   ├── domain/BaseAuditEntity.java
│   │   │   │   ├── dto/{ApiResponse.java, PageResponse.java}
│   │   │   │   ├── exception/{ErrorCode.java, IysException.java, ResourceNotFoundException.java, DuplicateResourceException.java, UnauthorizedException.java, ForbiddenException.java, GlobalExceptionHandler.java}
│   │   │   │   ├── security/{UserPrincipal.java, JwtService.java, JwtAuthFilter.java, IysPermissionEvaluator.java, SecurityUtils.java}
│   │   │   │   └── config/{SecurityConfig.java, JpaConfig.java, OpenApiConfig.java, RedisConfig.java}
│   │   │   └── modules/
│   │   │       ├── centre/
│   │   │       │   ├── domain/Centre.java
│   │   │       │   ├── infrastructure/CentreRepository.java
│   │   │       │   ├── dto/{CreateCentreRequest.java, UpdateCentreRequest.java, CentreResponse.java, CentreMapper.java}
│   │   │       │   ├── application/{CentreService.java, CentreServiceImpl.java}
│   │   │       │   └── api/CentreController.java
│   │   │       ├── identity/
│   │   │       │   ├── domain/{User.java, Role.java, Permission.java, UserRole.java, RefreshToken.java}
│   │   │       │   ├── domain/enums/{UserStatus.java, GenderType.java}
│   │   │       │   ├── infrastructure/{UserRepository.java, RoleRepository.java, PermissionRepository.java, UserRoleRepository.java, RefreshTokenRepository.java}
│   │   │       │   ├── dto/{LoginRequest.java, RegisterRequest.java, TokenResponse.java, RefreshTokenRequest.java, ChangePasswordRequest.java, UserResponse.java, UserSummaryResponse.java, AssignRoleRequest.java, UserMapper.java}
│   │   │       │   ├── application/{CustomUserDetailsService.java, AuthService.java, AuthServiceImpl.java, UserService.java, UserServiceImpl.java}
│   │   │       │   └── api/{AuthController.java, UserController.java}
│   │   │       └── devotee/
│   │   │           ├── domain/{DevoteeProfile.java, StudentProfile.java, ProfessionalProfile.java, AlumniProfile.java}
│   │   │           ├── domain/enums/{ProfileType.java, InitiationStatus.java, EmploymentType.java}
│   │   │           ├── infrastructure/{DevoteeRepository.java, StudentProfileRepository.java, ProfessionalProfileRepository.java, AlumniProfileRepository.java}
│   │   │           ├── dto/{CreateDevoteeRequest.java, UpdateDevoteeRequest.java, DevoteeResponse.java, DevoteeSummaryResponse.java, StudentProfileRequest.java, ProfessionalProfileRequest.java, AlumniProfileRequest.java, DevoteeMapper.java}
│   │   │           ├── application/{DevoteeService.java, DevoteeServiceImpl.java}
│   │   │           └── api/DevoteeController.java
│   │   └── resources/
│   │       ├── application.yml
│   │       ├── application-dev.yml
│   │       └── db/migration/
│   │           ├── V1.0__create_extensions_and_functions.sql
│   │           ├── V1.1__create_centres_table.sql
│   │           ├── V1.2__create_identity_tables.sql
│   │           ├── V2.0__create_devotee_tables.sql
│   │           ├── V10.2__seed_permissions.sql
│   │           └── V10.3__seed_default_roles.sql
│   └── test/
│       ├── java/org/iskcon/iys/
│       │   ├── AbstractIntegrationTest.java
│       │   ├── modules/centre/{CentreServiceTest.java, CentreControllerTest.java}
│       │   ├── modules/identity/{AuthServiceTest.java, AuthControllerTest.java}
│       │   └── modules/devotee/DevoteeServiceTest.java
│       └── resources/
│           └── application.yml (H2 in-memory test configuration)
```

---

## Key Design & Implementation Highlights

### 1. Multi-Tenancy & Centre Isolation
- Every domain resource is scoped to a `centre_id`.
- `IysPermissionEvaluator` and service-level assertions verify that non-super-admin users only read or mutate records belonging to their assigned centre.
- `SUPER_ADMIN` has global visibility and bypasses centre-specific boundaries.

### 2. Soft Deletion & Audit Fields
- All primary entities extend `BaseAuditEntity`, which contains `id`, `created_at`, `updated_at`, `created_by`, `updated_by`, `deleted_at`, and `deleted_by`.
- Entities use Hibernate 6 `@SQLRestriction("deleted_at IS NULL")`.
- `JpaConfig` binds the Spring Data auditor to `SecurityUtils.getCurrentUser().getUserId()` to automatically set creator/modifier audit fields.

### 3. Stateless JWT & Refresh Token Rotation
- JJWT 0.12.6 produces cryptographically signed HMAC-SHA256 tokens carrying `userId`, `centreId`, `roles`, and fine-grained `permissions`.
- Refresh tokens are stored in hashed form (`SHA-256`) in the PostgreSQL `refresh_tokens` table.
- When an access token is refreshed, the old refresh token is marked revoked (`ROTATION`) and a new pair is issued.
- Logout registers the token's JTI in Redis with a matching TTL to enable immediate revocation.

### 4. Database Schema & Flyway Migrations
- `V1.0`: Initializes `pgcrypto`, `pg_trgm`, `btree_gin`, and `fn_set_updated_at()` trigger.
- `V1.1`: Tenant root table `centres`.
- `V1.2`: `users`, `refresh_tokens`, `roles`, `permissions`, `role_permissions`, and `user_roles`.
- `V2.0`: `devotee_profiles` + sub-tables (`student_profiles`, `professional_profiles`, `alumni_profiles`) with GIN trigram indexes for fast fuzzy name lookups.
- `V10.2`: Populates the static permissions catalog.
- `V10.3`: Seeds standard system roles (`SUPER_ADMIN`, `CENTRE_ADMIN`, `COUNSELLOR`, `EVENT_MANAGER`, `SEVA_COORDINATOR`, `OUTREACH_OFFICER`, `DEVOTEE`) and binds their respective permissions.

---

## REST Endpoints Implemented

### Authentication (`/api/v1/auth`)
- `POST /register`: Registers user and generates credentials.
- `POST /login`: Validates credentials, saves last login timestamp, issues access + refresh tokens.
- `POST /refresh`: Rotates refresh token and issues fresh access token.
- `POST /logout`: Invalidates active session (blacklists JTI in Redis).
- `POST /change-password`: Verifies current password and updates hash.

### Centre Management (`/api/v1/centres`)
- `GET /`: Lists all centres with pagination (`SUPER_ADMIN` only).
- `POST /`: Creates a new centre (`SUPER_ADMIN` only).
- `GET /{id}`: Gets details of a centre (Authenticated).
- `PUT /{id}`: Updates centre details (`SUPER_ADMIN` only).
- `DELETE /{id}`: Soft-deletes a centre (`SUPER_ADMIN` only).

### User Management (`/api/v1/users`)
- `GET /me`: Gets the profile of the currently logged-in user.
- `GET /{id}`: Gets a user by ID (`CENTRE_ADMIN` / `SUPER_ADMIN`).
- `GET /`: Lists users in a centre (`CENTRE_ADMIN` / `SUPER_ADMIN`).
- `PUT /{id}/status`: Activates, suspends, or modifies user status.
- `POST /{id}/roles`: Assigns a role to a user within a centre.
- `DELETE /{id}/roles/{roleId}`: Revokes a role assignment.

### Devotee Profiles (`/api/v1/devotees`)
- `GET /`: Paginated devotee search with name/profile-type filters.
- `POST /`: Creates devotee profile.
- `GET /{id}`: Retrieves full devotee profile with sub-profiles.
- `PUT /{id}`: Updates devotee fields.
- `DELETE /{id}`: Soft-deletes devotee profile.
- `GET` & `PUT /{id}/student-profile`: Manages student-specific attributes.
- `GET` & `PUT /{id}/professional-profile`: Manages professional/career attributes.
- `GET` & `PUT /{id}/alumni-profile`: Manages alumni engagement attributes.

---

## How to Run & Verify

### 1. Launch PostgreSQL & Redis
```powershell
cd d:\MyProject_2025\IYS_Managment_System\iys-backend
docker-compose up -d
```

### 2. Run the Application
```powershell
mvn spring-boot:run -Dspring-boot.run.profiles=dev
```

### 3. Open Swagger UI
Navigate to:
```
http://localhost:8080/swagger-ui.html
```
Use the **Authorize** button with the Bearer token returned by `/api/v1/auth/login`.

### 4. Run Unit Tests
```powershell
mvn test
```
