import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
    cors: {
        origin: [
            "http://localhost:3000",
            "http://localhost:3001",
            process.env.FRONTEND_URL || "*" // Permitir flexible en producción o definir URL exacta
        ],
        methods: ["GET", "POST"],
        credentials: true
    }
});

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

const PORT = process.env.PORT || 3002;

// Health check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', connections: io.engine.clientsCount });
});

// API Config
const API_SECRET = process.env.SOCKET_SECRET || 'internal-secret';

// Emit endpoint for Backend to push events
app.post('/emit', (req, res) => {
    const { room, event, data } = req.body;

    if (!room || !event) {
        return res.status(400).json({ error: 'Missing room or event' });
    }

    console.log(`[EMIT] ${event} to ${room}`);
    io.to(room).emit(event, data);

    res.json({ success: true });
});

io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    socket.on('join_room', (room) => {
        console.log(`Socket ${socket.id} joined ${room}`);
        socket.join(room);
    });

    socket.on('leave_room', (room) => {
        socket.leave(room);
    });

    // Handle client-to-client events if necessary (e.g. waiter to kitchen direct?)
    // Usually we route through backend, but for speed:
    socket.on('join_table', ({ tableId }) => {
        socket.join(`table_${tableId}`);
    });

    socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
    });
});

httpServer.listen(PORT, () => {
    console.log(`Socket service running on port ${PORT}`);
});
