# Janus Project Context

## Project Philosophy

**Janus** is named after the Roman god of beginnings, endings, transitions, doors, and portals. The deity is characterized by having two faces to look simultaneously at the past and the future.

This naming reflects the project's dual nature and its focus on transitions, transformations, and multi-faceted perspectives.

---

## Architecture Overview

### Technology Stack

**janus-backend (Backend Project)**
- **Framework**: Quarkus 3.27.2 (Supersonic Subatomic Java Framework)
- **Language**: Java 21
- **Build Tool**: Gradle
- **REST Framework**: Quarkus REST (JAX-RS)
- **DI Container**: Quarkus Arc (CDI-based)
- **Testing**: JUnit 5, REST Assured
- **Package**: `com.janus`

**Backend Dependencies:**
- `io.quarkus:quarkus-arc` - Dependency injection
- `io.quarkus:quarkus-rest` - REST endpoints
- `io.quarkus:quarkus-junit5` - Testing support
- `io.rest-assured:rest-assured` - API testing

**janus-frontend (Frontend Project)** *(planned)*
- **Framework**: Angular 20
- **Language**: TypeScript 5.5+
- **Styling**: Bootstrap 5
- **Build Tool**: Angular CLI
- **State Management**: Signals (Angular 20)
- **Testing**: Jasmine, Karma

**Frontend Dependencies:**
- `@angular/core` - Angular framework
- `@angular/common` - Common Angular utilities
- `@angular/router` - Routing
- `bootstrap` - UI framework
- `@ng-bootstrap/ng-bootstrap` - Bootstrap components for Angular
- `rxjs` - Reactive programming

### Project Structure

```
Janus/
├── janus-backend/              # Backend project (Quarkus REST API)
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/janus/
│   │   │   │   └── GreetingResource.java
│   │   │   ├── resources/
│   │   │   │   └── application.properties
│   │   │   └── docker/         # Dockerfile variants
│   │   ├── test/               # Unit tests
│   │   └── native-test/        # Native integration tests
│   ├── build.gradle
│   ├── gradle.properties
│   └── README.md
├── janus-frontend/             # Frontend project (Angular 20 + Bootstrap) [planned]
│   ├── src/
│   │   ├── app/
│   │   │   ├── core/           # Services, guards, interceptors
│   │   │   ├── shared/         # Shared components
│   │   │   ├── features/       # Feature modules
│   │   │   ├── app.component.ts
│   │   │   ├── app.config.ts
│   │   │   └── app.routes.ts
│   │   ├── assets/             # Static assets
│   │   ├── environments/       # Environment configs
│   │   └── styles.scss         # Global styles
│   ├── angular.json
│   ├── package.json
│   └── tsconfig.json
├── requerimientos/             # Requirements documentation
│   ├── rq.md                   # Requirements
│   └── user-story.md           # User stories
├── .claude/                    # Claude Code configuration
│   └── rules/                  # Project rules
│       ├── skill-routing.md
│       ├── development-guidelines.md
│       ├── project-context.md
│       ├── backend.md
│       ├── frontend.md
│       └── guidelines.md
└── CLAUDE.md                   # Main configuration file
```

---

## Current State

### Implemented Features (Backend)
- Basic Quarkus project scaffold
- Simple REST endpoint (`/hello`)
- Gradle build configuration
- Docker support (JVM, Native, Legacy JAR, Native Micro)
- Testing infrastructure setup

### Next Steps
**Backend:**
- Define complete requirements in `requerimientos/`
- Design domain model and database schema
- Implement business logic and services
- Add database persistence (H2 dev, PostgreSQL prod)
- Build complete REST API endpoints
- Implement authentication/authorization
- Configure CORS for frontend integration

**Frontend:** *(planned)*
- Scaffold Angular 20 application
- Set up Bootstrap and styling
- Implement routing and navigation
- Create core services for API integration
- Build feature modules and components
- Implement authentication UI
- Connect to backend REST API

---

## Development Environment

### Prerequisites

**Backend:**
- **Java**: JDK 21 (minimum)
- **Gradle**: Included via Gradle Wrapper
- **Docker**: For containerized builds/deployments
- **GraalVM**: Optional, for native executable builds

**Frontend:** *(when implemented)*
- **Node.js**: v18+ (LTS recommended)
- **npm**: v9+ (included with Node.js)
- **Angular CLI**: `npm install -g @angular/cli`

### Local Development Workflow

**Backend (janus-backend):**

1. **Start dev mode** (with live reload):
   ```bash
   cd janus-backend
   ./gradlew quarkusDev
   ```
   - Server: http://localhost:8080
   - Dev UI: http://localhost:8080/q/dev/

2. **Access Quarkus Dev UI**:
   - URL: http://localhost:8080/q/dev/
   - Features: Live coding, config editor, extension management, OpenAPI docs

