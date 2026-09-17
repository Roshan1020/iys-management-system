# ISKCON Youth Management Platform — System Architecture

> **Stack**: Java 21 · Spring Boot 3.x · PostgreSQL · React/TypeScript · Tailwind CSS
> **Pattern**: Modular Monolith → Microservices-ready

---

## 1. Overall System Architecture

```
┌────────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                               │
│  ┌─────────────────────┐        ┌──────────────────────────────┐   │
│  │  React + TypeScript  │        │  Mobile (future PWA/Native)  │   │
│  │  Tailwind CSS        │        │                              │   │
│  │  React Query         │        │                              │   │
│  └────────┬────────────┘        └──────────────┬───────────────┘   │
└───────────┼──────────────────────────────────── ┼──────────────────┘
            │  HTTPS / REST / SSE                  │
┌───────────▼──────────────────────────────────── ▼──────────────────┐
│                        API GATEWAY LAYER                            │
│        Spring Boot Application (Single Deployable Unit)             │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              Spring Security Filter Chain                    │  │
│  │  JWT Validation → RBAC → Rate Limiting → Audit Logging       │  │
│  └───────────────────────────┬──────────────────────────────────┘  │
│                               │                                      │
│  ┌────────────────────────────▼───────────────────────────────────┐ │
│  │              MODULE LAYER (Internal Module Boundaries)          │ │
│  │                                                                 │ │
│  │  [identity] [devotee] [sadhana] [event] [attendance]           │ │
│  │  [communication] [notification] [career] [seva]                │ │
│  │  [preaching] [admin] [reporting]                               │ │
│  └────────────────────────────┬───────────────────────────────────┘ │
│                               │                                      │
│  ┌────────────────────────────▼───────────────────────────────────┐ │
│  │                   INFRASTRUCTURE LAYER                          │ │
│  │  Spring Data JPA · Hibernate · Flyway · Redis Cache            │ │
│  └─────────────┬──────────────────────────────┬───────────────────┘ │
└────────────────┼──────────────────────────────┼────────────────────┘
                 │                              │
    ┌────────────▼──────────┐      ┌────────────▼──────────┐
    │      PostgreSQL        │      │         Redis          │
    │   (Primary Store)      │      │   (Cache / Sessions)   │
    └───────────────────────┘      └───────────────────────┘
```

### Key Architectural Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Deployment unit** | Single JAR (modular monolith) | Simplifies ops at the start while enabling future decomposition |
| **Module isolation** | Java packages with enforced internal APIs | Simulates service boundaries without network overhead |
| **Inter-module communication** | Spring Application Events (in-process) | Easy to replace with Kafka/RabbitMQ later when splitting |
| **Session strategy** | Stateless JWT + Redis token blacklist | Scales horizontally; Redis handles logout/revocation |
| **Schema ownership** | Each module owns its schema namespace | Direct migration path to per-service schemas |
| **API style** | REST + OpenAPI 3.1 | Industry standard; generates client SDKs automatically |

---

## 2. Module Boundaries

Each module is a **self-contained vertical slice**: its own controllers, services, repositories, domain models, and DTOs. Modules communicate **only through well-defined internal API interfaces** — never by calling each other's repositories directly.

```
┌─────────────────────────────────────────────────────────────────┐
│                        MODULE CATALOG                            │
├────────────────┬───────────────────┬────────────────────────────┤
│  Module        │  Responsibility   │  External Dependencies     │
├────────────────┼───────────────────┼────────────────────────────┤
│ identity       │ Auth, Users, RBAC │ (none — foundation layer)  │
│ devotee        │ Profiles, roles   │ identity                   │
│ sadhana        │ Daily scores      │ devotee, notification      │
│ event          │ Events, sessions  │ devotee, notification      │
│ attendance     │ Check-in/out      │ event, devotee             │
│ communication  │ Messaging, groups │ devotee, notification      │
│ notification   │ Email/SMS/push    │ identity                   │
│ career         │ Jobs, referrals   │ devotee, notification      │
│ seva           │ Service mgmt      │ devotee, event             │
│ preaching      │ Contact pipeline  │ devotee, communication     │
│ centre         │ Multi-centre mgmt │ identity                   │
│ reporting      │ Analytics, export │ all modules (read-only)    │
└────────────────┴───────────────────┴────────────────────────────┘
```

### Module Communication Rules

```
RULE 1:  Modules NEVER import each other's @Repository or @Entity classes.
RULE 2:  Cross-module calls go through a public @Service interface only.
RULE 3:  Async cross-module events use Spring's ApplicationEventPublisher.
RULE 4:  The reporting module reads via dedicated read-model projections (CQRS-lite).
```

