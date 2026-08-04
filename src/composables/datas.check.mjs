// Checagem: node src/composables/datas.check.mjs
// O bug que isto trava: `new Date('2026-01-31')` é UTC e volta 30/01 no Brasil.
import assert from 'node:assert/strict';
import { isoParaBr, brParaIso, formatarData, diasAte } from './datas.js';

assert.equal(isoParaBr('2026-01-31'), '31/01/2026');
assert.equal(isoParaBr('2026-01-31T00:00:00Z'), '31/01/2026');
assert.equal(isoParaBr(''), '');
assert.equal(isoParaBr(null), '');

assert.equal(brParaIso('31/01/2026'), '2026-01-31');
assert.equal(brParaIso('31/1/2026'), null, 'formato incompleto deve recusar');
assert.equal(brParaIso(''), null);

assert.equal(formatarData(null), '—');
assert.equal(formatarData('2026-01-31'), '31/01/2026');

// ida e volta não pode perder um dia
assert.equal(isoParaBr(brParaIso('01/03/2026')), '01/03/2026');

const hojeIso = (() => {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
})();
assert.equal(diasAte(hojeIso), 0, 'hoje tem que dar 0, não -1');
assert.equal(diasAte(null), null);

console.log('ok — datas');
