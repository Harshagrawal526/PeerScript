import http from "node:http";
import "dotenv/config";
import app from "./app.js";
import initSocket from "./socket/index.js";
import connectDB from "./db/index.js";

const server = http.createServer(app);
initSocket(server);

const PORT = process.env.PORT || 3001;

await connectDB();

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