> **Why this matters**: When you split into microservices, each module becomes a service. The interface becomes an HTTP/gRPC call; the ApplicationEvent becomes a Kafka topic. No business logic rewrite required.

---

## 3. Database ER Diagram

```
╔══════════════════════════════════════════════════════════════════════════╗
║                      IDENTITY & ACCESS DOMAIN                           ║
╠══════════════════════════════════════════════════════════════════════════╣
║                                                                          ║
║  ┌───────────────────┐          ┌───────────────────────┐               ║
║  │      centres      │          │         users          │               ║
║  ├───────────────────┤          ├───────────────────────┤               ║
║  │ PK id (UUID)      │◄────────-│ FK centre_id           │               ║
║  │    name           │   N:1    │ PK id (UUID)           │               ║
║  │    city           │          │    email (unique)      │               ║
║  │    country        │          │    password_hash       │               ║
║  │    timezone       │          │    phone               │               ║
║  │    created_at     │          │    is_active           │               ║
║  └───────────────────┘          │    created_at          │               ║
║                                  └──────────┬────────────┘               ║
║  ┌───────────────────┐                      │ M:N                        ║
║  │       roles       │          ┌───────────▼────────────┐               ║
║  ├───────────────────┤          │       user_roles        │               ║
║  │ PK id (UUID)      │◄─────────│ FK user_id              │               ║
║  │    name           │   N:M    │ FK role_id              │               ║
║  │    centre_id      │          │ FK centre_id            │               ║
║  └──────────┬────────┘          └─────────────────────────┘               ║
║             │ M:N                                                          ║
║  ┌──────────▼────────┐          ┌───────────────────────┐                ║
║  │  role_permissions │          │      permissions       │                ║
║  ├───────────────────┤          ├───────────────────────┤                ║
║  │ FK role_id        │─────────►│ PK id (UUID)          │                ║
║  │ FK permission_id  │   N:M    │    module             │                ║
║  └───────────────────┘          │    action             │                ║
║                                  └───────────────────────┘                ║
╚══════════════════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════════════════╗
║                        DEVOTEE PROFILE DOMAIN                           ║
╠══════════════════════════════════════════════════════════════════════════╣
║                                                                          ║
║  ┌──────────────────────────────────────────────────────────────────┐   ║
║  │                       devotee_profiles                            │   ║
║  ├──────────────────────────────────────────────────────────────────┤   ║
║  │ PK id (UUID) · FK user_id (1:1) · FK centre_id                   │   ║
║  │ initiated_name · legal_name · dob · gender                        │   ║
║  │ profile_type (STUDENT | PROFESSIONAL | ALUMNI)                    │   ║
║  │ initiation_status · spiritual_name · initiated_date               │   ║
║  │ spiritual_master · phone · address · profile_photo_url           │   ║
║  │ join_date · created_at                                            │   ║
║  └──────┬──────────────────────────────┬──────────────────┬─────────┘   ║
║         │ 1:1                          │ 1:1              │ 1:1         ║
║  ┌──────▼──────────┐   ┌──────────────▼──────┐  ┌────────▼──────────┐  ║
║  │ student_profiles│   │professional_profiles │  │  alumni_profiles  │  ║
║  ├─────────────────┤   ├─────────────────────┤  ├───────────────────┤  ║
║  │ FK devotee_id   │   │ FK devotee_id        │  │ FK devotee_id     │  ║
║  │ institution     │   │ company              │  │ graduation_year   │  ║
║  │ course          │   │ designation          │  │ institution       │  ║
║  │ year_of_study   │   │ industry             │  │ current_status    │  ║
║  │ graduation_year │   │ experience_years     │  │ profession        │  ║
║  └─────────────────┘   └─────────────────────┘  └───────────────────┘  ║
║                                                                          ║
║  ┌─────────────────────┐       ┌──────────────────────────────────┐     ║
║  │  mentor_assignments │       │      devotee_relationships        │     ║
║  ├─────────────────────┤       ├──────────────────────────────────┤     ║
║  │ FK mentor_id        │       │ FK devotee_id                    │     ║
║  │ FK mentee_id        │       │ FK related_devotee_id            │     ║
║  │ assigned_date       │       │ relationship_type                │     ║
║  │ centre_id           │       │ (FAMILY / FRIEND / REFERRER)     │     ║
║  │ is_active           │       └──────────────────────────────────┘     ║
║  └─────────────────────┘                                                ║
╚══════════════════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════════════════╗
║                           SADHANA DOMAIN                                ║
╠══════════════════════════════════════════════════════════════════════════╣
║                                                                          ║
║  ┌───────────────────────────┐    ┌─────────────────────────────────┐   ║
║  │      sadhana_records      │    │       sadhana_templates          │   ║
║  ├───────────────────────────┤    ├─────────────────────────────────┤   ║
║  │ PK id (UUID)              │    │ PK id (UUID)                    │   ║
║  │ FK devotee_id             │    │    name, description            │   ║
║  │ FK template_id            │    │    centre_id (null = global)    │   ║
║  │ record_date               │    │    is_active                    │   ║
║  │ rounds_chanted            │    └─────────────────────────────────┘   ║
║  │ mangal_arati (bool)       │                                          ║
║  │ japa_session (bool)       │    ┌─────────────────────────────────┐   ║
║  │ class_attendance (bool)   │    │         sadhana_scores           │   ║
║  │ reading_minutes           │    ├─────────────────────────────────┤   ║
║  │ score (computed)          │    │ FK devotee_id                   │   ║
║  │ notes · created_at        │    │ week · month · year             │   ║
║  └───────────────────────────┘    │ avg_score · total_rounds        │   ║
║                                    │ attendance_pct (mat. view)      │   ║
║                                    └─────────────────────────────────┘   ║
╚══════════════════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════════════════╗
║                     EVENTS & ATTENDANCE DOMAIN                          ║
╠══════════════════════════════════════════════════════════════════════════╣
║                                                                          ║
║  ┌──────────────────────────────┐    ┌────────────────────────────────┐ ║
║  │            events            │    │            sessions            │ ║
║  ├──────────────────────────────┤    ├────────────────────────────────┤ ║
║  │ PK id (UUID)                 │    │ PK id (UUID)                   │ ║
║  │ FK centre_id                 │◄───│ FK event_id                    │ ║
║  │ title, description           │1:N │ title, facilitator             │ ║
║  │ event_type                   │    │ start_time, end_time           │ ║
║  │ start_date, end_date         │    │ location, capacity             │ ║
║  │ location, capacity           │    └───────────────┬────────────────┘ ║
║  │ registration_open            │                    │ 1:N              ║
║  │ created_by (user_id)         │    ┌───────────────▼────────────────┐ ║
║  └──────────────────────────────┘    │           attendance           │ ║
║                                       ├────────────────────────────────┤ ║
║  ┌──────────────────────────────┐    │ PK id (UUID)                   │ ║
║  │     event_registrations      │    │ FK session_id · FK devotee_id  │ ║
║  ├──────────────────────────────┤    │ check_in_time · check_out_time │ ║
║  │ FK event_id · FK devotee_id  │    │ attendance_method (QR/MANUAL)  │ ║
║  │ registered_at                │    │ marked_by (user_id)            │ ║
║  │ status (CONFIRMED/WAITLIST)  │    └────────────────────────────────┘ ║
║  │ payment_status               │                                       ║
║  └──────────────────────────────┘                                       ║
╚══════════════════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════════════════╗
║                        CAREER & SEVA DOMAIN                             ║
╠══════════════════════════════════════════════════════════════════════════╣
║                                                                          ║
║  ┌─────────────────────────────┐   ┌─────────────────────────────────┐  ║
║  │         job_posts           │   │       seva_opportunities         │  ║
║  ├─────────────────────────────┤   ├─────────────────────────────────┤  ║
║  │ PK id (UUID)                │   │ PK id (UUID)                    │  ║
║  │ FK posted_by (devotee)      │   │ FK centre_id · FK event_id (?)  │  ║
║  │ title, description          │   │ title, description              │  ║
║  │ company, location           │   │ seva_type, skills_needed        │  ║
║  │ job_type                    │   │ start_date, end_date            │  ║
║  │ skills_required             │   │ max_volunteers                  │  ║
║  │ is_devotee_friendly (bool)  │   └──────────────┬──────────────────┘  ║
║  │ expires_at                  │                  │ 1:N                 ║
║  └──────────────┬──────────────┘   ┌──────────────▼──────────────────┐  ║
║                 │ 1:N              │        seva_enrollments          │  ║
║  ┌──────────────▼──────────────┐   ├─────────────────────────────────┤  ║
║  │      job_applications       │   │ FK seva_id · FK devotee_id      │  ║
║  ├─────────────────────────────┤   │ enrolled_at · status            │  ║
║  │ FK job_id · FK devotee_id   │   │ feedback · hours_completed      │  ║
║  │ status · cover_note         │   └─────────────────────────────────┘  ║
║  │ referral_devotee_id         │                                        ║
║  └─────────────────────────────┘                                        ║
╚══════════════════════════════════════════════════════════════════════════╝

╔══════════════════════════════════════════════════════════════════════════╗
║                   COMMUNICATION & PREACHING DOMAIN                      ║
╠══════════════════════════════════════════════════════════════════════════╣
║                                                                          ║
║  ┌──────────────────────────────┐   ┌──────────────────────────────┐    ║
║  │    communication_groups      │   │      preaching_contacts       │    ║
║  ├──────────────────────────────┤   ├──────────────────────────────┤    ║
║  │ PK id (UUID)                 │   │ PK id (UUID)                 │    ║
║  │ name                         │   │ FK added_by (devotee)        │    ║
║  │ type (BATCH/CENTRE/OPEN)     │   │ FK assigned_to (devotee)     │    ║
║  │ FK centre_id · created_by    │   │ name · phone · email         │    ║
║  └──────────────┬───────────────┘   │ interest_level · stage       │    ║
║                 │ 1:N               │ notes                        │    ║
║  ┌──────────────▼───────────────┐   └──────────────┬───────────────┘    ║
║  │       group_messages         │                  │ 1:N               ║
║  ├──────────────────────────────┤   ┌──────────────▼───────────────┐    ║
║  │ FK group_id · FK sender_id   │   │      contact_followups        │    ║
║  │ content · message_type       │   ├──────────────────────────────┤    ║
║  │ sent_at · is_pinned          │   │ FK contact_id · FK done_by   │    ║
║  └──────────────────────────────┘   │ followup_date · notes        │    ║
║                                      │ outcome                      │    ║
║  ┌──────────────────────────────┐   └──────────────────────────────┘    ║
║  │        notifications         │                                        ║
║  ├──────────────────────────────┤                                        ║
║  │ FK user_id · type · channel  │                                        ║
║  │ title · body · reference_id  │                                        ║
║  │ is_read · sent_at            │                                        ║
║  └──────────────────────────────┘                                        ║
╚══════════════════════════════════════════════════════════════════════════╝
```

