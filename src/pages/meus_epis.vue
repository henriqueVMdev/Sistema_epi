<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useSupabase } from '@/composables/useSupabase';

const { supabase, perfil } = useSupabase();

const carregando = ref(true);
const registros = ref([]);

const formatarData = (data) => {
  if (!data) return '—';
  const d = new Date(data);
  if (isNaN(d.getTime())) return data;
  return d.toLocaleDateString('pt-BR');
};

const labelStatus = (s) => ({
  pendente_aprovacao: 'Aguardando aprovação',
  pendente_entrega: 'Aguardando entrega',
  aprovado: 'Aprovado',
  recusado: 'Recusado',
  entregue: 'Em uso',
  devolvido: 'Devolvido',
})[s] || s;

const carregar = async () => {
  if (!perfil.value) return;
  carregando.value = true;
  const { data, error } = await supabase
    .from('entrega_epi')
    .select(`
      id, status, quantidade, justificativa,
      data_retirada, data_entrega, data_validade, data_devolucao,
      nome_epi, epi:epis(*)
    `)
    .eq('funcionario_id', perfil.value.id)
    .order('data_retirada', { ascending: false })
    .limit(200);
  if (error) console.error(error);
  registros.value = data || [];
  carregando.value = false;
};

onMounted(() => { if (perfil.value) carregar(); });
watch(() => perfil.value?.id, (v) => { if (v) carregar(); });

const hoje = new Date().toISOString().slice(0, 10);
const venceEm = (data) => {
  if (!data) return null;
  const d = new Date(data);
  if (isNaN(d.getTime())) return null;
  return Math.ceil((d - new Date(hoje)) / (1000 * 60 * 60 * 24));
};

const emUso = computed(() =>
  registros.value.filter(r => r.status === 'entregue' && !r.data_devolucao)
);
const pendentes = computed(() =>
  registros.value.filter(r => ['pendente_aprovacao', 'pendente_entrega', 'aprovado'].includes(r.status))
);
const historico = computed(() =>
  registros.value.filter(r => ['devolvido', 'recusado'].includes(r.status))
);

const totalEmUso = computed(() =>
  emUso.value.reduce((s, r) => s + (Number(r.quantidade) || 1), 0)
);
const totalVencendo = computed(() =>
  emUso.value.filter(r => {
    const d = venceEm(r.data_validade);
    return d !== null && d <= 30;
  }).length
);
</script>

