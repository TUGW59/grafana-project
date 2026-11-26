// İstemci yalnız yerel 3400 önizlemesinde ve mevcut filtre kimlikleriyle bağlantı açar.
export function replayUrl(host: string, ids: string[], offset: number): string | undefined {
  if (!['127.0.0.1:3400', 'localhost:3400'].includes(host) || !ids.length || ids.length > 200 || new Set(ids).size !== ids.length || !Number.isInteger(offset) || offset < 0 || offset > ids.length) { return undefined; }
  const url = new URL(`ws://${host.split(':')[0]}:18183/v1/replay`);
  ids.forEach(id => url.searchParams.append('id', id));
  url.searchParams.set('offset', String(offset));
  return url.toString();
}
export function readReplay(raw: unknown, ids: string[], previous: string[]): { type: 'complete' } | { type: 'observation'; id: string } | undefined {
  if (typeof raw !== 'string') { return undefined; }
  try {
    const event = JSON.parse(raw);
    if (!event || event.total !== ids.length) { return undefined; }
    if (event.type === 'complete' && previous.length === ids.length) { return { type: 'complete' }; }
    if (event.type === 'observation' && typeof event.id === 'string' && event.sequence === previous.length + 1 && ids.includes(event.id) && !previous.includes(event.id)) { return { type: 'observation', id: event.id }; }
  } catch { return undefined; }
  return undefined;
}