---

## 4. Entity Relationships (Summary)

```
centres          ──<  users                  (1 centre has many users)
users            ──<  user_roles             (1 user has many role assignments)
users            1:1  devotee_profiles
devotee_profiles ──<  sadhana_records        (daily log per devotee)
devotee_profiles ──<  mentor_assignments     (as mentor AND as mentee)
events           ──<  sessions
sessions         ──<  attendance
events           ──<  event_registrations
devotee_profiles ──<  event_registrations
job_posts        ──<  job_applications
seva_opportunities ──< seva_enrollments
devotee_profiles ──<  preaching_contacts     (added_by + assigned_to)
communication_groups ──< group_messages
users            ──<  notifications
```

**Discriminator strategy for devotee sub-types**: The base `devotee_profiles` table holds all common fields. Sub-type tables (`student_profiles`, `professional_profiles`, `alumni_profiles`) each hold a FK to `devotee_profiles.id` plus their own specific columns. This is **Table-per-Subclass (Joined)** in JPA — avoiding sparse columns while keeping polymorphic queries clean.

---

## 5. API Architecture

### URL Design Convention

```
/api/v1/{module}/{resource}

Examples:
GET    /api/v1/devotees                         → list devotees (filter + paginate)
GET    /api/v1/devotees/{id}                    → devotee profile detail
POST   /api/v1/devotees                         → create devotee
PUT    /api/v1/devotees/{id}                    → update devotee
GET    /api/v1/devotees/{id}/sadhana            → sadhana records for a devotee
POST   /api/v1/sadhana                          → submit daily sadhana
GET    /api/v1/events                           → event listing
POST   /api/v1/events/{id}/register             → register for event
POST   /api/v1/attendance/sessions/{id}/checkin → QR / manual check-in
GET    /api/v1/careers/jobs                     → job board
POST   /api/v1/careers/jobs/{id}/apply          → apply for job
GET    /api/v1/admin/reports/sadhana            → aggregated sadhana report
```

