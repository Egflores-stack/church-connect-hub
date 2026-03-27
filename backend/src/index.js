const http = require("http");

const PORT = process.env.PORT || 4000;

const server = http.createServer((req, res) => {
  if (req.url === "/health" && req.method === "GET") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", service: "church-connect-hub-backend" }));
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not Found" }));
});

app.listen(4000, '0.0.0.0', () => {
  console.log('Backend corriendo');
});
app.get('/', (req, res) => {
  res.send('Servidor funcionando 🚀');
});
