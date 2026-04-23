# Seed Data

This folder contains SQL scripts for bootstrapping local development data.

## Files

- `01_init.sql`: create core tables
- `02_seed.sql`: insert sample users/workshops/registrations

## Apply example

Use psql inside docker postgres container:

```bash
docker exec -i unihub-postgres psql -U unihub -d unihub_workshop < src/seed/01_init.sql
docker exec -i unihub-postgres psql -U unihub -d unihub_workshop < src/seed/02_seed.sql
```
