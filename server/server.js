import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    // origin: 'https://z3j47gv0-5173.inc1.devtunnels.ms',
    origin: "*",
    credentials: true,
    methods: ["GET", "POST"],
  },
});

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: "*",
    // origin: 'https://z3j47gv0-5173.inc1.devtunnels.ms',
    credentials: true,
    methods: ["GET", "POST"],
  })
);

const users = {};

// Socket.IO Connection Handler
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Join Room
  socket.on("joinRoom", (userId) => {
    users[userId] = socket.id;
    socket.join(userId);
    console.log(`${userId} joined with socket ID: ${socket.id}`);
  });

  socket.on("offer", ({ offer, to, from }) => {
    console.log(`Offer from ${from} to ${to}`);
    io.to(to).emit("offer", { offer, from });
  });

  socket.on("answer", ({ answer, to }) => {
    console.log(`Answer to ${to}`);
    io.to(to).emit("answer", { answer });
  });

  socket.on("ice-candidate", ({ candidate, to }) => {
    console.log(`ICE candidate to ${to}`);
    io.to(to).emit("ice-candidate", { candidate });
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
    for (const user in users) {
      if (users[user] === socket.id) {
        delete users[user];
        console.log(`${user} disconnected`);
        break;
      }
    }
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => console.log(`Server running on port ${PORT}`));
