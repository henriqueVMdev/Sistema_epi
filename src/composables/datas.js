// Datas do banco chegam como 'AAAA-MM-DD' ou ISO completo.
// `new Date('2026-01-01')` é interpretado como UTC e vira 31/12 em São Paulo,
// por isso tudo aqui parte de split manual em vez de Date.
// Checagem: node src/composables/datas.check.mjs

const partes = (valor) => String(valor ?? '').split('T')[0].split('-');

/** '2026-01-31' -> '31/01/2026'. Vazio se não der para ler. */
export const isoParaBr = (iso) => {
  if (!iso) return '';
  const [a, m, d] = partes(iso);
  return a && m && d ? `${d}/${m}/${a}` : '';
};

/** '31/01/2026' -> '2026-01-31'. null se o formato não bater. */
export const brParaIso = (br) => {
  if (!br) return null;
  const m = String(br).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
};

/** Data para exibir em lista/tabela. Travessão quando não há valor. */
export const formatarData = (valor) => {
  if (!valor) return '—';
  return isoParaBr(valor) || String(valor);
};

/** Data + hora local. Só para timestamps (data_retirada, data_entrega). */
export const formatarDataHora = (valor) => {
  if (!valor) return '—';
  const d = new Date(valor);
  if (isNaN(d.getTime())) return String(valor);
  return `${d.toLocaleDateString('pt-BR')} ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
};

/** Dias entre hoje e a data. Negativo = vencido. null = sem data válida. */
export const diasAte = (valor) => {
  if (!valor) return null;
  const [a, m, d] = partes(valor).map(Number);
  if (!a || !m || !d) return null;
  const alvo = Date.UTC(a, m - 1, d);
  const agora = new Date();
  const hoje = Date.UTC(agora.getFullYear(), agora.getMonth(), agora.getDate());
  return Math.round((alvo - hoje) / 86400000);
};

/** Máscara DD/MM/AAAA aplicada enquanto digita. */
export const aplicarMascaraData = (e, alvo, campo) => {
  let v = e.target.value.replace(/\D/g, '').slice(0, 8);
  if (v.length >= 5) v = `${v.slice(0, 2)}/${v.slice(2, 4)}/${v.slice(4)}`;
  else if (v.length >= 3) v = `${v.slice(0, 2)}/${v.slice(2)}`;
  e.target.value = v;
  alvo[campo] = v;
};