### Response Envelope

```json
// Success
{
  "success": true,
  "data": { ... },
  "meta": { "page": 1, "size": 20, "total": 450 },
  "timestamp": "2026-09-16T10:49:00Z"
}

// Error
{
  "success": false,
  "error": {
    "code": "DEVOTEE_NOT_FOUND",
    "message": "Devotee with id abc-123 not found",
    "details": []
  },
  "timestamp": "2026-09-16T10:49:00Z"
}
```

### Module API Groups

| Module | Base Path | Key Endpoints |
|--------|-----------|---------------|
| identity | `/api/v1/auth` | login, refresh, logout, register |
| centres | `/api/v1/centres` | CRUD, stats per centre |
| devotees | `/api/v1/devotees` | CRUD, search, sub-type profiles |
| sadhana | `/api/v1/sadhana` | submit, history, leaderboard |
| events | `/api/v1/events` | CRUD, register, cancel |
| sessions | `/api/v1/sessions` | CRUD, attendance |
| attendance | `/api/v1/attendance` | check-in, check-out, report |
| communication | `/api/v1/messages` | group CRUD, send, threads |
| notifications | `/api/v1/notifications` | list, mark-read, preferences |
| career | `/api/v1/careers` | jobs CRUD, applications, referrals |
| seva | `/api/v1/seva` | opportunities, enroll, complete |
| preaching | `/api/v1/preaching` | contacts, follow-ups, pipeline |
| admin | `/api/v1/admin` | reports, export, bulk actions |

