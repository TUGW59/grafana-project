import type { Observation } from '../../packages/contracts/mod.ts';

// Yalnız yerel Grafana önizlemesinin, seçilmiş snapshot kimliklerini oynatmasına izin ver.
export function replaySelection(url: URL, observations: Observation[]): { ids: string[]; offset: number } | null {
  const ids = url.searchParams.getAll('id');
  const raw = url.searchParams.get('offset') ?? '0';
  if (!ids.length || ids.length > 200 || new Set(ids).size !== ids.length || !/^\d+$/.test(raw)) { return null; }
  const offset = Number(raw);
  if (!Number.isSafeInteger(offset) || offset > ids.length) { return null; }
  const wanted = new Set(ids);
  const rows = observations.filter(o => !o.demo && wanted.has(o.id));
  if (rows.length !== ids.length) { return null; }
  rows.sort((a, b) => (a.observedAt ?? '').localeCompare(b.observedAt ?? '') || a.id.localeCompare(b.id));
  return { ids: rows.map(o => o.id), offset };
}
export function replayOrigin(origin: string | null): boolean {
  return origin === 'http://127.0.0.1:3400' || origin === 'http://localhost:3400';
}
export function serveReplay(request: Request, observations: Observation[]): Response {
  if (request.method !== 'GET' || !replayOrigin(request.headers.get('origin'))) { return new Response('Forbidden', { status: 403 }); }
  if (request.headers.get('upgrade')?.toLowerCase() !== 'websocket') { return new Response('WebSocket required', { status: 426 }); }
  const selection = replaySelection(new URL(request.url), observations);
  if (!selection) { return new Response('Invalid replay selection', { status: 400 }); }
  const { socket, response } = Deno.upgradeWebSocket(request);
  let next = selection.offset;
  let timer: ReturnType<typeof setInterval> | undefined;
  const stop = () => { if (timer !== undefined) { clearInterval(timer); timer = undefined; } };
  const sendNext = () => {
    if (socket.readyState !== WebSocket.OPEN) { stop(); return; }
    try {
      if (next === selection.ids.length) {
        socket.send(JSON.stringify({ type: 'complete', total: next }));
        stop(); socket.close(1000, 'Replay complete'); return;
      }
      socket.send(JSON.stringify({ type: 'observation', id: selection.ids[next], sequence: next + 1, total: selection.ids.length }));
      next += 1;
    } catch { stop(); socket.close(); }
  };
  socket.onopen = () => { timer = setInterval(sendNext, 400); };
  socket.onclose = stop;
  socket.onerror = stop;
  socket.onmessage = () => { stop(); socket.close(1008, 'Read only'); };
  return response;
}
