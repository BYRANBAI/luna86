const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const path = require("path");

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = parseInt(process.env.PORT || "3000", 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("Internal server error");
    }
  });

  // Инициализация Socket.io - будет работать после первого импорта в API route
  // Пока комментируем, чтобы не блокировать старт
  // try {
  //   const socketPath = path.join(__dirname, 'lib', 'socket.ts');
  //   const { initSocketServer } = require(socketPath);
  //   initSocketServer(server);
  //   console.log('> WebSocket server initialized');
  // } catch (err) {
  //   console.warn('> WebSocket initialization skipped:', err.message);
  // }

  server.once("error", (err) => {
    console.error(err);
    process.exit(1);
  });

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
    console.log(`> WebSocket will initialize on first API call`);
  });
});