### OpenAPI Strategy

- All APIs documented with OpenAPI 3.1 annotations inline on controllers.
- A single `openapi.yaml` generated at build time via SpringDoc.
- **Versioning**: URL path versioning (`/v1/`, `/v2/`) — cleanest for consumer compatibility.
- Breaking changes always go to `/v2/` while `/v1/` is maintained for one release cycle.

---

## 6. Authentication Architecture

```
┌─────────────────┐  POST /api/v1/auth/login   ┌──────────────────────────┐
│   React Client  │────────────────────────────►│    AuthController         │
│                 │                             │    (identity module)      │
│                 │◄────────────────────────────│                          │
│  Stores:        │  { accessToken,             │  1. Validate credentials  │
│  - accessToken  │    refreshToken (cookie) }  │  2. Load roles + perms    │
│    (JS memory)  │                             │  3. Build JWT claims      │
│  - refreshToken │                             │  4. Issue token pair      │
│    (httpOnly    │                             └──────────────────────────┘
│     cookie)     │
│                 │   Subsequent calls (Bearer accessToken)
│                 │──────────────────────────────────────────────────────►
│                 │
│                 │   When accessToken expires (401 received):
│                 │──── POST /api/v1/auth/refresh ────────────────────────►
│                 │◄─── { new accessToken } ─────────────────────────────-│
└─────────────────┘
```

### JWT Claim Structure

```json
{
  "sub": "user-uuid",
  "email": "prabhu@example.com",
  "centreId": "centre-uuid",
  "roles": ["COUNSELLOR", "EVENT_MANAGER"],
  "permissions": ["devotee:read", "event:write", "attendance:write"],
  "iat": 1726464000,
  "exp": 1726467600
}
```

### Token Strategy

| Token | Storage | TTL | Notes |
|-------|---------|-----|-------|
| Access Token | JS memory (React state/context) | 15 minutes | Short-lived; prevents XSS persistence |
| Refresh Token | HttpOnly, Secure cookie | 7 days | Invisible to JS; CSRF-protected via `SameSite=Strict` |

### Logout & Revocation

1. On logout → access token added to Redis **token blacklist** (TTL = remaining token lifetime).
2. Refresh token deleted from the `refresh_tokens` DB table.
3. Every `JwtAuthFilter` call checks Redis blacklist before proceeding.

---

## 7. RBAC and Permissions

### Role Hierarchy

```
SUPER_ADMIN           → Full system access across all centres
  │
  ├── CENTRE_ADMIN    → Full access within their centre only
  │     │
  │     ├── COUNSELLOR / MENTOR   → Manage assigned devotees, sadhana, follow-ups
  │     │
  │     ├── EVENT_MANAGER         → Manage events, sessions, attendance
  │     │
  │     ├── SEVA_COORDINATOR      → Manage seva opportunities and enrollments
  │     │
  │     └── OUTREACH_OFFICER      → Manage preaching contacts and pipeline
  │
  └── DEVOTEE (base)  → Own profile, own sadhana, event registration
```

### Permission Matrix

| Permission | DEVOTEE | COUNSELLOR | EVENT_MGR | CENTRE_ADMIN | SUPER_ADMIN |
|-----------|:-------:|:----------:|:---------:|:------------:|:-----------:|
| devotee:read:own | ✅ | ✅ | ✅ | ✅ | ✅ |
| devotee:read:centre | ❌ | ✅ | ✅ | ✅ | ✅ |
| devotee:write | ❌ | limited | ❌ | ✅ | ✅ |
| sadhana:read:own | ✅ | ✅ | ❌ | ✅ | ✅ |
| sadhana:read:mentees | ❌ | ✅ | ❌ | ✅ | ✅ |
| event:write | ❌ | ❌ | ✅ | ✅ | ✅ |
| attendance:write | ❌ | ❌ | ✅ | ✅ | ✅ |
| career:write | ❌ | ❌ | ❌ | ✅ | ✅ |
| admin:reports | ❌ | ❌ | ❌ | ✅ | ✅ |
| centre:manage | ❌ | ❌ | ❌ | own only | ✅ |

