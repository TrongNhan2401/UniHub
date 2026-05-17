# Seed Data

This folder contains SQL scripts for bootstrapping local development data.

## Files

- `01_init.sql`: create full schema based on current Domain + Identity model
- `02_seed.sql`: insert sample roles/users/workshops/registrations/payments/attendances/synctasks

## Apply example

Use psql inside docker postgres container:

```bash
docker exec -i unihub-postgres psql -U unihub -d unihub_workshop < src/seed/01_init.sql
docker exec -i unihub-postgres psql -U unihub -d unihub_workshop < src/seed/02_seed.sql
```

Notes:

- Scripts are written idempotently (`IF NOT EXISTS` / conflict-safe inserts) so they can be re-run.
- Table names use quoted PascalCase (for example `"Users"`, `"Workshops"`) to match EF Core mapping exactly.
