import { serve, type ServerWebSocket } from "bun";
import { testDockerBuild } from "./src/util";
import Redis from "ioredis";

testDockerBuild();

// Redis connection configuration
const redisHost = process.env.REDIS_HOST || "redis";
const redisPort = parseInt(process.env.REDIS_PORT || "6379");

console.log(`Attempting to connect to Redis at ${redisHost}:${redisPort}`);

// Redis connection with error handling
const redis = new Redis({
    host: redisHost,
    port: redisPort,
    retryStrategy: (times) => {
        const delay = Math.min(times * 50, 2000);
        console.log(`Redis connection attempt ${times}, retrying in ${delay}ms...`);
        return delay;
    },
    maxRetriesPerRequest: 3,
    enableReadyCheck: true,
    lazyConnect: false,
    connectTimeout: 10000, // 10 seconds timeout
    reconnectOnError: (err) => {
        console.log('Redis reconnectOnError triggered:', err.message);
        return true;
    },
});

// Handle Redis connection events
redis.on('connect', () => {
    console.log('Redis connected successfully');
});

redis.on('ready', () => {
    console.log('Redis is ready to accept commands');
});

redis.on('error', (err) => {
    console.error('Redis connection error:', err.message);
});

redis.on('close', () => {
    console.log('Redis connection closed');
});

redis.on('reconnecting', () => {
    console.log('Redis reconnecting...');
});

// WebSocket data type
type WebSocketData = { roomId: string };

// Store WebSocket connections per room
const rooms = new Map<string, Set<ServerWebSocket<WebSocketData>>>();

// Generate a random room ID
function generateRoomId(): string {
    return Math.random().toString(36).substring(2, 10);
}

const server = serve<WebSocketData>({
    port: 5555,
    async fetch(req, server) {
        const url = new URL(req.url);
        let path = url.pathname;

        // API endpoint to create a new room
        if (path === "/api/room" && req.method === "POST") {
            try {
                const roomId = generateRoomId();
                await redis.set(`room:${roomId}:content`, "");
                console.log(`Created room: ${roomId}`);
                return Response.json({ roomId });
            } catch (error) {
                console.error('Failed to create room:', error);
                return Response.json({ error: 'Failed to create room' }, { status: 500 });
            }
        }

        // WebSocket endpoint for room synchronization
        if (path.startsWith("/ws/")) {
            const roomId = path.split("/")[2];
            if (!roomId) {
                return new Response("Room ID required", { status: 400 });
            }

            // Upgrade to WebSocket
            const success = server.upgrade(req, {
                data: { roomId },
            });

            if (success) {
                return undefined;
            }

            return new Response("WebSocket upgrade failed", { status: 500 });
        }

        // Serve static files
        if (path === "/") {
            path = "/index.html";
        }

        const filePath = `./public${path}`;
        const file = Bun.file(filePath);

        if (await file.exists()) {
            return new Response(file);
        }

        // SPA fallback - serve index.html for all unmatched routes
        const indexFile = Bun.file("./public/index.html");
        if (await indexFile.exists()) {
            return new Response(indexFile);
        }

        return new Response("Not Found", { status: 404 });
    },
    websocket: {
        open(ws) {
            const { roomId } = ws.data;
            console.log(`Client connected to room: ${roomId}`);

            // Add connection to room
            if (!rooms.has(roomId)) {
                rooms.set(roomId, new Set());
            }
            rooms.get(roomId)!.add(ws);

            // Send current clipboard content to the new client
            redis.get(`room:${roomId}:content`).then((content) => {
                ws.send(JSON.stringify({
                    type: "init",
                    content: content || "",
                }));
            }).catch((error) => {
                console.error(`Failed to get content for room ${roomId}:`, error.message);
                ws.send(JSON.stringify({
                    type: "init",
                    content: "",
                }));
            });
        },
        message(ws, message) {
            const { roomId } = ws.data;
            const data = JSON.parse(message.toString());

            if (data.type === "update") {
                // Store content in Redis
                redis.set(`room:${roomId}:content`, data.content).catch((error) => {
                    console.error(`Failed to store content for room ${roomId}:`, error.message);
                });

                // Broadcast to all clients in the room except sender
                const roomConnections = rooms.get(roomId);
                if (roomConnections) {
                    roomConnections.forEach((client) => {
                        if (client !== ws) {
                            client.send(JSON.stringify({
                                type: "update",
                                content: data.content,
                            }));
                        }
                    });
                }
            }
        },
        close(ws) {
            const { roomId } = ws.data;
            console.log(`Client disconnected from room: ${roomId}`);

            // Remove connection from room
            const roomConnections = rooms.get(roomId);
            if (roomConnections) {
                roomConnections.delete(ws);
                if (roomConnections.size === 0) {
                    rooms.delete(roomId);
                }
            }
        },
    },
});

console.log(`Server running at http://localhost:${server.port}`);