### Multi-Centre Isolation Rule

```
A user with CENTRE_ADMIN for Centre A can NEVER access data of Centre B.

Enforced via:
  1. @PreAuthorize checking centreId in JWT against resource's centreId.
  2. All repository queries include WHERE centre_id = :centreId.
  3. SUPER_ADMIN bypasses centreId checks only.
```

### Implementation Approach

- Spring Security `@PreAuthorize("hasPermission(...)")` on service methods.
- A custom `PermissionEvaluator` resolves `hasPermission(targetId, 'devotee', 'read')`.
- Roles and permissions loaded at login, embedded in JWT — **zero DB calls per request**.
- Permissions are **additive** — multiple roles union all their permissions.

---

## 8. Security Architecture

### Defense in Depth Layers

```
Layer 1: NETWORK
  ├── TLS 1.3 only (HTTPS everywhere)
  ├── HSTS header
  └── Rate limiting on auth endpoints (Spring filters + Redis counters)

Layer 2: AUTHENTICATION
  ├── JWT validation on every request
  ├── Token blacklist check via Redis
  └── Refresh token rotation (new token issued on each refresh)

Layer 3: AUTHORIZATION
  ├── RBAC via Spring Security @PreAuthorize
  ├── Centre-based data isolation (WHERE clause enforced)
  └── Method-level security (@Secured, @PreAuthorize)

Layer 4: INPUT VALIDATION
  ├── Bean Validation (Jakarta Validation) on all request DTOs
  ├── Custom validators for business rules
  ├── SQL injection prevention via JPA parameterized queries
  └── XSS prevention via input sanitization

Layer 5: AUDIT
  ├── Hibernate Envers for entity change history
  ├── @AuditLog custom annotation on sensitive operations
  └── audit_logs table: who + what + when + from where (IP)

Layer 6: DATA
  ├── Passwords: BCrypt (strength 12)
  ├── PII fields: AES-256 encryption at-rest (phone numbers)
  └── PostgreSQL Row-Level Security (RLS) as additional backstop
```

### Security Headers

```
X-Content-Type-Options:        nosniff
X-Frame-Options:               DENY
Content-Security-Policy:       default-src 'self'; ...
Strict-Transport-Security:     max-age=31536000; includeSubDomains
Referrer-Policy:               strict-origin-when-cross-origin
```

### CORS Configuration

```
Allowed Origins:   [dev: http://localhost:5173, prod: https://iys.yourorg.com]
Allowed Methods:   GET, POST, PUT, DELETE, PATCH
Allowed Headers:   Authorization, Content-Type
Allow Credentials: true   (required for refresh token cookie)
```

---

## 9. Folder Structure

### Backend (Spring Boot)

```
iys-backend/
├── src/main/java/org/iskcon/iys/
│   │
│   ├── IysApplication.java                    ← Spring Boot entry point
│   │
│   ├── shared/                                ← Cross-cutting (NOT a module)
│   │   ├── config/                            ← SecurityConfig, RedisConfig, JpaConfig
│   │   ├── exception/                         ← GlobalExceptionHandler, domain exceptions
│   │   ├── audit/                             ← @AuditLog annotation + AuditAspect
│   │   ├── dto/                               ← ApiResponse<T>, PageResponse<T>
│   │   ├── security/                          ← JwtService, JwtAuthFilter, PermissionEvaluator
│   │   └── util/                              ← DateUtils, StringUtils
│   │
│   └── modules/
│       │
│       ├── identity/                          ← Auth & Users
│       │   ├── api/
│       │   │   └── AuthController.java
│       │   ├── application/
│       │   │   └── AuthService.java
│       │   ├── domain/
│       │   │   ├── User.java
│       │   │   ├── Role.java
│       │   │   └── Permission.java
│       │   ├── infrastructure/
│       │   │   └── UserRepository.java
│       │   └── dto/
│       │       ├── LoginRequest.java
│       │       └── TokenResponse.java
│       │
│       ├── centre/                            ← Centre Management
│       │   ├── api/ · application/ · domain/ · infrastructure/ · dto/
│       │
│       ├── devotee/                           ← Devotee Profiles
│       │   ├── api/
│       │   ├── application/
│       │   │   └── DevoteeService.java
│       │   ├── domain/
│       │   │   ├── DevoteeProfile.java
│       │   │   ├── StudentProfile.java
│       │   │   ├── ProfessionalProfile.java
│       │   │   └── AlumniProfile.java
│       │   ├── infrastructure/
│       │   └── dto/
│       │
│       ├── sadhana/                           ← Sadhana Tracking
│       ├── event/                             ← Events & Sessions
│       ├── attendance/                        ← Attendance (QR + Manual)
│       ├── communication/                     ← Messaging & Groups
│       ├── notification/                      ← Email / SMS / Push
│       ├── career/                            ← Jobs & Referrals
│       ├── seva/                              ← Seva Management
│       ├── preaching/                         ← Preaching CRM
│       └── reporting/                         ← Admin Reports & Analytics
│
│   [Every module follows: api/ · application/ · domain/ · infrastructure/ · dto/]
│
├── src/main/resources/
│   ├── application.yml
│   ├── application-dev.yml
│   ├── application-prod.yml
│   └── db/migration/                          ← Flyway migration scripts
│       ├── V1__create_identity_schema.sql
│       ├── V2__create_devotee_schema.sql
│       ├── V3__create_sadhana_schema.sql
│       ├── V4__create_event_schema.sql
│       └── ...
│
├── src/test/java/org/iskcon/iys/
│   └── modules/
│       ├── identity/
│       │   ├── AuthControllerTest.java        ← @WebMvcTest slice tests
│       │   └── AuthServiceTest.java           ← @ExtendWith(MockitoExtension)
│       ├── devotee/
│       └── ...                                ← Mirror of main structure
│
├── docker/
│   ├── Dockerfile
│   └── docker-compose.yml                     ← PostgreSQL + Redis + App
│
└── pom.xml
```

