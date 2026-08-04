<script setup>
import { ref, computed, onMounted } from 'vue';
import { useSupabase } from '@/composables/useSupabase';
import { ajustarEstoque } from '@/composables/estoque';
import { useMensagem } from '@/composables/mensagem';
import { formatarData, formatarDataHora } from '@/composables/datas';
import Toast from '@/components/Toast.vue';
import Icone from '@/components/Icone.vue';

const { supabase, perfil } = useSupabase();
const { mensagem, mostrarMensagem } = useMensagem();

const carregando = ref(true);
const entregas = ref([]);
const acaoEmAndamento = ref(null);
const filtro = ref('pendente_aprovacao');

const labelStatus = (s) => ({
  pendente_aprovacao: 'Aguardando aprovação',
  pendente_entrega: 'Aguardando entrega',
  aprovado: 'Aprovado',
  recusado: 'Recusado',
  entregue: 'Entregue',
  devolvido: 'Devolvido',
})[s] || s;

const carregar = async () => {
  carregando.value = true;
  const { data, error } = await supabase
    .from('entrega_epi')
    .select(`
      id, status, quantidade, justificativa, data_retirada, data_entrega, data_validade, data_devolucao,
      nome_epi, nome_retirada, setor_retirada,
      epi:epis(*),
      funcionario:funcionarios(id, nome, setor:setores!funcionarios_setor_id_fkey(id, nome))
    `)
    .order('data_retirada', { ascending: false })
    .limit(200);
  if (error) { console.error(error); mostrarMensagem('erro', 'Erro ao carregar: ' + error.message, 8000); }
  entregas.value = data || [];
  carregando.value = false;
};

const tabs = [
  { key: 'pendente_aprovacao', label: 'Aguardando aprovação' },
  { key: 'pendente_entrega',   label: 'Aguardando entrega' },
  { key: 'entregue',           label: 'Em uso (entregues)' },
  { key: 'todos',              label: 'Tudo' },
];

const filtradas = computed(() => {
  if (filtro.value === 'todos') return entregas.value;
  return entregas.value.filter(e => e.status === filtro.value);
});

const contadores = computed(() => {
  const c = { pendente_aprovacao: 0, pendente_entrega: 0, entregue: 0 };
  for (const e of entregas.value) {
    if (c[e.status] !== undefined) c[e.status]++;
  }
  return c;
});

async function aprovar(reg) {
  acaoEmAndamento.value = reg.id;
  const { error } = await supabase
    .from('entrega_epi')
    .update({
      status: 'pendente_entrega',
      aprovado_por: perfil.value.user_id || null,
      aprovado_em: new Date().toISOString(),
    })
    .eq('id', reg.id);
  acaoEmAndamento.value = null;
  if (error) { mostrarMensagem('erro', 'Erro ao aprovar.'); console.error(error); return; }
  mostrarMensagem('sucesso', 'Pedido aprovado. Agora pode entregar.');
  carregar();
}

async function recusar(reg) {
  if (!confirm('Recusar este pedido?')) return;
  acaoEmAndamento.value = reg.id;
  const { error } = await supabase
    .from('entrega_epi')
    .update({
      status: 'recusado',
      aprovado_por: perfil.value.user_id || null,
      aprovado_em: new Date().toISOString(),
    })
    .eq('id', reg.id);
  acaoEmAndamento.value = null;
  if (error) { mostrarMensagem('erro', 'Erro ao recusar.'); console.error(error); return; }
  mostrarMensagem('sucesso', 'Pedido recusado.');
  carregar();
}

async function registrarEntrega(reg) {
  const validade = reg.epi?.data_validade || null;
  const estoqueAtual = Number(reg.epi?.estoque) || 0;
  const qtd = Number(reg.quantidade) || 1;
  if (qtd > estoqueAtual) {
    mostrarMensagem('erro', `Estoque insuficiente. Disponível: ${estoqueAtual}.`);
    return;
  }

  acaoEmAndamento.value = reg.id;

  // debita primeiro: se o estoque mudou no meio do caminho, nada é entregue
  const deb = await ajustarEstoque(supabase, reg.epi?.id, estoqueAtual, -qtd);
  if (!deb.ok) {
    acaoEmAndamento.value = null;
    if (deb.error) console.error(deb.error);
    mostrarMensagem('erro', deb.motivo === 'conflito'
      ? 'O estoque mudou desde que a tela carregou. Atualize e tente de novo.'
      : 'Estoque insuficiente ou erro ao debitar.');
    carregar();
    return;
  }

  const { error: e1 } = await supabase
    .from('entrega_epi')
    .update({
      status: 'entregue',
      data_entrega: new Date().toISOString(),
      data_validade: validade,
    })
    .eq('id', reg.id);
  if (e1) {
    console.error(e1);
    await ajustarEstoque(supabase, reg.epi?.id, deb.estoque, qtd); // desfaz o débito
    acaoEmAndamento.value = null;
    mostrarMensagem('erro', 'Erro ao registrar entrega. Estoque não foi alterado.');
    carregar();
    return;
  }

  acaoEmAndamento.value = null;
  mostrarMensagem('sucesso', 'Entrega registrada e estoque atualizado.');
  carregar();
}

