# GenAgent: Smart AI for Decision Making and Task Automation

A full-stack local demo built with React, Vite, Node.js and Express.

## Features
- Dashboard with task counts and completion rate
- Create, search, update and delete tasks
- Rule-based decision assistant with priority, rationale, next steps and risks
- Activity history
- Persistent local JSON storage in `data/db.json`
- Responsive dark dashboard UI

## Requirements
- Node.js 18 or newer
- npm

## Run locally
1. Extract the ZIP.
2. Open the project root folder in VS Code (the folder containing `package.json`).
3. Open a terminal and run:
   ```bash
   npm install
   ```
4. Start the backend in Terminal 1:
   ```bash
   npm run server
   ```
   Backend: http://localhost:5000
5. Start the frontend in Terminal 2:
   ```bash
   npm run dev
   ```
   Frontend: http://localhost:5173

Keep both terminals running while using the app.

## API endpoints
- `GET /api/health`
- `GET /api/dashboard`
- `GET /api/tasks`
- `POST /api/tasks`
- `PATCH /api/tasks/:id`
- `DELETE /api/tasks/:id`
- `POST /api/decisions`
- `GET /api/logs`

## Notes and limitations
- The decision assistant uses a local, transparent keyword/rule-based engine. It does not call a hosted LLM and does not require an API key or internet connection for its core decision logic.
- The app is a local development demo. It does not include authentication, multi-user access control, cloud deployment, third-party integrations, or guaranteed production-grade database concurrency.
- Review AI-style recommendations before making important decisions.