### Frontend (React)

```
iys-frontend/
├── src/
│   ├── main.tsx                               ← App entry point
│   ├── App.tsx                                ← Router + layout shell
│   │
│   ├── api/                                   ← API client layer
│   │   ├── client.ts                          ← Axios setup, interceptors, silent refresh
│   │   └── endpoints/
│   │       ├── auth.api.ts
│   │       ├── devotees.api.ts
│   │       ├── sadhana.api.ts
│   │       └── ...                            ← One file per module
│   │
│   ├── features/                              ← Feature modules (mirrors backend)
│   │   ├── auth/
│   │   │   ├── components/                    ← LoginForm, LogoutButton
│   │   │   ├── hooks/                         ← useAuth, useLogin, useLogout
│   │   │   └── store/                         ← AuthContext / Zustand slice
│   │   ├── devotees/
│   │   │   ├── components/                    ← DevoteeCard, DevoteeForm
│   │   │   ├── hooks/                         ← useDevotees, useDevoteeById
│   │   │   └── pages/                         ← DevoteeListPage, DevoteeDetailPage
│   │   ├── sadhana/
│   │   ├── events/
│   │   ├── attendance/
│   │   ├── career/
│   │   ├── seva/
│   │   ├── communication/
│   │   ├── preaching/
│   │   └── admin/
│   │
│   ├── shared/                                ← Reusable cross-feature
│   │   ├── components/                        ← Button, Modal, Table, Input, Badge
│   │   ├── hooks/                             ← useDebounce, usePagination, usePermission
│   │   ├── layout/                            ← Sidebar, TopBar, AppShell
│   │   └── types/                             ← Shared TypeScript interfaces
│   │
│   └── lib/
│       ├── queryClient.ts                     ← React Query client config
│       └── utils.ts
│
├── index.html
├── tailwind.config.ts
├── vite.config.ts
└── package.json
```

---

## 10. Development Phases

### Phase 0 — Infrastructure Setup (Weeks 1–2)

- [ ] Git repository + GitFlow branching strategy
- [ ] Docker Compose: PostgreSQL + Redis + App
- [ ] Spring Boot scaffold with all declared dependencies
- [ ] Flyway baseline migration
- [ ] CI pipeline (GitHub Actions: build → test → lint → OpenAPI generate)
- [ ] React + Vite + Tailwind + TypeScript scaffold
- [ ] Environment config (dev / staging / prod profiles)

### Phase 1 — Identity & Multi-Centre Foundation (Weeks 3–5)

- [ ] `identity` module: User entity, registration, login, JWT issuance
- [ ] `centre` module: Centre CRUD, multi-centre data isolation
- [ ] RBAC framework: Roles, permissions, `@PreAuthorize` wiring
- [ ] Refresh token rotation + Redis blacklist
- [ ] React: Login, logout, protected routes, permission guards
- [ ] OpenAPI/Swagger UI live

> **Gate**: Secure login, role assignment, and centre isolation working end-to-end.

### Phase 2 — Devotee Profiles (Weeks 6–9)

- [ ] `devotee` module: Base profile + student / professional / alumni sub-types
- [ ] Mentor assignment system
- [ ] Profile photo upload (MinIO / S3)
- [ ] Search and filter (by type, centre, initiation status)
- [ ] React: Profile list, detail view, create/edit forms