async function registrarDevolucao(reg) {
  if (!confirm('Marcar como devolvido? O EPI volta para o estoque.')) return;
  acaoEmAndamento.value = reg.id;

  const { error: e1 } = await supabase
    .from('entrega_epi')
    .update({
      status: 'devolvido',
      data_devolucao: new Date().toISOString().slice(0, 10),
    })
    .eq('id', reg.id);
  if (e1) { acaoEmAndamento.value = null; mostrarMensagem('erro', 'Erro ao devolver.'); console.error(e1); return; }

  const estoqueAtual = Number(reg.epi?.estoque) || 0;
  const qtd = Number(reg.quantidade) || 1;
  const cred = await ajustarEstoque(supabase, reg.epi?.id, estoqueAtual, qtd);
  if (!cred.ok) mostrarMensagem('erro', 'Devolução salva, mas o estoque não foi creditado. Ajuste manualmente.', 8000);

  acaoEmAndamento.value = null;
  mostrarMensagem('sucesso', 'Devolução registrada.');
  carregar();
}

onMounted(carregar);
</script>

<template>
  <div class="pagina">
    <header class="cabecalho">
      <div>
        <p class="caminho">Operações <span class="separador">›</span> <span class="atual">Aprovações</span></p>
        <h1 class="titulo">Fila de <span class="destaque">Aprovações</span></h1>
        <p class="subtitulo">Aprove pedidos acima do limite, registre entregas e devoluções.</p>
      </div>
    </header>

    <Toast :mensagem="mensagem" />

    <div class="tabs" role="group" aria-label="Filtrar pedidos por situação">
      <button type="button"
        v-for="t in tabs"
        :key="t.key"
        :class="['tab', { ativa: filtro === t.key }]"
        :aria-pressed="filtro === t.key"
        @click="filtro = t.key"
      >
        {{ t.label }}
        <span v-if="contadores[t.key]" class="tab-contador">{{ contadores[t.key] }}</span>
      </button>
    </div>

    <section class="cartao">
      <p v-if="carregando" class="vazio" role="status">Carregando…</p>
      <div v-else-if="filtradas.length === 0" class="vazio">Nada por aqui.</div>

      <div v-else class="lista">
        <article v-for="r in filtradas" :key="r.id" class="item">
          <div class="item-img">
            <img loading="lazy" decoding="async" v-if="r.epi?.imagem" :src="r.epi.imagem" :alt="r.epi?.nome" />
            <div v-else class="img-placeholder"><Icone nome="capacete" :tamanho="26" /></div>
          </div>

          <div class="item-corpo">
            <div class="item-topo">
              <div class="item-titulo">
                <h3 class="item-nome">{{ r.nome_epi || r.epi?.nome || '—' }}</h3>
                <span class="qtd">× {{ r.quantidade || 1 }}</span>
                <span v-if="r.epi?.numero_ca" class="ca-chip">CA #{{ r.epi.numero_ca }}</span>
              </div>
              <span class="status" :class="'status-' + r.status">{{ labelStatus(r.status) }}</span>
            </div>

            <div class="meta-grade">
              <div class="meta-item">
                <span class="meta-label">Solicitante</span>
                <span class="meta-valor">{{ r.nome_retirada || r.funcionario?.nome || '—' }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Setor</span>
                <span class="meta-valor">{{ r.setor_retirada || r.funcionario?.setor?.nome || '—' }}</span>
              </div>
              <div class="meta-item">
                <span class="meta-label">Pedido em</span>
                <span class="meta-valor">{{ formatarDataHora(r.data_retirada) }}</span>
              </div>
              <div v-if="r.data_entrega" class="meta-item">
                <span class="meta-label">Entregue em</span>
                <span class="meta-valor">{{ formatarDataHora(r.data_entrega) }}</span>
              </div>
              <div v-if="r.data_validade" class="meta-item">
                <span class="meta-label">Validade</span>
                <span class="meta-valor">{{ formatarData(r.data_validade) }}</span>
              </div>
            </div>

            <p v-if="r.justificativa" class="item-justificativa">
              <Icone nome="aspas" :tamanho="14" />
              <span>{{ r.justificativa }}</span>
            </p>

            <div class="acoes">
            <template v-if="r.status === 'pendente_aprovacao'">
              <button type="button" class="btn-aprovar" :disabled="acaoEmAndamento === r.id" @click="aprovar(r)">Aprovar</button>
              <button type="button" class="btn-recusar" :disabled="acaoEmAndamento === r.id" @click="recusar(r)">Recusar</button>
            </template>

            <template v-else-if="r.status === 'pendente_entrega'">
              <button type="button"
                class="btn-aprovar"
                :disabled="acaoEmAndamento === r.id"
                @click="registrarEntrega(r)"
              >Registrar entrega</button>
              <button type="button" class="btn-recusar" :disabled="acaoEmAndamento === r.id" @click="recusar(r)">Recusar</button>
            </template>

            <template v-else-if="r.status === 'entregue'">
              <button type="button"
                class="btn-recusar"
                :disabled="acaoEmAndamento === r.id"
                @click="registrarDevolucao(r)"
              >Marcar devolvido</button>
            </template>
            </div>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<style scoped>
.pagina {
  background: var(--superficie-alta);
  min-height: 100vh;
  color: var(--texto-forte);
  padding: 2rem 3rem;
}

.cabecalho { margin-bottom: 1.6rem; }
.caminho { color: var(--texto-suave); font-size: 0.85rem; margin-bottom: 0.5rem; }
.caminho .separador { margin: 0 0.4rem; }
.atual { color: var(--texto-forte); }
.titulo { font-size: 2.2rem; font-weight: 800; margin-bottom: 0.3rem; }
.destaque { color: var(--marca); }
.subtitulo { color: var(--texto-suave); font-size: 0.9rem; }

.tabs { display: flex; gap: 0.4rem; margin-bottom: 1rem; flex-wrap: wrap; }
.tab {
  background: var(--superficie-elevada); border: 1px solid color-mix(in srgb, var(--texto-forte) 6%, transparent); color: var(--texto);
  min-height: 2.75rem;
  padding: 0.55rem 1rem; border-radius: var(--raio-sm); cursor: pointer; font-size: 0.86rem;
  display: inline-flex; align-items: center; gap: 0.4rem; font-weight: 600;
  font-family: inherit;
  transition: border-color 0.15s, background 0.15s;
}
.tab:hover { border-color: color-mix(in srgb, var(--marca) 40%, transparent); }
.tab.ativa { background: color-mix(in srgb, var(--marca) 12%, transparent); border-color: var(--marca); color: var(--marca); }
.tab-contador {
  background: var(--marca); color: var(--marca-texto); font-weight: 800;
  border-radius: 999px; padding: 0.05rem 0.5rem; font-size: 0.75rem;
}

.cartao {
  background: var(--superficie-elevada);
  border: 1px solid color-mix(in srgb, var(--texto-forte) 4%, transparent);
  border-radius: 1rem;
  padding: 1.2rem;
}
.vazio { text-align: center; color: var(--texto-suave); padding: 2rem; }

.lista { display: flex; flex-direction: column; gap: 1rem; }
.item {
  background: var(--borda); border: 1px solid color-mix(in srgb, var(--texto-forte) 5%, transparent);
  border-radius: 0.85rem; padding: 1.3rem 1.4rem;
  display: flex; align-items: flex-start; gap: 1.3rem;
  transition: border-color 0.15s;
}
.item:hover { border-color: color-mix(in srgb, var(--marca) 25%, transparent); }

.item-img {
  flex: 0 0 84px; width: 84px; height: 84px;
  border-radius: 0.7rem; overflow: hidden; background: var(--borda-forte);
  border: 1px solid color-mix(in srgb, var(--texto-forte) 5%, transparent);
}
.item-img img { width: 100%; height: 100%; object-fit: cover; }
.img-placeholder {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, color-mix(in srgb, var(--marca) 10%, transparent), transparent 60%), var(--borda-forte);
  color: var(--marca); font-size: 1.6rem;
}

