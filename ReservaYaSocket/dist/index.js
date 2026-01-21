"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const socket_io_1 = require("socket.io");
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
const httpServer = (0, http_1.createServer)(app);
const io = new socket_io_1.Server(httpServer, {
    cors: {
        origin: ["http://localhost:3000", "http://localhost:3001", "http://192.168.0.107:3000", "http://192.168.0.107:3001", process.env.FRONTEND_URL || ""],
        methods: ["GET", "POST"],
        credentials: true
    }
});
app.use((0, cors_1.default)({ origin: true, credentials: true }));
app.use(express_1.default.json());
const PORT = 3002;
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