> **Gate**: Complete devotee lifecycle management.

### Phase 3 — Sadhana Tracking (Weeks 10–12)

- [ ] `sadhana` module: Daily record submission + validation
- [ ] Automated score computation
- [ ] Weekly/monthly aggregation (PostgreSQL materialized views)
- [ ] Counsellor view of mentee sadhana
- [ ] React: Sadhana entry form, history charts, leaderboard

> **Gate**: Daily sadhana submission and reporting fully functional.

### Phase 4 — Events, Sessions & Attendance (Weeks 13–16)

- [ ] `event` module: Event and session CRUD
- [ ] Registration system with waitlist management
- [ ] `attendance` module: QR-code and manual check-in
- [ ] Attendance report per session/event
- [ ] React: Event listing, registration flow, QR attendance scanner

> **Gate**: Complete event lifecycle with attendance tracking.

### Phase 5 — Communication & Notifications (Weeks 17–19)

- [ ] `communication` module: Groups, threaded messaging
- [ ] `notification` module: Email (SendGrid), SMS (Twilio), in-app push
- [ ] Notification preferences per user
- [ ] Broadcast announcements from admin
- [ ] React: Messaging interface, notification bell, preference settings

> **Gate**: Centre-wide and group messaging fully functional.

### Phase 6 — Career, Seva & Preaching (Weeks 20–23)

- [ ] `career` module: Job posting, application tracking, referral system
- [ ] `seva` module: Opportunities, enrolment, completion logging
- [ ] `preaching` module: Contact CRM, follow-up pipeline, stage tracking
- [ ] React: Job board, seva board, preaching contact manager

> **Gate**: Career, seva, and preaching workflows complete.

### Phase 7 — Reporting & Admin Dashboard (Weeks 24–26)

- [ ] `reporting` module: Cross-module analytics queries
- [ ] CQRS-lite read models / projections for heavy reports
- [ ] Export to CSV / Excel / PDF
- [ ] Admin dashboard: Devotee growth, sadhana trends, event stats
- [ ] React: Admin dashboard, report pages, export functionality

> **Gate**: Admins can generate and export all key reports.

### Phase 8 — Hardening & Go-Live (Weeks 27–30)

- [ ] OWASP security checklist review
- [ ] Performance testing (k6): target p95 API response < 200ms
- [ ] Redis caching on hot read paths (devotee list, sadhana scores)
- [ ] Query optimization (`EXPLAIN ANALYZE` on all list queries)
- [ ] JUnit 5 + Mockito test coverage ≥ 80%
- [ ] User acceptance testing with centre admins
- [ ] Production Docker / Kubernetes deployment
- [ ] Monitoring: Spring Boot Actuator + Prometheus + Grafana

---

## Microservices Migration Path

When the system is ready to scale, each module becomes an independent service with **minimal changes** — only the wiring is replaced:

```
Modular Monolith           →    Microservices
─────────────────────────────────────────────────────────────
identity module            →    auth-service
devotee module             →    devotee-service
sadhana module             →    sadhana-service
event module               →    event-service
attendance module          →    attendance-service
communication module       →    communication-service
notification module        →    notification-service
career module              →    career-service
seva module                →    seva-service
preaching module           →    preaching-service
reporting module           →    reporting-service (CQRS read side)

Migration steps per module:
  1. Extract module to its own Spring Boot project (already self-contained)
  2. Replace ApplicationEvent → Kafka topic
  3. Replace internal service interface → Feign client / gRPC stub
  4. Move Flyway scripts to service-specific migration folder
  5. Add Spring Cloud Gateway in front of all services
  6. Deploy independently behind the gateway

No business logic is rewritten — only the transport layer changes.
```

---

## Technology Decision Summary

| Technology | Decision Rationale |
|-----------|-------------------|
| **Java 21** | Virtual threads (Project Loom) for high concurrency without reactive complexity |
| **Spring Boot 3.x** | Best-in-class Java ecosystem; native GraalVM support for fast startup |
| **PostgreSQL** | ACID compliance; rich JSON support; excellent indexing for complex queries |
| **Flyway** | SQL-first migrations; auditable; version-controlled schema evolution |
| **Redis** | Token blacklist + response cache; O(1) lookup; TTL-native data expiry |
| **React Query** | Declarative server-state management; cache + background refresh + pagination |
| **Tailwind CSS** | Utility-first; consistent design system; no CSS-in-JS runtime overhead |
| **Docker** | Environment parity; easy local dev; direct path to container orchestration |
| **OpenAPI 3.1** | Auto-generated interactive docs; client SDK generation; contract-first design |
