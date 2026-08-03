// Checagem: node src/tokens.check.mjs
// Falha se qualquer par texto/superfície do design system cair abaixo de WCAG AA.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('./style.css', import.meta.url), 'utf8');
const tokens = Object.fromEntries(
  [...css.matchAll(/--([\w-]+):\s*(#[0-9a-fA-F]{6})/g)].map(m => [m[1], m[2]])
);

const lum = (hex) => {
  const c = [0, 2, 4]
    .map(i => parseInt(hex.slice(1 + i, 3 + i), 16) / 255)
    .map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
};
const razao = (a, b) => {
  const [x, y] = [lum(a), lum(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
};

const superficies = ['superficie-fundo', 'superficie', 'superficie-alta', 'superficie-elevada', 'borda'];
const textos = ['texto-forte', 'texto', 'texto-suave', 'texto-fraco', 'marca', 'ok', 'aviso', 'perigo', 'info'];

for (const s of superficies) {
  for (const t of textos) {
    const r = razao(tokens[t], tokens[s]);
    assert.ok(r >= 4.5, `--${t} sobre --${s} = ${r.toFixed(2)}:1 (mínimo 4.5)`);
  }
}

// o par mais fácil de errar: texto em cima do botão da marca
const btn = razao(tokens['marca-texto'], tokens['marca']);
assert.ok(btn >= 4.5, `--marca-texto sobre --marca = ${btn.toFixed(2)}:1`);
assert.equal(tokens['marca-texto'], tokens['superficie'], 'marca-texto deve ser escuro, não branco');

console.log(`ok — ${superficies.length * textos.length + 1} pares acima de 4.5:1`);
