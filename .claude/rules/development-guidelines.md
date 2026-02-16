# Development Guidelines - Janus Project

## Code Quality Standards

### General Principles
- Write clean, maintainable, and self-documenting code
- Follow SOLID principles
- Prefer composition over inheritance
- Keep methods focused and small (single responsibility)
- Avoid premature optimization

### Java/Quarkus Specific

#### Naming Conventions
- **Classes**: PascalCase (e.g., `UserService`, `OrderController`)
- **Methods**: camelCase (e.g., `getUserById`, `processPayment`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_RETRY_ATTEMPTS`)
- **Packages**: lowercase, singular nouns (e.g., `com.janus.service`)

#### Code Organization
```
src/main/java/com/janus/
├── model/          # Domain entities
├── service/        # Business logic
├── repository/     # Data access
├── resource/       # REST endpoints (JAX-RS)
├── dto/            # Data Transfer Objects
├── exception/      # Custom exceptions
└── util/           # Utility classes
```

#### REST API Guidelines
- Use JAX-RS annotations (`@Path`, `@GET`, `@POST`, etc.)
- Return appropriate HTTP status codes
- Use DTOs for request/response objects (don't expose entities)
- Implement proper error handling with custom exceptions
- Document endpoints with OpenAPI annotations

#### Dependency Injection
- Use `@Inject` for constructor injection (preferred)
- Avoid field injection when possible
- Use `@ApplicationScoped` for stateless services
- Use `@RequestScoped` for request-specific beans

#### Error Handling
- Create custom exception classes in `exception/` package
- Use `@ExceptionHandler` for global exception handling
- Log errors appropriately (use SLF4J)
- Return meaningful error messages to clients

#### Testing
- Write unit tests for all service layer logic
- Use JUnit 5 and Mockito
- Follow AAA pattern (Arrange, Act, Assert)
- Test file location: `src/test/java/com/janus/`
- Integration tests: `src/native-test/java/com/janus/`

---

## Git Workflow

### Branch Naming
- Feature: `feature/brief-description`
- Bugfix: `bugfix/issue-description`
- Hotfix: `hotfix/critical-fix`

### Commit Messages
- Use conventional commits format
- Examples:
  - `feat: add user authentication endpoint`
  - `fix: resolve null pointer in OrderService`
  - `refactor: simplify payment processing logic`
  - `test: add unit tests for UserRepository`
  - `docs: update API documentation`

### Pull Request Guidelines
- Keep PRs focused and small
- Write clear PR descriptions
- Reference related issues
- Ensure all tests pass
- Request code review before merging

---

## Build & Run Commands

### Development
```bash
# Run in dev mode (hot reload)
./gradlew quarkusDev

# Run tests
./gradlew test

# Build
./gradlew build
```

### Docker
```bash
# Build JVM container
docker build -f src/main/docker/Dockerfile.jvm -t janus-backend:jvm .

# Run container
docker run -p 8080:8080 janus-backend:jvm
```

### Native Build
```bash
# Native executable (requires GraalVM)
./gradlew build -Dquarkus.native.enabled=true

# Native container build
./gradlew build -Dquarkus.native.enabled=true -Dquarkus.native.container-build=true
```

---

## Configuration Management

### Application Properties
- Main config: `src/main/resources/application.properties`
- Use profiles for different environments:
  - `application-dev.properties`
  - `application-test.properties`
  - `application-prod.properties`

### Environment Variables
- Sensitive data (API keys, passwords) via env vars
- Never commit secrets to version control
- Use `.env` file locally (gitignored)

---

## Code Review Checklist

Before submitting code for review:
- [ ] Code follows naming conventions
- [ ] No commented-out code
- [ ] No debugging statements (`System.out.println`)
- [ ] Proper error handling implemented
- [ ] Unit tests written and passing
- [ ] No breaking changes without migration plan
- [ ] Documentation updated (if applicable)
- [ ] Build passes without warnings

---

## Security Best Practices

- Validate all user inputs
- Use parameterized queries (prevent SQL injection)
- Implement proper authentication/authorization
- Don't log sensitive information
- Use HTTPS in production
- Keep dependencies up to date
- Follow OWASP Top 10 guidelines

---

## Performance Considerations

- Use reactive programming when appropriate
- Implement caching for frequently accessed data
- Optimize database queries (avoid N+1 problems)
- Use connection pooling
- Monitor application metrics with Quarkus Dev UI

---

## Logging Standards

### Log Levels
- **ERROR**: Application errors requiring immediate attention
- **WARN**: Potentially harmful situations
- **INFO**: Important business process flows
- **DEBUG**: Detailed diagnostic information
- **TRACE**: Very detailed diagnostic information

### Logging Best Practices
```java
// Use SLF4J
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

private static final Logger LOG = LoggerFactory.getLogger(ClassName.class);

// Good logging
LOG.info("User {} logged in successfully", userId);
LOG.error("Failed to process order {}", orderId, exception);

// Avoid
System.out.println("Debug info");  // Don't use
LOG.debug("User: " + user);        // Don't concatenate
```

---

## Documentation Requirements

### Code Documentation
- Document complex business logic
- Use JavaDoc for public APIs
- Explain "why" not "what" in comments
- Keep comments up to date

### API Documentation
- Use OpenAPI/Swagger annotations
- Document all endpoints, parameters, responses
- Provide example requests/responses
- Keep API docs in sync with implementation

---

**Remember:** These guidelines evolve. Suggest improvements when you identify better patterns.
