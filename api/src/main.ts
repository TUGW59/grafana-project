import { type BloomAtlasSnapshot } from '../../packages/contracts/mod.ts';
import { createApp } from './app.ts';

// Demo-only startup. The verified production snapshot is a separate future milestone.
const fixture = new URL('../../data/fixtures/demo.snapshot.json', import.meta.url);
const snapshot = JSON.parse(await Deno.readTextFile(fixture)) as BloomAtlasSnapshot;
const rawPort = Deno.env.get('BLOOMATLAS_PORT') ?? '8000';
const port = Number(rawPort);
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error('BLOOMATLAS_PORT must be between 1 and 65535');
}
const hostname = Deno.env.get('BLOOMATLAS_HOST') ?? '127.0.0.1';
if (hostname !== '127.0.0.1' && hostname !== '0.0.0.0') {
  throw new Error('BLOOMATLAS_HOST must be 127.0.0.1 or 0.0.0.0');
}
const handler = createApp(snapshot);
console.log(`BloomAtlas API demo snapshot: http://${hostname}:${port}`);
Deno.serve({ hostname, port }, handler);
