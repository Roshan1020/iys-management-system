# IYS Backend — README

## Prerequisites
- Java 21
- Maven 3.9+
- Docker & Docker Compose

## Quick Start

### 1. Start infrastructure
```bash
docker-compose up -d
```

### 2. Run the application
```bash
./mvnw spring-boot:run -Dspring-boot.run.profiles=dev
```

### 3. Access Swagger UI
```
http://localhost:8080/swagger-ui.html
```

### 4. Run unit tests
```bash
./mvnw test
```

### 5. Run integration tests (requires Docker)
```bash
./mvnw verify -P integration-test
```

## Project Structure

```
src/main/java/org/iskcon/iys/
├── IysApplication.java
├── shared/                    ← Cross-cutting concerns
│   ├── config/                ← SecurityConfig, JpaConfig, OpenApiConfig, RedisConfig
│   ├── domain/                ← BaseAuditEntity
│   ├── dto/                   ← ApiResponse, PageResponse
│   ├── exception/             ← Global exception handler + domain exceptions
│   └── security/              ← JwtService, JwtAuthFilter, UserPrincipal, SecurityUtils
└── modules/
    ├── centre/                ← Centre (tenant) management
    ├── identity/              ← Auth, Users, Roles, Permissions
    └── devotee/               ← Devotee profiles + sub-types
```

## API Endpoints

### Auth
| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/v1/auth/register` | None | Register + get token |
| POST | `/api/v1/auth/login` | None | Login, get token pair |
| POST | `/api/v1/auth/refresh` | — | Refresh access token |
| POST | `/api/v1/auth/logout` | Bearer | Logout |
| POST | `/api/v1/auth/change-password` | Bearer | Change password |

### Centres
| Method | Path | Auth |
|--------|------|------|
| GET | `/api/v1/centres` | SUPER_ADMIN |
| POST | `/api/v1/centres` | SUPER_ADMIN |
| GET | `/api/v1/centres/{id}` | Authenticated |
| PUT | `/api/v1/centres/{id}` | SUPER_ADMIN |
| DELETE | `/api/v1/centres/{id}` | SUPER_ADMIN |

### Devotees
| Method | Path | Auth |
|--------|------|------|
| GET | `/api/v1/devotees` | COUNSELLOR+ |
| POST | `/api/v1/devotees` | CENTRE_ADMIN+ |
| GET | `/api/v1/devotees/{id}` | COUNSELLOR+ |
| PUT | `/api/v1/devotees/{id}` | COUNSELLOR+ |
| DELETE | `/api/v1/devotees/{id}` | CENTRE_ADMIN+ |
| PUT | `/api/v1/devotees/{id}/student-profile` | COUNSELLOR+ |
| PUT | `/api/v1/devotees/{id}/professional-profile` | COUNSELLOR+ |
| PUT | `/api/v1/devotees/{id}/alumni-profile` | COUNSELLOR+ |

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://localhost:5432/iys_db` | DB URL |
| `SPRING_DATASOURCE_USERNAME` | `iys_user` | DB user |
| `SPRING_DATASOURCE_PASSWORD` | `iys_pass` | DB password |
| `SPRING_REDIS_HOST` | `localhost` | Redis host |
| `SPRING_REDIS_PASSWORD` | `iys_redis_pass` | Redis password |
| `JWT_SECRET` | (dev default) | HMAC secret (min 256 bits) |
| `JWT_ACCESS_EXPIRY_MS` | `900000` | Access token TTL (15 min) |
| `SERVER_PORT` | `8080` | HTTP port |

## Default Roles (seeded by Flyway)

| Role | Scope |
|------|-------|
| `SUPER_ADMIN` | All centres |
| `CENTRE_ADMIN` | Own centre (full) |
| `COUNSELLOR` | Assigned devotees |
| `EVENT_MANAGER` | Events + attendance |
| `SEVA_COORDINATOR` | Seva management |
| `OUTREACH_OFFICER` | Preaching contacts |
| `DEVOTEE` | Own data only |
