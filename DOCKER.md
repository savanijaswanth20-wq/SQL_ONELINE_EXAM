# 🐳 Docker Environment Guide

This project includes a complete Dockerized full-stack environment containing:
1. **Web App (`web`)**: TanStack Start / React 19 application running with Bun and hot-reloading.
2. **PostgreSQL Database (`postgres`)**: PostgreSQL 16 database pre-configured with UUID/pgcrypto extensions, Supabase auth compatibility mocks, and pre-seeded tables.
3. **Adminer Web UI (`adminer`)**: Lightweight, browser-based database management interface for browsing tables, executing queries, and inspecting data.

---

## 🚀 Quick Start

Ensure Docker Desktop is running, then run from the project root:

```bash
# Start all services in background
docker compose up -d

# View live logs
docker compose logs -f

# Stop all services
docker compose down
```

To start only the database and Adminer (if developing the frontend on your host machine):

```bash
docker compose up -d postgres adminer
```

---

## 🌐 Services & Ports

| Service | Port | Description | URL / Connection |
| :--- | :--- | :--- | :--- |
| **Web App** | `3000` | Full-stack TanStack Start application | [http://localhost:3000](http://localhost:3000) |
| **Adminer UI** | `8080` | Web database management interface | [http://localhost:8080](http://localhost:8080) |
| **PostgreSQL** | `5432` | PostgreSQL database instance | `postgresql://postgres:postgres@localhost:5432/postgres` |

---

## 🔑 Database Credentials

- **System**: PostgreSQL
- **Server**: `postgres` (inside docker network) or `localhost` (from your host machine)
- **Port**: `5432`
- **Username**: `postgres`
- **Password**: `Password123!`
- **Database**: `postgres`

### Connecting to Adminer (`http://localhost:8080`)
1. Open [http://localhost:8080](http://localhost:8080)
2. Select **System**: `PostgreSQL`
3. Enter **Server**: `postgres`
4. Enter **Username**: `postgres`
5. Enter **Password**: `postgres`
6. Enter **Database**: `postgres`
7. Click **Login**

---

## 🛠️ Prisma & Local Migrations

When running against the local Docker PostgreSQL database, use:

```bash
DATABASE_URL="postgresql://postgres:Password123!@localhost:5432/postgres"
DIRECT_URL="postgresql://postgres:Password123!@localhost:5432/postgres"
```

To run Prisma migrations against local Docker:
```bash
cd app
npx prisma db push
```

---

## 📁 Project Structure

- `Dockerfile`: Multi-stage build (supports both hot-reload `development` and optimized `production` runner).
- `docker-compose.yml`: Multi-container composition for `web`, `postgres`, and `adminer`.
- `docker/init-db/01-init.sql`: Automatic database schema initialization on first startup.
- `.dockerignore`: Prevents copying build artifacts and local `node_modules` into container layers.
