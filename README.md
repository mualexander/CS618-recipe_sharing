# CS618-recipe_sharing

Course project: a MERN (MongoDB, Express, React, Node.js) real-time recipe sharing app.
Recipe changes are pushed to all connected clients over Socket.IO.

## Structure

```
backend/    Express 5 + Mongoose REST API and Socket.IO server
frontend/   React 19 + Vite client (TanStack Query, socket.io-client)
docker-compose.yml   mongo + backend + frontend (nginx)
```

## Local development

Requires Node.js 22+ and a MongoDB instance (local, Docker, or Atlas).

```bash
# start just MongoDB in Docker (optional, if not using Atlas)
docker compose up -d mongo

# backend on http://localhost:3001
cd backend
cp .env.example .env   # set DATABASE_URL
npm install
npm run dev

# frontend on http://localhost:5173 (proxies /api and /socket.io to the backend)
cd frontend
npm install
npm run dev
```

## Docker

```bash
cp .env.example .env   # optional: DOCKERHUB_USER, DATABASE_URL
docker compose up --build
```

App: http://localhost:8080 · API: http://localhost:3001/api/v1/health

To publish images to Docker Hub:

```bash
docker login
docker compose build
docker compose push backend frontend
```

## API

| Method | Path                   | Description        |
| ------ | ---------------------- | ------------------ |
| GET    | `/api/v1/health`       | Health check       |
| GET    | `/api/v1/recipes`      | List (`?tag=`)     |
| GET    | `/api/v1/recipes/:id`  | Get one            |
| POST   | `/api/v1/recipes`      | Create             |
| PATCH  | `/api/v1/recipes/:id`  | Update             |
| DELETE | `/api/v1/recipes/:id`  | Delete             |

Socket.IO events: `recipe:created`, `recipe:updated`, `recipe:deleted`.
