<script setup>
import { ref, computed, onMounted } from 'vue';
import { useSupabase } from '@/composables/useSupabase';

const { supabase, perfil } = useSupabase();

const carregando = ref(true);
const entregas = ref([]);
const mensagem = ref(null);
const acaoEmAndamento = ref(null);
const filtro = ref('pendente_aprovacao'); // tabs

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
      epi:epis(id, nome, estoque, data_validade, imagem, numero_ca),
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
  // a validade vem do próprio cadastro do EPI
  const validade = reg.epi?.data_validade || null;
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
          <div class="item-img">
            <img v-if="r.epi?.imagem" :src="r.epi.imagem" :alt="r.epi?.nome" />
            <div v-else class="img-placeholder"><i class="fas fa-hard-hat"></i></div>
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
                <span class="meta-valor">{{ formatarData(r.data_retirada) }}</span>
              </div>
              <div v-if="r.data_entrega" class="meta-item">
                <span class="meta-label">Entregue em</span>
                <span class="meta-valor">{{ formatarData(r.data_entrega) }}</span>
              </div>
              <div v-if="r.data_validade" class="meta-item">
                <span class="meta-label">Validade</span>
                <span class="meta-valor">{{ formatarData(r.data_validade) }}</span>
              </div>
            </div>

            <p v-if="r.justificativa" class="item-justificativa">
              <i class="fas fa-quote-left"></i> {{ r.justificativa }}
            </p>

            <!-- Ações por status -->
            <div class="acoes">
            <template v-if="r.status === 'pendente_aprovacao'">
              <button class="btn-aprovar" :disabled="acaoEmAndamento === r.id" @click="aprovar(r)">Aprovar</button>
              <button class="btn-recusar" :disabled="acaoEmAndamento === r.id" @click="recusar(r)">Recusar</button>
            </template>

            <template v-else-if="r.status === 'pendente_entrega'">
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

.lista { display: flex; flex-direction: column; gap: 1rem; }
.item {
  background: #2a2520; border: 1px solid rgba(255,255,255,0.05);
  border-radius: 0.85rem; padding: 1.3rem 1.4rem;
  display: flex; align-items: flex-start; gap: 1.3rem;
  transition: border-color 0.15s;
}
.item:hover { border-color: rgba(244,157,37,0.25); }

.item-img {
  flex: 0 0 84px; width: 84px; height: 84px;
  border-radius: 0.7rem; overflow: hidden; background: #3a332b;
  border: 1px solid rgba(255,255,255,0.05);
}
.item-img img { width: 100%; height: 100%; object-fit: cover; }
.img-placeholder {
  width: 100%; height: 100%;
  display: flex; align-items: center; justify-content: center;
  background: linear-gradient(135deg, rgba(244,157,37,0.1), transparent 60%), #3a332b;
  color: #F49D25; font-size: 1.6rem;
}

.item-corpo { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 0.9rem; }

.item-topo { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; }
.item-titulo { display: flex; align-items: center; flex-wrap: wrap; gap: 0.6rem; min-width: 0; }
.item-nome { color: #fff; font-weight: 700; font-size: 1.3rem; letter-spacing: -0.01em; }
.qtd {
  color: #F49D25; font-weight: 700; font-size: 0.95rem;
  background: rgba(244,157,37,0.12); padding: 0.15rem 0.6rem; border-radius: 999px;
}
.ca-chip {
  color: #c5bfb5; font-weight: 600; font-size: 0.78rem;
  background: rgba(255,255,255,0.05); padding: 0.18rem 0.6rem; border-radius: 999px;
}

.meta-grade {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 0.8rem 1.2rem;
}
.meta-item { display: flex; flex-direction: column; gap: 0.2rem; min-width: 0; }
.meta-label {
  color: #8b8680; font-size: 0.68rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.06em;
}
.meta-valor { color: #ebe8e4; font-size: 0.92rem; font-weight: 500; }

.item-justificativa {
  color: #facc15; font-size: 0.88rem; font-style: italic;
  background: rgba(250,204,21,0.06); border-left: 3px solid #facc15;
  padding: 0.55rem 0.85rem; border-radius: 0.4rem;
  display: flex; align-items: baseline; gap: 0.5rem;
}
.item-justificativa i { font-size: 0.75rem; opacity: 0.7; }

.status {
  font-size: 0.72rem; font-weight: 700; padding: 0.35rem 0.8rem;
  border-radius: 999px; text-transform: uppercase; letter-spacing: 0.04em; white-space: nowrap;
  flex-shrink: 0;
}
.status-pendente_aprovacao { background: rgba(250,204,21,0.12); color: #facc15; border: 1px solid rgba(250,204,21,0.35); }
.status-pendente_entrega   { background: rgba(96,165,250,0.12); color: #60a5fa; border: 1px solid rgba(96,165,250,0.35); }
.status-aprovado           { background: rgba(96,165,250,0.12); color: #60a5fa; border: 1px solid rgba(96,165,250,0.35); }
.status-entregue           { background: rgba(34,197,94,0.15); color: #4ade80; border: 1px solid rgba(34,197,94,0.35); }
.status-recusado           { background: rgba(248,113,113,0.12); color: #f87171; border: 1px solid rgba(248,113,113,0.35); }
.status-devolvido          { background: rgba(168,168,168,0.12); color: #a8a8a8; border: 1px solid rgba(168,168,168,0.3); }

.acoes {
  display: flex; gap: 0.55rem; align-items: center; flex-wrap: wrap;
  padding-top: 0.9rem; margin-top: 0.1rem;
  border-top: 1px solid rgba(255,255,255,0.06);
}
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

.toast {
  position: fixed; top: 1.5rem; right: 1.5rem; z-index: 999;
  padding: 0.85rem 1.3rem; border-radius: 0.6rem; font-weight: 600;
}
.toast-sucesso { background: rgba(34,197,94,0.15); border: 1px solid rgba(34,197,94,0.4); color: #4ade80; }
.toast-erro    { background: rgba(248,113,113,0.15); border: 1px solid rgba(248,113,113,0.4); color: #f87171; }

@media (max-width: 700px) {
  .pagina { padding: 1.5rem 1.2rem; }
  .item { flex-direction: column; padding: 1.1rem; }
  .item-img { width: 64px; height: 64px; flex-basis: 64px; }
  .item-nome { font-size: 1.1rem; }
}
</style>
