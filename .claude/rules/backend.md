---
description: Backend development rules for janus-backend (Quarkus/Java)
globs: janus-backend/**
---

# Backend: janus-backend

## Stack
- Quarkus 3.27.2, Gradle, Java 21 (stable only, no preview)
- Package: `com.janus`
- DB: H2 (dev), PostgreSQL (prod)

## Conventions
- Java 21 stable features only — no preview flags
- Text blocks (`"""..."""`) for multi-line strings
- DTOs are Java records in `dto/` package and mapper into dto
- `@Transactional` on Resource methods accessing lazy collections
- `var` when creating new objects
- Jakarta EE APIs (`jakarta.*`), never Java EE (`javax.*`)
- UTF-8 encoding for all Java files

## REST API
- Jakarta REST annotations (`jakarta.ws.rs.*`)
- `@Path`, `@GET`, `@POST`, `@PUT`, `@DELETE`
- `@Produces(MediaType.APPLICATION_JSON)` for JSON endpoints

## Structure
```
janus-backend/src/main/java/com/janus/
├── config/       # Configuration classes
├── dto/          # Java record DTOs
├── exception/    # Exception handlers
├── mapper/       # Entity ↔ DTO mappers
├── model/        # JPA entities
├── resource/     # REST resources (controllers)
├── scheduler/    # Cron/scheduled tasks
└── service/      # Business logic
```

## Commands
```bash
./gradlew quarkusDev          # Dev mode (live reload) — http://localhost:8080
./gradlew build               # Build → build/quarkus-app/quarkus-run.jar
./gradlew test                # Run tests
```

## Config
- `src/main/resources/application.properties` — Quarkus config
- `src/main/resources/import.sql` — Dev seed data (H2)
- Environment variables override properties at runtime
