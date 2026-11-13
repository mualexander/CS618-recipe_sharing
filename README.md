# CS618-recipe_sharing

Course project: a MERN (MongoDB, Express, React, Node.js) real-time social recipe sharing app.

**Current features**

- Sign up and log in (bcrypt-hashed passwords, JWT sessions)
- Create, view, edit, and delete your own recipes: title, description, ingredient list
  (quantity + name, reorderable), instructions, image URL with live preview, and tags
- Ownership enforced on the server: only a recipe's author can edit or delete it
- Recipe feed with search (title, ingredient, tag), tag filter, sorting, and pagination
- User pages listing each author's recipes
- Live feed updates over Socket.IO when anyone creates, edits, or deletes a recipe

## Structure

```
backend/    Express 5 + Mongoose REST API and Socket.IO server
  src/models     Mongoose schemas
  src/services   business logic (ownership checks live here)
  src/routes     thin Express routers
  tests/         node:test + supertest against an in-memory MongoDB
frontend/   React 19 + Vite client (React Router, TanStack Query, socket.io-client)
docker-compose.yml   mongo + backend + frontend (nginx)
```

## Local development

Requires Node.js 22+ and a MongoDB instance (local, Docker, or Atlas).

```bash
# start just MongoDB in Docker (optional, if not using Atlas)
docker compose up -d mongo

# backend on http://localhost:3001
cd backend
cp .env.example .env   # set DATABASE_URL and JWT_SECRET
npm install
npm run dev
npm test               # backend tests (downloads a MongoDB binary on first run)

# frontend on http://localhost:5173 (proxies /api and /socket.io to the backend)
cd frontend
npm install
npm run dev
```

## Docker

```bash
cp .env.example .env   # set JWT_SECRET; optional: DOCKERHUB_USER, DATABASE_URL
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

All routes are under `/api/v1`. Errors are returned as `{ error, fields? }`, where
`fields` maps form fields to messages for validation errors.
🔒 = requires `Authorization: Bearer <token>`.

| Method | Path               | Description                                                   |
| ------ | ------------------ | ------------------------------------------------------------- |
| GET    | `/health`          | Health check                                                  |
| POST   | `/auth/signup`     | Create an account → `{ user, token }`                         |
| POST   | `/auth/login`      | Log in → `{ user, token }`                                    |
| GET    | `/auth/me`         | 🔒 Current user                                               |
| GET    | `/users?q=`        | Search users                                                  |
| GET    | `/users/:id`       | Public profile                                                |
| PATCH  | `/users/me`        | 🔒 Update display name, bio, avatar URL                       |
| GET    | `/recipes`         | List: `q`, `tag`, `author`, `sort` (newest, oldest, title), `page`, `limit` |
| GET    | `/recipes/:id`     | Get one                                                       |
| POST   | `/recipes`         | 🔒 Create                                                     |
| PATCH  | `/recipes/:id`     | 🔒 Update (author only)                                       |
| DELETE | `/recipes/:id`     | 🔒 Delete (author only)                                       |

Socket.IO events (server → client): `recipe:created`, `recipe:updated`, `recipe:deleted`.
Clients may pass `auth: { token }` when connecting to join their private room.
