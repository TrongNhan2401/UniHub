# UniHub Source Skeleton

This folder contains the implementation skeleton for UniHub Workshop.

## Structure

- `api/`: ASP.NET Core backend (Clean Architecture style modules)
- `web/student/`: React + Vite student portal
- `web/admin/`: React + Vite admin portal
- `mobile/checkin/`: React Native (Expo) check-in app
- `docker/`: docker compose and environment templates
- `seed/`: SQL seed and bootstrap scripts

## Quick start (skeleton)

1. Start infra: `docker compose -f docker/docker-compose.yml --env-file docker/.env.example up -d`
2. Implement backend in `api/src/UniHub.Api`
3. Implement web apps in `web/student` and `web/admin`
4. Implement mobile app in `mobile/checkin`
5. Seed data from `seed/01_init.sql` and `seed/02_seed.sql`