.item-corpo { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 0.9rem; }

.item-topo { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; }
.item-titulo { display: flex; align-items: center; flex-wrap: wrap; gap: 0.6rem; min-width: 0; }
.item-nome { color: var(--texto-forte); font-weight: 700; font-size: 1.3rem; letter-spacing: -0.01em; }
.qtd {
  color: var(--marca); font-weight: 700; font-size: 0.95rem;
  background: color-mix(in srgb, var(--marca) 12%, transparent); padding: 0.15rem 0.6rem; border-radius: 999px;
}
.ca-chip {
  color: var(--texto); font-weight: 600; font-size: 0.78rem;
  background: color-mix(in srgb, var(--texto-forte) 5%, transparent); padding: 0.18rem 0.6rem; border-radius: 999px;
}

.meta-grade {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 0.8rem 1.2rem;
}
.meta-item { display: flex; flex-direction: column; gap: 0.2rem; min-width: 0; }
.meta-label {
  color: var(--texto-suave); font-size: 0.68rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.06em;
}
.meta-valor { color: var(--texto); font-size: 0.92rem; font-weight: 500; }

.item-justificativa {
  color: var(--aviso); font-size: 0.88rem; font-style: italic;
  background: color-mix(in srgb, var(--aviso) 6%, transparent); border: 1px solid color-mix(in srgb, var(--aviso) 22%, transparent);
  padding: 0.55rem 0.85rem; border-radius: 0.4rem;
  display: flex; align-items: baseline; gap: 0.5rem;
}
.item-justificativa i { font-size: 0.75rem; opacity: 0.7; }

