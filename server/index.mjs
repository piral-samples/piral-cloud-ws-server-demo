import { WebSocketServer } from "ws";
import { randomUUID } from "node:crypto";
import { on, off, broadcast, emit } from "./events.mjs";
import { loadPlugins } from "./plugins.mjs";

const port = 3000;
const wss = new WebSocketServer({ port });
const connections = new Set();

function sendKeepAlive() {
  broadcast({ type: "keep-alive" });
}

function logError(err) {
  console.error(err);
}

wss.on("connection", (ws) => {
  const connectionId = randomUUID();
  const sendMessage = (message) => {
    ws.send(JSON.stringify(message));
  };
  const disposeAll = () => {
    off("broadcast", sendMessage);
    off(`to:${connectionId}`, sendMessage);
    connections.delete(connectionId);
  };
  const processMessage = (buffer) => {
    const msg = JSON.parse(Buffer.from(buffer).toString("utf8"));

    if (!msg || typeof msg !== "object") {
      return;
    }

    if (typeof msg.type === "string") {
      const { data = {}, correlationId = randomUUID() } = msg;
      emit(`command:${msg.type}`, {
        connectionId,
        correlationId,
        data,
      });
    }
  };

  on("broadcast", sendMessage);
  on(`to:${connectionId}`, sendMessage);

  ws.on("error", logError);
  ws.on("message", processMessage);
  ws.on("close", disposeAll);
  connections.add(connectionId);
});

setInterval(sendKeepAlive, 60_000);

await loadPlugins();
