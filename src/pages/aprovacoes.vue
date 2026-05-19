<script setup>
import { ref, computed, onMounted } from 'vue';
import { useSupabase } from '@/composables/useSupabase';

const { supabase, perfil } = useSupabase();

const carregando = ref(true);
const entregas = ref([]);
const mensagem = ref(null);
const acaoEmAndamento = ref(null);
const filtro = ref('pendente_aprovacao'); // tabs

const validadeProvisoria = ref({}); // por id, quando vai entregar

const mostrarMensagem = (tipo, texto) => {
  mensagem.value = { tipo, texto };
  setTimeout(() => { mensagem.value = null; }, 3500);
};

const formatarData = (data) => {
  if (!data) return '—';
  const d = new Date(data);
  if (isNaN(d.getTime())) return data;
  return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

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
      epi:epis(id, nome, estoque, data_validade),
      funcionario:funcionarios(id, nome, setor:setores(id, nome))
    `)
    .order('data_retirada', { ascending: false })
    .limit(200);
  if (error) console.error(error);
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
  const validade = validadeProvisoria.value[reg.id];
  if (!validade) {
    mostrarMensagem('erro', 'Informe a data de validade do EPI entregue.');
    return;
  }
  const estoqueAtual = Number(reg.epi?.estoque) || 0;
  const qtd = Number(reg.quantidade) || 1;
  if (qtd > estoqueAtual) {
    mostrarMensagem('erro', `Estoque insuficiente. Disponível: ${estoqueAtual}.`);
    return;
  }

  acaoEmAndamento.value = reg.id;

  const { error: e1 } = await supabase
    .from('entrega_epi')
    .update({
      status: 'entregue',
      data_entrega: new Date().toISOString(),
      data_validade: validade,
    })
    .eq('id', reg.id);
  if (e1) { acaoEmAndamento.value = null; mostrarMensagem('erro', 'Erro ao registrar entrega.'); console.error(e1); return; }

  const { error: e2 } = await supabase
    .from('epis')
    .update({ estoque: estoqueAtual - qtd })
    .eq('id', reg.epi?.id);
  if (e2) { console.error(e2); /* segue mesmo assim, mas avisa */ mostrarMensagem('erro', 'Entrega salva, mas falha ao debitar estoque.'); }

  acaoEmAndamento.value = null;
  validadeProvisoria.value[reg.id] = '';
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
  await supabase.from('epis').update({ estoque: estoqueAtual + qtd }).eq('id', reg.epi?.id);

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
        <p class="caminho">Almoxarife <span class="separador">›</span> <span class="atual">Aprovações</span></p>
        <h1 class="titulo">Fila de <span class="destaque">Aprovações</span></h1>
        <p class="subtitulo">Aprove pedidos acima do limite, registre entregas e devoluções.</p>
      </div>
    </header>

    <div v-if="mensagem" :class="['toast', 'toast-' + mensagem.tipo]">{{ mensagem.texto }}</div>

    <nav class="tabs">
      <button
        v-for="t in tabs"
        :key="t.key"
        :class="['tab', { ativa: filtro === t.key }]"
        @click="filtro = t.key"
      >
        {{ t.label }}
        <span v-if="contadores[t.key]" class="tab-contador">{{ contadores[t.key] }}</span>
      </button>
    </nav>

    <section class="cartao">
      <div v-if="carregando" class="vazio">Carregando…</div>
      <div v-else-if="filtradas.length === 0" class="vazio">Nada por aqui.</div>

      <div v-else class="lista">
        <article v-for="r in filtradas" :key="r.id" class="item">
          <div class="item-topo">
            <div>
              <p class="item-nome">{{ r.nome_epi || r.epi?.nome || '—' }} <span class="qtd">× {{ r.quantidade || 1 }}</span></p>
              <p class="item-sub">
                {{ r.nome_retirada || r.funcionario?.nome }} ·
                Setor: {{ r.setor_retirada || r.funcionario?.setor?.nome || '—' }}
              </p>
              <p class="item-sub">Pedido em {{ formatarData(r.data_retirada) }}</p>
              <p v-if="r.data_entrega" class="item-sub">Entregue em {{ formatarData(r.data_entrega) }}</p>
              <p v-if="r.data_validade" class="item-sub">Validade: {{ formatarData(r.data_validade) }}</p>
              <p v-if="r.justificativa" class="item-justificativa">"{{ r.justificativa }}"</p>
            </div>
            <span class="status" :class="'status-' + r.status">{{ labelStatus(r.status) }}</span>
          </div>

          <!-- Ações por status -->
          <div class="acoes">
            <template v-if="r.status === 'pendente_aprovacao'">
              <button class="btn-aprovar" :disabled="acaoEmAndamento === r.id" @click="aprovar(r)">Aprovar</button>
              <button class="btn-recusar" :disabled="acaoEmAndamento === r.id" @click="recusar(r)">Recusar</button>
            </template>

            <template v-else-if="r.status === 'pendente_entrega'">
              <label class="campo-validade">
                Validade:
                <input type="date" v-model="validadeProvisoria[r.id]" />
              </label>
              <button
                class="btn-aprovar"
                :disabled="acaoEmAndamento === r.id"
                @click="registrarEntrega(r)"
              >Registrar entrega</button>
              <button class="btn-recusar" :disabled="acaoEmAndamento === r.id" @click="recusar(r)">Recusar</button>
            </template>

            <template v-else-if="r.status === 'entregue'">
              <button
                class="btn-recusar"
                :disabled="acaoEmAndamento === r.id"
                @click="registrarDevolucao(r)"
              >Marcar devolvido</button>
            </template>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<style scoped>
.pagina {
  background: #181511;
  min-height: 100vh;
  color: #fff;
  padding: 2rem 3rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.cabecalho { margin-bottom: 1.6rem; }
.caminho { color: #8b8680; font-size: 0.85rem; margin-bottom: 0.5rem; }
.caminho .separador { margin: 0 0.4rem; }
.atual { color: #fff; }
.titulo { font-size: 2.2rem; font-weight: 800; margin-bottom: 0.3rem; }
.destaque { color: #F49D25; }
.subtitulo { color: #8b8680; font-size: 0.9rem; }

.tabs { display: flex; gap: 0.4rem; margin-bottom: 1rem; flex-wrap: wrap; }
.tab {
  background: #221E18; border: 1px solid rgba(255,255,255,0.06); color: #c5bfb5;
  padding: 0.55rem 1rem; border-radius: 0.5rem; cursor: pointer; font-size: 0.86rem;
  display: inline-flex; align-items: center; gap: 0.4rem; font-weight: 600;
}
.tab:hover { border-color: rgba(244,157,37,0.4); }
.tab.ativa { background: rgba(244,157,37,0.12); border-color: #F49D25; color: #F49D25; }
.tab-contador {
  background: #F49D25; color: #1a1410; font-weight: 800;
  border-radius: 999px; padding: 0.05rem 0.5rem; font-size: 0.75rem;
}

.cartao {
  background: #221E18;
  border: 1px solid rgba(255,255,255,0.04);
  border-radius: 1rem;
  padding: 1.2rem;
}
.vazio { text-align: center; color: #8b8680; padding: 2rem; }

.lista { display: flex; flex-direction: column; gap: 0.7rem; }
.item {
  background: #2a2520; border: 1px solid rgba(255,255,255,0.05);
  border-radius: 0.7rem; padding: 1rem 1.1rem;
  display: flex; flex-direction: column; gap: 0.7rem;
}

.item-topo { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; }
.item-nome { color: #fff; font-weight: 700; font-size: 1rem; }
.qtd { color: #F49D25; font-weight: 700; }
.item-sub { color: #8b8680; font-size: 0.78rem; margin-top: 0.15rem; }
.item-justificativa {
  margin-top: 0.45rem; color: #facc15; font-size: 0.85rem; font-style: italic;
  background: rgba(250,204,21,0.06); border-left: 3px solid #facc15;
  padding: 0.4rem 0.7rem; border-radius: 0.3rem;
}

.status {
  font-size: 0.7rem; font-weight: 700; padding: 0.3rem 0.7rem;
  border-radius: 999px; text-transform: uppercase; letter-spacing: 0.04em; white-space: nowrap;
}
.status-pendente_aprovacao { background: rgba(250,204,21,0.12); color: #facc15; border: 1px solid rgba(250,204,21,0.35); }
.status-pendente_entrega   { background: rgba(96,165,250,0.12); color: #60a5fa; border: 1px solid rgba(96,165,250,0.35); }
.status-aprovado           { background: rgba(96,165,250,0.12); color: #60a5fa; border: 1px solid rgba(96,165,250,0.35); }
.status-entregue           { background: rgba(34,197,94,0.15); color: #4ade80; border: 1px solid rgba(34,197,94,0.35); }
.status-recusado           { background: rgba(248,113,113,0.12); color: #f87171; border: 1px solid rgba(248,113,113,0.35); }
.status-devolvido          { background: rgba(168,168,168,0.12); color: #a8a8a8; border: 1px solid rgba(168,168,168,0.3); }

.acoes { display: flex; gap: 0.55rem; align-items: center; flex-wrap: wrap; }
.btn-aprovar {
  background: #F49D25; color: #1a1410; border: none;
  padding: 0.5rem 1rem; border-radius: 0.45rem; font-weight: 700; cursor: pointer; font-size: 0.85rem;
}
.btn-aprovar:hover:not(:disabled) { background: #e08c18; }
.btn-aprovar:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-recusar {
  background: rgba(248,113,113,0.12); color: #f87171;
  border: 1px solid rgba(248,113,113,0.3);
  padding: 0.45rem 0.9rem; border-radius: 0.45rem; font-weight: 600; cursor: pointer; font-size: 0.82rem;
}
.btn-recusar:hover:not(:disabled) { background: rgba(248,113,113,0.22); }

.campo-validade {
  display: inline-flex; align-items: center; gap: 0.4rem;
  color: #c5bfb5; font-size: 0.82rem;
}
.campo-validade input {
  background: #131110; border: 1px solid #2a241e; color: #fff;
  padding: 0.4rem 0.55rem; border-radius: 0.4rem; font-size: 0.85rem; outline: none;
}
.campo-validade input:focus { border-color: #F49D25; }

.toast {
  position: fixed; top: 1.5rem; right: 1.5rem; z-index: 999;
  padding: 0.85rem 1.3rem; border-radius: 0.6rem; font-weight: 600;
}
.toast-sucesso { background: rgba(34,197,94,0.15); border: 1px solid rgba(34,197,94,0.4); color: #4ade80; }
.toast-erro    { background: rgba(248,113,113,0.15); border: 1px solid rgba(248,113,113,0.4); color: #f87171; }
</style>
