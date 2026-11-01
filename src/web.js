import { createServer } from 'node:http';

// Vercel's public container entry point must never connect to Discord.
// Only the ledger daemon starts src/bot.js.
const server = createServer((_request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
  response.end('The Wickhaven Ledger web endpoint. Discord runs separately in the ledger daemon.\n');
});
server.listen(Number(process.env.PORT || 8080), '0.0.0.0');
for (const signal of ['SIGINT', 'SIGTERM']) process.once(signal, () => server.close(() => process.exit(0)));