3. **Run tests**:
   ```bash
   cd janus-backend
   ./gradlew test
   ```

4. **Build for production**:
   ```bash
   cd janus-backend
   ./gradlew build
   ```

**Frontend (janus-frontend):** *(when implemented)*

1. **Install dependencies**:
   ```bash
   cd janus-frontend
   npm install
   ```

2. **Start dev server** (with live reload):
   ```bash
   ng serve
   ```
   - Application: http://localhost:4200
   - Auto-reloads on file changes

3. **Run tests**:
   ```bash
   ng test
   ng test --code-coverage
   ```

4. **Build for production**:
   ```bash
   ng build --configuration production
   ```
   - Output: `dist/janus-frontend/`

5. **Lint code**:
   ```bash
   ng lint
   ng lint --fix
   ```

### Important Files

- **build.gradle** - Dependencies, plugins, build configuration
- **gradle.properties** - Quarkus platform version, group/artifact IDs
- **application.properties** - Quarkus configuration (database, server, logging, etc.)

---

## Quarkus-Specific Patterns

### Hot Reload / Live Coding
- Changes to Java files are automatically recompiled in dev mode
- No server restart needed during development
- Extremely fast feedback loop

### Dependency Injection
```java
// Constructor injection (preferred)
@ApplicationScoped
public class UserService {
    private final UserRepository repository;

    @Inject
    public UserService(UserRepository repository) {
        this.repository = repository;
    }
}
```

### REST Resources
```java
@Path("/api/users")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class UserResource {

    @Inject
    UserService userService;

    @GET
    public List<User> list() {
        return userService.findAll();
    }
}
```

### Configuration
```properties
# application.properties
quarkus.http.port=8080
quarkus.datasource.db-kind=postgresql
quarkus.hibernate-orm.database.generation=update
```

---

## Build Variants

Quarkus supports multiple deployment modes:

### 1. JVM Mode (Standard)
- Fast build, moderate startup
- Full JVM features available
- Dockerfile: `Dockerfile.jvm`

### 2. Native Executable
- Slow build (~5-10 min), extremely fast startup
- Lower memory footprint
- Requires GraalVM or container build
- Dockerfile: `Dockerfile.native`, `Dockerfile.native-micro`

### 3. Legacy JAR
- Traditional über-JAR packaging
- Dockerfile: `Dockerfile.legacy-jar`

**Recommendation:** Use JVM mode for development, native for production (if startup time matters).

---

## Project-Specific Guidelines

### Package Structure Convention
```
com.janus
├── model/          # Domain entities (JPA entities if using DB)
├── service/        # Business logic layer
├── repository/     # Data access layer
├── resource/       # REST endpoints (JAX-RS resources)
├── dto/            # Data Transfer Objects
├── exception/      # Custom exception classes
├── config/         # Configuration classes
└── util/           # Utility/helper classes
```

### Error Handling Pattern
- Create custom exceptions extending `RuntimeException`
- Use JAX-RS `ExceptionMapper` for global error handling
- Return consistent error response format

### Testing Strategy
- **Unit tests**: Test business logic in isolation (mock dependencies)
- **Integration tests**: Test REST endpoints with `@QuarkusTest`
- **Native tests**: Verify native executable compatibility

---

## Common Quarkus Commands

```bash
# Development
./gradlew quarkusDev                    # Dev mode with live reload
./gradlew quarkusDev -Ddebug=5005      # Dev mode with remote debugging

# Building
./gradlew build                         # Standard JVM build
./gradlew build -x test                 # Build without tests
./gradlew build -Dquarkus.package.jar.type=uber-jar  # Über-JAR

# Native builds
./gradlew build -Dquarkus.native.enabled=true
./gradlew build -Dquarkus.native.enabled=true -Dquarkus.native.container-build=true

# Testing
./gradlew test                          # Unit tests
./gradlew testNative                    # Native integration tests
./gradlew test --tests ClassName        # Run specific test
```

---

## Troubleshooting

### Build Issues
- **Clean build**: `./gradlew clean build`
- **Refresh dependencies**: `./gradlew --refresh-dependencies`
- **Check Gradle daemon**: `./gradlew --stop`

### Dev Mode Issues
- Port 8080 already in use: Change `quarkus.http.port` in `application.properties`
- Hot reload not working: Check file system watcher, restart dev mode

### Native Build Issues
- Ensure GraalVM installed or use `-Dquarkus.native.container-build=true`
- Increase Docker memory if container build fails

---

## Resources

- **Quarkus Guides**: https://quarkus.io/guides/
- **Quarkus Dev UI**: http://localhost:8080/q/dev/ (dev mode only)
- **Project Requirements**: See `requerimientos/` directory

---

**Key Insight:** Quarkus prioritizes developer productivity (live reload, fast startup) while maintaining production readiness (native compilation, cloud-native features). Leverage these strengths in Janus development.