.status {
  font-size: 0.72rem; font-weight: 700; padding: 0.35rem 0.8rem;
  border-radius: 999px; text-transform: uppercase; letter-spacing: 0.04em; white-space: nowrap;
  flex-shrink: 0;
}
.status-pendente_aprovacao { background: color-mix(in srgb, var(--aviso) 12%, transparent); color: var(--aviso); border: 1px solid color-mix(in srgb, var(--aviso) 35%, transparent); }
.status-pendente_entrega   { background: color-mix(in srgb, var(--info) 12%, transparent); color: var(--info); border: 1px solid color-mix(in srgb, var(--info) 35%, transparent); }
.status-aprovado           { background: color-mix(in srgb, var(--info) 12%, transparent); color: var(--info); border: 1px solid color-mix(in srgb, var(--info) 35%, transparent); }
.status-entregue           { background: color-mix(in srgb, var(--ok) 15%, transparent); color: var(--ok); border: 1px solid color-mix(in srgb, var(--ok) 35%, transparent); }
.status-recusado           { background: color-mix(in srgb, var(--perigo) 12%, transparent); color: var(--perigo); border: 1px solid color-mix(in srgb, var(--perigo) 35%, transparent); }
.status-devolvido          { background: color-mix(in srgb, var(--texto-fraco) 12%, transparent); color: var(--texto-suave); border: 1px solid color-mix(in srgb, var(--texto-fraco) 30%, transparent); }

.item-justificativa { display: flex; align-items: flex-start; gap: 0.45rem; }

.acoes {
  display: flex; gap: 0.55rem; align-items: center; flex-wrap: wrap;
  padding-top: 0.9rem; margin-top: 0.1rem;
  border-top: 1px solid color-mix(in srgb, var(--texto-forte) 6%, transparent);
}
.btn-aprovar, .btn-recusar {
  display: inline-flex; align-items: center; justify-content: center;
  min-height: 2.75rem;
  padding: 0.5rem 1.1rem;
  border-radius: var(--raio-sm);
  font-family: inherit;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-aprovar {
  background: var(--marca); color: var(--marca-texto); border: none;
  font-weight: 700; font-size: 0.85rem;
}
.btn-aprovar:hover:not(:disabled) { background: var(--marca-escura); }
.btn-aprovar:disabled, .btn-recusar:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-recusar {
  background: color-mix(in srgb, var(--perigo) 12%, transparent); color: var(--perigo);
  border: 1px solid color-mix(in srgb, var(--perigo) 30%, transparent);
  font-weight: 600; font-size: 0.82rem;
}
.btn-recusar:hover:not(:disabled) { background: color-mix(in srgb, var(--perigo) 22%, transparent); }

@media (max-width: 700px) {
  .pagina { padding: 1.5rem 1.2rem; }
  .item { flex-direction: column; padding: 1.1rem; }
  .item-img { width: 64px; height: 64px; flex-basis: 64px; }
  .item-nome { font-size: 1.1rem; }
}
</style>