<template>
  <div class="pagina">
    <header class="cabecalho">
      <div>
        <p class="caminho">Operações <span class="separador">›</span> <span class="atual">Meus EPIs</span></p>
        <h1 class="titulo">Meus <span class="destaque">EPIs</span></h1>
        <p class="subtitulo">
          {{ perfil?.nome || 'Funcionário' }} · Setor {{ perfil?.setor?.nome || '—' }}
        </p>
      </div>
      <button type="button" class="botao-recarregar" @click="carregar" :disabled="carregando">↻ Atualizar</button>
    </header>

    <p v-if="carregando" class="vazio">Carregando…</p>

    <template v-else>
      <section class="kpi-grid">
        <div class="kpi-card">
          <span class="kpi-label">EPIs em uso</span>
          <span class="kpi-valor">{{ totalEmUso }}</span>
          <span class="kpi-sub">{{ emUso.length }} item(ns) distinto(s)</span>
        </div>
        <div class="kpi-card kpi-aviso">
          <span class="kpi-label">Vencendo em breve</span>
          <span class="kpi-valor">{{ totalVencendo }}</span>
          <span class="kpi-sub">vencem em até 30 dias</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Pedidos em andamento</span>
          <span class="kpi-valor">{{ pendentes.length }}</span>
          <span class="kpi-sub">aguardando aprovação/entrega</span>
        </div>
      </section>

      <section class="cartao">
        <div class="cartao-cabecalho">
          <h2>EPIs em uso</h2>
          <span class="contagem">{{ emUso.length }}</span>
        </div>
        <p v-if="emUso.length === 0" class="vazio">Você não tem EPIs em uso no momento.</p>
        <div v-else class="lista">
          <article v-for="r in emUso" :key="r.id" class="item">
            <div class="item-img">
              <img loading="lazy" decoding="async" v-if="r.epi?.imagem" :src="r.epi.imagem" :alt="r.epi?.nome" />
              <div v-else class="img-placeholder"></div>
            </div>
            <div class="item-info">
              <p class="item-nome">{{ r.nome_epi || r.epi?.nome }} <span class="qtd">× {{ r.quantidade || 1 }}</span></p>
              <p class="item-sub">CA #{{ r.epi?.numero_ca || '—' }} · entregue em {{ formatarData(r.data_entrega) }}</p>
            </div>
            <div class="item-validade">
              <span class="venc-badge" :class="{
                'badge-critico': venceEm(r.data_validade) !== null && venceEm(r.data_validade) < 0,
                'badge-alerta': venceEm(r.data_validade) !== null && venceEm(r.data_validade) >= 0 && venceEm(r.data_validade) <= 30,
                'badge-ok': venceEm(r.data_validade) === null || venceEm(r.data_validade) > 30,
              }">
                <template v-if="venceEm(r.data_validade) === null">Sem validade</template>
                <template v-else-if="venceEm(r.data_validade) < 0">Vencido</template>
                <template v-else-if="venceEm(r.data_validade) === 0">Vence hoje</template>
                <template v-else>{{ venceEm(r.data_validade) }} dias</template>
              </span>
              <span class="item-sub">val. {{ formatarData(r.data_validade) }}</span>
            </div>
          </article>
        </div>
      </section>

      <section class="cartao">
        <div class="cartao-cabecalho">
          <h2>Pedidos em andamento</h2>
          <span class="contagem">{{ pendentes.length }}</span>
        </div>
        <p v-if="pendentes.length === 0" class="vazio">Nenhum pedido em andamento.</p>
        <div v-else class="lista">
          <article v-for="r in pendentes" :key="r.id" class="item">
            <div class="item-info">
              <p class="item-nome">{{ r.nome_epi || r.epi?.nome }} <span class="qtd">× {{ r.quantidade || 1 }}</span></p>
              <p class="item-sub">Pedido em {{ formatarData(r.data_retirada) }}</p>
              <p v-if="r.justificativa" class="item-justificativa">"{{ r.justificativa }}"</p>
            </div>
            <span class="status" :class="'status-' + r.status">{{ labelStatus(r.status) }}</span>
          </article>
        </div>
      </section>

      <section class="cartao">
        <div class="cartao-cabecalho">
          <h2>Histórico</h2>
          <span class="contagem">{{ historico.length }}</span>
        </div>
        <p v-if="historico.length === 0" class="vazio">Sem registros encerrados.</p>
        <div v-else class="lista">
          <article v-for="r in historico" :key="r.id" class="item item-compacto">
            <div class="item-info">
              <p class="item-nome">{{ r.nome_epi || r.epi?.nome }} <span class="qtd">× {{ r.quantidade || 1 }}</span></p>
              <p class="item-sub">
                {{ r.status === 'devolvido' ? 'Devolvido em ' + formatarData(r.data_devolucao) : 'Recusado' }}
              </p>
            </div>
            <span class="status" :class="'status-' + r.status">{{ labelStatus(r.status) }}</span>
          </article>
        </div>
      </section>
    </template>
  </div>
</template>

<style scoped>
.pagina {
  background: var(--superficie-alta);
  min-height: 100vh;
  color: var(--texto-forte);
  padding: 2rem 3rem 3rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  box-sizing: border-box;
  width: 100%;
}
.pagina *, .pagina *::before, .pagina *::after { box-sizing: border-box; }

.cabecalho {
  display: flex; justify-content: space-between; align-items: flex-start;
  gap: 1.5rem; margin-bottom: 1.8rem;
}
.caminho { color: var(--texto-suave); font-size: 0.85rem; margin-bottom: 0.5rem; }
.caminho .separador { margin: 0 0.4rem; }
.atual { color: var(--texto-forte); }
.titulo { font-size: 2.4rem; font-weight: 800; margin-bottom: 0.3rem; letter-spacing: -0.02em; }
.destaque { color: var(--marca); }
.subtitulo { color: var(--texto-suave); font-size: 0.9rem; }

.botao-recarregar {
  background: color-mix(in srgb, var(--marca) 12%, transparent); color: var(--marca);
  border: 1px solid color-mix(in srgb, var(--marca) 40%, transparent);
  padding: 0.6rem 1.05rem; border-radius: 0.55rem;
  font-size: 0.86rem; font-weight: 700; cursor: pointer; margin-top: 0.4rem;
}
.botao-recarregar:hover:not(:disabled) { background: color-mix(in srgb, var(--marca) 22%, transparent); }
.botao-recarregar:disabled { opacity: 0.5; cursor: not-allowed; }

.kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
.kpi-card {
  background: linear-gradient(180deg, var(--borda) 0%, var(--superficie-elevada) 100%);
  border: 1px solid color-mix(in srgb, var(--texto-forte) 5%, transparent);
  border-radius: 0.85rem; padding: 1.2rem 1.3rem;
  display: flex; flex-direction: column; gap: 0.3rem;
}
.kpi-label { color: var(--marca); font-size: 0.72rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; }
.kpi-valor { color: var(--texto-forte); font-size: 2rem; font-weight: 800; line-height: 1; }
.kpi-sub { color: var(--texto-suave); font-size: 0.78rem; }
.kpi-aviso { border-color: color-mix(in srgb, var(--aviso) 30%, transparent); }
.kpi-aviso .kpi-label { color: var(--aviso); }

