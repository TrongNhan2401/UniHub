# UniHub API Skeleton

## Suggested stack

- ASP.NET Core 8 Web API
- EF Core 8 + PostgreSQL
- Redis for cache/rate-limit/idempotency
- Hangfire for background jobs
- Polly for resilience

## Structure

- `src/UniHub.Api`: HTTP API entrypoint
- `src/UniHub.Application`: use-cases, commands/queries
- `src/UniHub.Domain`: entities and domain rules
- `src/UniHub.Infrastructure`: data access and integrations
- `tests/UniHub.Api.Tests`: API and integration tests
