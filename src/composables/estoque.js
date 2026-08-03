// Ajuste de estoque com trava otimista: só grava se o valor no banco ainda for
// o que foi lido na tela. Evita duas entregas simultâneas debitarem o mesmo saldo.
// ponytail: trava otimista no cliente; virar RPC/trigger no Postgres se houver
// muita concorrência ou se o débito precisar ser atômico com a entrega.
export async function ajustarEstoque(supabase, epiId, atual, delta) {
  const base = Number(atual) || 0;
  const novo = base + delta;
  if (novo < 0) return { ok: false, motivo: 'insuficiente' };

  const { data, error } = await supabase
    .from('epis')
    .update({ estoque: novo })
    .eq('id', epiId)
    .eq('estoque', base)
    .select('id');

  if (error) return { ok: false, motivo: 'erro', error };
  if (!data || data.length === 0) return { ok: false, motivo: 'conflito' };
  return { ok: true, estoque: novo };
}
