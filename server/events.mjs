import { EventEmitter } from "node:events";

const events = new EventEmitter();

export function broadcast(message) {
  events.emit("broadcast", message);
}

export function emit(name, payload) {
  events.emit(name, payload);
}

export function sendTo(connectionId, message) {
  events.emit(`to:${connectionId}`, message);
}

export function on(name, handler) {
  events.addListener(name, handler);
}

export function off(name, handler) {
  events.removeListener(name, handler);
}
