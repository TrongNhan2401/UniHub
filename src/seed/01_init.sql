BEGIN;

CREATE TABLE IF NOT EXISTS users (
  id BIGSERIAL PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  role VARCHAR(50) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workshops (
  id BIGSERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  speaker_name VARCHAR(255),
  room_name VARCHAR(100),
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  capacity INT NOT NULL,
  available_slots INT NOT NULL,
  price DECIMAL(10,2) NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'OPEN',
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS registrations (
  id BIGSERIAL PRIMARY KEY,
  student_id BIGINT NOT NULL REFERENCES users(id),
  workshop_id BIGINT NOT NULL REFERENCES workshops(id),
  status VARCHAR(50) NOT NULL DEFAULT 'REGISTERED',
  payment_status VARCHAR(50) NOT NULL DEFAULT 'COMPLETED',
  qr_code TEXT,
  idempotency_key UUID,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE (student_id, workshop_id),
  UNIQUE (idempotency_key)
);

CREATE TABLE IF NOT EXISTS attendance (
  id BIGSERIAL PRIMARY KEY,
  registration_id BIGINT NOT NULL REFERENCES registrations(id),
  checked_in_at TIMESTAMP NOT NULL DEFAULT NOW(),
  device_id VARCHAR(100),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

COMMIT;
