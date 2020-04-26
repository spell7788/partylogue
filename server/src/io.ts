import http from "http";
import socketIO from "socket.io";

export const server = http.createServer();
export const io = socketIO(server);
export default io;
