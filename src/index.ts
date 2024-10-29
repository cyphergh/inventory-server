import { Hono } from "hono";
import newUserRouter from "./user/new";
import { loginRouter } from "./Authentication/login";
import { branchRouter } from "./branch/branches";
import { inventoryRoute } from "./inventory/inventory";
import { getBranches } from "./ws/getBranch";
import { getUsers } from "./ws/getUsers";
import { shopRouter } from "./shop/order";
import { serveStatic } from "hono/bun";

// Initialize Hono app
const app = new Hono();
export type SocketMessage={
  token:string;
  command:string;
  data:any
}
// Define Hono routes
app.use('/*', serveStatic({ root: '/src/public/',  onFound: (path, c) => {
  console.log(`Serving static file: ${path}`);
},
onNotFound: (path, c) => {
  console.warn(`File not found: ${path}`);
}, }));
app.get("/alive", (c) => c.text("OK online"));
app.route("/user", newUserRouter);
app.route("/login", loginRouter);
app.route("/branch/", branchRouter);
app.route("/inventory/", inventoryRoute);
app.route("/shop/", shopRouter);


// Export the Hono app as a handler
export const handler = app.fetch;

// Bun server with WebSocket and Hono route integration
Bun.serve({
  fetch(req, server) {
    if (server.upgrade(req)) {
      return; // Do not return an HTTP response if the WebSocket upgrade is successful
    }
    return handler(req);
  },
  port: 8191,
  websocket: {
    message(ws, message) {
      let data:SocketMessage = JSON.parse(message as string);
      switch(data.command){
        case "getBranch":
          getBranches(data.data,ws,data.token);
          break;
        case "getUsers":
          getUsers(data.data,ws,data.token);
        break;
      }
    },
    open(ws) {
      console.log("WebSocket connection opened");
    },
    close(ws, code, message) {
      console.log(`WebSocket connection closed: code=${code}, message=${message}`);
    },
    drain(ws) {
      console.log("WebSocket connection is ready for more data");
    },
  },
});
