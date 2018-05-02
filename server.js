require('http').createServer(function (req, res) {
  res.writeHead(200, {
    "Content-Length": 12
  });
  res.end("Hello World\n");
}).listen(3000);
