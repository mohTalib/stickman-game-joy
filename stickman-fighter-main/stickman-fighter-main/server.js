// server.js
const http = require("http");
const path = require("path");
const express = require("express");
const socketIO = require("socket.io");
const os = require("os");

// ====== CONFIG ======
const PORT = process.env.PORT || 5000;
const FRAME_TIME = Math.floor(1000 / 60);
const REDIS_URL = process.env.REDIS_URL || ""; // e.g. redis://127.0.0.1:6379

// ====== UTILS ======
function getLocalIPs() {
  const interfaces = os.networkInterfaces();
  const addresses = [];
  for (const iface of Object.values(interfaces)) {
    for (const addr of iface) {
      if (addr.family === "IPv4" && !addr.internal) {
        addresses.push(addr.address);
      }
    }
  }
  return addresses;
}

// ====== GAME CLASSES ======
const { Game } = require("./server/ServerClasses");

// ====== APP/HTTP/IO ======
const app = express();
const server = http.Server(app);

const io = socketIO(server, {
  pingInterval: 2000,
  pingTimeout: 5000,
  transports: ["websocket", "polling"],
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
    credentials: true,
  },
  allowEIO3: true,
  maxHttpBufferSize: 1e8,
  connectTimeout: 45000,
  serveClient: true,
});

// ====== (NEW) REDIS ADAPTER FOR MULTI-SERVER ======
(async () => {
  if (!REDIS_URL) {
    console.warn(
      "[cluster] No REDIS_URL provided; running single-server only. " +
      "Set REDIS_URL=redis://<host>:6379 to enable multi-server."
    );
    return;
  }

  try {
    const { createAdapter } = require("@socket.io/redis-adapter");
    const { createClient } = require("redis");

    const pubClient = createClient({ url: REDIS_URL });
    const subClient = pubClient.duplicate();

    await pubClient.connect();
    await subClient.connect();

    io.adapter(createAdapter(pubClient, subClient));
    console.log("[cluster] Redis adapter connected:", REDIS_URL);

    // Helpful shutdown handling
    const cleanup = async () => {
      console.log("\n[cluster] Shutting down, closing Redis clients…");
      try { await pubClient.quit(); } catch {}
      try { await subClient.quit(); } catch {}
      process.exit(0);
    };
    process.on("SIGINT", cleanup);
    process.on("SIGTERM", cleanup);
  } catch (err) {
    console.error("[cluster] Failed to enable Redis adapter:", err);
    console.warn("[cluster] Continuing without multi-server sync.");
  }
})();

// ====== EXPRESS MIDDLEWARE/STATIC ======
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.set("port", PORT);
app.use("/Assets/img", express.static(path.join(__dirname, "Assets/img")));
app.use("/Assets/sounds", express.static(path.join(__dirname, "Assets/sounds")));
app.use("/client/public", express.static(path.join(__dirname, "client/public")));
app.use("/build", express.static(path.join(__dirname, "build")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "/client/public/index.html"));
});

app.get("/health", (_req, res) => res.status(200).send("OK"));

// ====== GAME LOOP ======
const game = new Game(io);

setInterval(() => {
  if (game) {
    game.update();
    game.sendState();
  }
}, FRAME_TIME);

// ====== START SERVER ======
server.listen(PORT, "0.0.0.0", () => {
  const ips = getLocalIPs();
  console.log("\nServer is running!");
  console.log("\nPlayers can connect using any of these addresses:");
  console.log("➜ Local machine: http://localhost:" + PORT);
  ips.forEach((ip) => {
    console.log(`➜ Local network: http://${ip}:${PORT}`);
  });
  console.log(
    REDIS_URL
      ? `\n[cluster] Multi-server sync ENABLED via ${REDIS_URL}`
      : "\n[cluster] Multi-server sync DISABLED (no REDIS_URL)"
  );
});
