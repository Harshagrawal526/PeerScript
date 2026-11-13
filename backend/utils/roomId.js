import crypto from "node:crypto";

const generateRoomId = () => crypto.randomUUID();

export { generateRoomId };
