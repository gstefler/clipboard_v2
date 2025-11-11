# Clipboard App
This is a clipboard app with an SPA frontend and a bun.js backend. It only handles text content and allows users to create rooms for sharing clipboard data in real-time.
Routes:
- `GET /`: Serves the SPA frontend.
- `GET /room/:id`: Serves the SPA frontend for a specific room.
- `POST /api/room`: Endpoint to create a new room.
- `WS /ws/:id`: WebSocket endpoint for real-time clipboard synchronization in a specific room.

## Frontend
The frontend is built using React and Vite. It provides a user interface for users to create and join rooms, and to share clipboard content in real-time. Create a modern and user-friendly UI with tailwindcss v4 and shadcn/ui components.

## Backend
The backend is built using bun.js. It handles room creation and WebSocket connections for real-time clipboard synchronization. Each room maintains its own state for clipboard content, and updates are broadcasted to all connected clients in that room.
Bun also serves the static files for the SPA frontend.

## Requirements
- single codebase for both frontend and backend
- dockerfile for easy deployment
- redis for storing room data and clipboard content
- typescript for type safety
- tailwindcss v4 and shadcn/ui for frontend styling and components
- dark mode based on system

## Development
- use bunx --bun shadcn@latest add to add shadcn/ui components
- docker is set up for easy deployment


