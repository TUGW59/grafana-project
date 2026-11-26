import { replayOrigin, replaySelection } from '../src/replay.ts';
import type { Observation } from '../../packages/contracts/mod.ts';
const obs = (id: string, observedAt: string, demo = false) => ({ id, observedAt, demo }) as Observation;
const rows = [obs('a','2026-11-02'),obs('b','2026-10-01'),obs('c','2026-11-01',true)];
function check(ok: boolean) { if (!ok) { throw new Error('Replay assertion failed'); } }
Deno.test('replay sorts selected records chronologically and resumes', () => {
  const r = replaySelection(new URL('http://localhost/?id=a&id=b&offset=1'), rows);
  check(JSON.stringify(r) === JSON.stringify({ids:['b','a'],offset:1}));
});
Deno.test('replay rejects unknown, demo, duplicate and out of range selections', () => {
  for (const q of ['id=c','id=x','id=a&id=a','id=a&offset=2','id=a&offset=-1','']) { check(replaySelection(new URL('http://localhost/?'+q), rows) === null); }
});
Deno.test('replay only accepts local review origin', () => {
  check(replayOrigin('http://127.0.0.1:3400') && replayOrigin('http://localhost:3400') && !replayOrigin(null) && !replayOrigin('http://localhost:3300') && !replayOrigin('https://evil.example'));
});
