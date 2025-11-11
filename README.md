# Clipboard Share

A real-time clipboard sharing application built with Bun, React, and Redis.

## Features

- 🚀 Real-time clipboard synchronization via WebSocket
- 🎨 Modern UI with Tailwind CSS v4 and shadcn/ui
- 🌙 Dark mode support (system-based)
- 🔒 Room-based isolation
- 📦 Single Docker image deployment
- ⚡ Fast and lightweight with Bun runtime

## Tech Stack

- **Backend**: Bun.js with WebSocket support
- **Frontend**: React + Vite + TypeScript
- **Styling**: Tailwind CSS v4 + shadcn/ui components
- **Storage**: Redis for room state persistence
- **Deployment**: Docker + Docker Compose

## Development

### Prerequisites

- [Bun](https://bun.sh) >= 1.0
- Docker and Docker Compose (for production builds)

### Install Dependencies

```bash
# Install client dependencies
cd client
bun install

# Install server dependencies
cd ../server
bun install
```

### Run in Development Mode

```bash
# Start client (from client directory)
cd client
bun run dev

# Start server (from server directory)
cd server
bun run index.ts
```

### Add shadcn/ui Components

```bash
cd client
bunx --bun shadcn@latest add <component-name>
```

## Production Deployment

### Docker Compose (Local)

```bash
# Build and run
docker compose up --build

# Run in detached mode
docker compose up -d
```

The application will be available at `http://localhost:5555`

### Dokploy / Cloud Deployment

#### Environment Variables

Set the following environment variables in your deployment platform:

- `REDIS_HOST` - Redis server hostname (default: "redis")
- `REDIS_PORT` - Redis server port (default: "6379")

#### Dokploy Setup

1. **Create a new service** in Dokploy
2. **Connect your repository** (GitHub/GitLab)
3. **Add Redis service**:
   - Create a new Redis service in Dokploy
   - Note the Redis service name (e.g., `redis`)
4. **Configure environment variables**:
   - `REDIS_HOST`: Use the Redis service name from Dokploy (e.g., `redis` or the internal service URL)
   - `REDIS_PORT`: Usually `6379`
5. **Deploy** the application

#### Important Notes

- The application listens on port `5555` internally
- Configure your reverse proxy (Traefik) to route traffic to port `5555`
- Ensure Redis is accessible from the application container
- For Dokploy internal networking, use the Redis service name as the host

#### Finding the Correct Redis Host

If you're having trouble connecting to Redis in Dokploy, use the test script:

```bash
# SSH into your Dokploy container or run in Dokploy console
cd /usr/src/app
bun run redis-test.ts
```

This will test common Redis hostnames and tell you the correct `REDIS_HOST` value to use.

### Docker Build Only

```bash
# Build the Docker image
docker build -t clipboard-app .

# Run with custom Redis configuration
docker run -p 5555:5555 \
  -e REDIS_HOST=your-redis-host \
  -e REDIS_PORT=6379 \
  clipboard-app
```

## Architecture

### Routes

- `GET /` - Serves the SPA frontend
- `GET /room/:id` - Serves the SPA frontend for a specific room
- `POST /api/room` - Creates a new room
- `WS /ws/:id` - WebSocket endpoint for real-time synchronization

### How It Works

1. User creates a room via the home page
2. A unique room ID is generated and stored in Redis
3. Users connect to the room via WebSocket
4. Clipboard updates are debounced (500ms) and sent via WebSocket
5. All connected clients in the same room receive updates in real-time
6. Room content persists in Redis

## Troubleshooting

### Redis Connection Issues

If you see `[ioredis] Unhandled error event` errors:

1. **Check Redis is running**:
   ```bash
   # For Docker Compose
   docker compose ps
   
   # Check logs
   docker compose logs redis
   ```

2. **Verify environment variables**:
   - `REDIS_HOST` should match your Redis service name
   - For Dokploy, check the internal service name/URL
   - For Docker Compose, use `redis` (service name)

3. **Check network connectivity**:
   - Ensure the app container can reach Redis
   - Verify firewall rules if using external Redis

4. **Review application logs**:
   ```bash
   docker compose logs app
   ```

### WebSocket Connection Issues

If WebSocket connections fail:

1. Ensure your reverse proxy supports WebSocket upgrades
2. For Traefik, no special configuration is needed
3. Check browser console for connection errors

## License

MIT
