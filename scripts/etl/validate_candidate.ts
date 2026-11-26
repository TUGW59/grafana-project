import { validateSnapshot } from '../../packages/contracts/mod.ts';
// Aday veriyi mevcut ortak kontrata göre kontrol et; yayınlama yapma.
const file = Deno.args[0];
if (!file) throw new Error('Aday dosya yolu gerekli');
const snapshot = JSON.parse(await Deno.readTextFile(file));
const errors = validateSnapshot(snapshot);
if (errors.length) throw new Error(errors.join('\n'));
if (snapshot.manifest.mode !== 'verified' || snapshot.observations.length === 0) {
  throw new Error('Boş veya yanlış modlu aday veri');
}
console.log('[OK] Ortak Deno kontratı: ' + snapshot.species.length + ' tür, ' + snapshot.observations.length + ' aday gözlem');