.cartao {
  background: var(--superficie-elevada); border: 1px solid color-mix(in srgb, var(--texto-forte) 5%, transparent);
  border-radius: 1rem; padding: 1.4rem 1.5rem; margin-bottom: 1.5rem;
}
.cartao-cabecalho { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.2rem; }
.cartao-cabecalho h2 { color: var(--texto-forte); font-size: 1.05rem; font-weight: 700; }
.contagem {
  color: var(--marca); background: color-mix(in srgb, var(--marca) 10%, transparent);
  font-size: 0.78rem; font-weight: 700; padding: 0.2rem 0.65rem; border-radius: 999px;
}

.lista { display: flex; flex-direction: column; gap: 0.6rem; }
.item {
  display: flex; align-items: center; gap: 1rem;
  background: var(--borda); border: 1px solid color-mix(in srgb, var(--texto-forte) 5%, transparent);
  border-radius: 0.7rem; padding: 0.85rem 1rem;
}
.item-compacto { padding: 0.7rem 1rem; }
.item-img { flex: 0 0 52px; width: 52px; height: 52px; border-radius: 0.5rem; overflow: hidden; background: var(--borda-forte); }
.item-img img { width: 100%; height: 100%; object-fit: cover; }
.img-placeholder { width: 100%; height: 100%; background: var(--borda-forte); }
.item-info { flex: 1; min-width: 0; }
.item-nome { color: var(--texto-forte); font-weight: 700; font-size: 0.98rem; }
.qtd { color: var(--marca); font-weight: 700; margin-left: 0.2rem; }
.item-sub { color: var(--texto-suave); font-size: 0.78rem; margin-top: 0.15rem; }
.item-justificativa {
  margin-top: 0.4rem; color: var(--aviso); font-size: 0.82rem; font-style: italic;
  background: color-mix(in srgb, var(--aviso) 6%, transparent); border: 1px solid color-mix(in srgb, var(--aviso) 22%, transparent);
  padding: 0.35rem 0.6rem; border-radius: 0.3rem;
}

.item-validade { display: flex; flex-direction: column; align-items: flex-end; gap: 0.25rem; flex-shrink: 0; }

.venc-badge, .status {
  font-size: 0.72rem; font-weight: 700; padding: 0.28rem 0.7rem;
  border-radius: 999px; white-space: nowrap;
}
.status { text-transform: uppercase; letter-spacing: 0.04em; }
.badge-critico { background: color-mix(in srgb, var(--perigo) 15%, transparent); color: var(--perigo); border: 1px solid color-mix(in srgb, var(--perigo) 35%, transparent); }
.badge-alerta  { background: color-mix(in srgb, var(--aviso) 12%, transparent); color: var(--aviso); border: 1px solid color-mix(in srgb, var(--aviso) 35%, transparent); }
.badge-ok      { background: color-mix(in srgb, var(--ok) 12%, transparent); color: var(--ok); border: 1px solid color-mix(in srgb, var(--ok) 30%, transparent); }

.status-pendente_aprovacao { background: color-mix(in srgb, var(--aviso) 12%, transparent); color: var(--aviso); border: 1px solid color-mix(in srgb, var(--aviso) 35%, transparent); }
.status-pendente_entrega   { background: color-mix(in srgb, var(--info) 12%, transparent); color: var(--info); border: 1px solid color-mix(in srgb, var(--info) 35%, transparent); }
.status-aprovado           { background: color-mix(in srgb, var(--info) 12%, transparent); color: var(--info); border: 1px solid color-mix(in srgb, var(--info) 35%, transparent); }
.status-entregue           { background: color-mix(in srgb, var(--ok) 15%, transparent); color: var(--ok); border: 1px solid color-mix(in srgb, var(--ok) 35%, transparent); }
.status-recusado           { background: color-mix(in srgb, var(--perigo) 12%, transparent); color: var(--perigo); border: 1px solid color-mix(in srgb, var(--perigo) 35%, transparent); }
.status-devolvido          { background: rgba(168,168,168,0.12); color: var(--texto-suave); border: 1px solid rgba(168,168,168,0.3); }

.vazio { color: var(--texto-suave); font-size: 0.9rem; padding: 1rem 0; text-align: center; }

@media (max-width: 700px) {
  .pagina { padding: 1.5rem 1.2rem 2rem; }
  .titulo { font-size: 1.8rem; }
  .kpi-grid { grid-template-columns: 1fr; }
}
</style>
