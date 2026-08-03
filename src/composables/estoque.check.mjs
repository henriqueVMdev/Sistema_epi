// Checagem: node src/composables/estoque.check.mjs
import assert from 'node:assert/strict';
import { ajustarEstoque } from './estoque.js';

const fakeSupabase = (linhasAfetadas, error = null) => ({
  from: () => ({
    update(payload) { this.payload = payload; return this; },
    eq() { return this; },
    select: async () => ({ data: Array(linhasAfetadas).fill({ id: 1 }), error }),
  }),
});

assert.deepEqual(await ajustarEstoque(fakeSupabase(1), 1, 10, -3), { ok: true, estoque: 7 });
assert.equal((await ajustarEstoque(fakeSupabase(0), 1, 10, -3)).motivo, 'conflito');
assert.equal((await ajustarEstoque(fakeSupabase(1), 1, 2, -5)).motivo, 'insuficiente');
assert.equal((await ajustarEstoque(fakeSupabase(0, { message: 'x' }), 1, 10, 5)).motivo, 'erro');
assert.deepEqual(await ajustarEstoque(fakeSupabase(1), 1, null, 5), { ok: true, estoque: 5 });

console.log('ok');
