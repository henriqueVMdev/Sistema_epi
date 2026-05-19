<script setup>
import { ref, computed, onMounted } from 'vue';
import { useSupabase } from '../composables/useSupabase';

const { supabase } = useSupabase();

const epis = ref([]);
const retiradas = ref([]);
const carregando = ref(true);

const carregar = async () => {
  carregando.value = true;
  const [{ data: episData }, { data: retiradasData }] = await Promise.all([
    supabase.from('epis').select('*'),
    supabase.from('entrega_epi').select('*').order('data_entrega', { ascending: false }),
  ]);
  epis.value = episData || [];
  retiradas.value = retiradasData || [];
  carregando.value = false;
};

onMounted(carregar);

const hoje = new Date();
const diasAteVencer = (data) => {
  if (!data) return null;
  const d = new Date(String(data).split('T')[0]);
  if (isNaN(d.getTime())) return null;
  return Math.ceil((d - hoje) / (1000 * 60 * 60 * 24));
};

const formatarData = (data) => {
  if (!data) return '—';
  const [ano, mes, dia] = String(data).split('T')[0].split('-');
  if (!ano || !mes || !dia) return data;
  return `${dia}/${mes}/${ano}`;
};

// KPIs
const totalEpis = computed(() => epis.value.length);
const totalEstoque = computed(() =>
  epis.value.reduce((s, e) => s + (Number(e.estoque) || 0), 0)
);
const totalRetiradas = computed(() => retiradas.value.length);
const retiradasPendentes = computed(() =>
  retiradas.value.filter(r => r.status === 'pendente').length
);
const estoqueBaixoCount = computed(() =>
  epis.value.filter(e => {
    const qtd = Number(e.estoque) || 0;
    const min = Number(e.estoque_minimo) || 0;
    return min > 0 && qtd <= min;
  }).length
);
const vencimentoProximoCount = computed(() =>
  epis.value.filter(e => {
    const d = diasAteVencer(e.data_validade);
    return d !== null && d >= 0 && d <= 60;
  }).length
);
const vencidos = computed(() =>
  epis.value.filter(e => {
    const d = diasAteVencer(e.data_validade);
    return d !== null && d < 0;
  }).length
);

// Top EPIs mais retirados
const topEpisRetirados = computed(() => {
  const map = {};
  for (const r of retiradas.value) {
    const nome = r.nome_epi || '—';
    map[nome] = (map[nome] || 0) + (Number(r.quantidade) || 1);
  }
  return Object.entries(map)
    .map(([nome, qtd]) => ({ nome, qtd }))
    .sort((a, b) => b.qtd - a.qtd)
    .slice(0, 6);
});
const maxTopEpi = computed(() =>
  topEpisRetirados.value.reduce((m, e) => Math.max(m, e.qtd), 0) || 1
);

// Retiradas por setor
const retiradasPorSetor = computed(() => {
  const map = {};
  for (const r of retiradas.value) {
    const setor = r.setor_retirada || 'Sem setor';
    map[setor] = (map[setor] || 0) + (Number(r.quantidade) || 1);
  }
  return Object.entries(map)
    .map(([setor, qtd]) => ({ setor, qtd }))
    .sort((a, b) => b.qtd - a.qtd);
});
const totalRetiradasSetor = computed(() =>
  retiradasPorSetor.value.reduce((s, x) => s + x.qtd, 0) || 1
);

// Cores para o pie/donut
const paletteCores = ['#F49D25', '#facc15', '#4ade80', '#60a5fa', '#c084fc', '#f87171', '#fb923c', '#34d399'];

// Donut chart - calcula segmentos
const donutSegmentos = computed(() => {
  const raio = 70;
  const circ = 2 * Math.PI * raio;
  let acumulado = 0;
  return retiradasPorSetor.value.slice(0, 8).map((item, idx) => {
    const fracao = item.qtd / totalRetiradasSetor.value;
    const len = fracao * circ;
    const offset = -acumulado;
    acumulado += len;
    return {
      ...item,
      cor: paletteCores[idx % paletteCores.length],
      dasharray: `${len} ${circ - len}`,
      dashoffset: offset,
      percentual: (fracao * 100).toFixed(1),
    };
  });
});

// Retiradas por mês (últimos 6 meses)
const retiradasPorMes = computed(() => {
  const meses = [];
  const ref = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
  for (let i = 5; i >= 0; i--) {
    const d = new Date(ref.getFullYear(), ref.getMonth() - i, 1);
    meses.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
      qtd: 0,
    });
  }
  for (const r of retiradas.value) {
    if (!r.data_entrega) continue;
    const d = new Date(r.data_entrega);
    if (isNaN(d.getTime())) continue;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const item = meses.find(m => m.key === key);
    if (item) item.qtd += Number(r.quantidade) || 1;
  }
  return meses;
});
const maxMes = computed(() =>
  retiradasPorMes.value.reduce((m, x) => Math.max(m, x.qtd), 0) || 1
);

// Linha do gráfico de meses (polyline)
const linhaMeses = computed(() => {
  const w = 100, h = 100;
  const n = retiradasPorMes.value.length;
  return retiradasPorMes.value.map((m, i) => {
    const x = n === 1 ? w / 2 : (i / (n - 1)) * w;
    const y = h - (m.qtd / maxMes.value) * h * 0.85 - 5;
    return `${x},${y}`;
  }).join(' ');
});

// EPIs próximos ao vencimento (até 90 dias) + vencidos
const episVencendo = computed(() => {
  return epis.value
    .map(e => ({ ...e, dias: diasAteVencer(e.data_validade) }))
    .filter(e => e.dias !== null && e.dias <= 90)
    .sort((a, b) => a.dias - b.dias)
    .slice(0, 8);
});

// EPIs com estoque baixo
const episEstoqueBaixo = computed(() =>
  epis.value
    .filter(e => {
      const qtd = Number(e.estoque) || 0;
      const min = Number(e.estoque_minimo) || 0;
      return min > 0 && qtd <= min;
    })
    .sort((a, b) => (Number(a.estoque) || 0) - (Number(b.estoque) || 0))
    .slice(0, 6)
);

// Distribuição de status retiradas
const statusRetiradas = computed(() => {
  const map = { aprovado: 0, pendente: 0, outro: 0 };
  for (const r of retiradas.value) {
    if (r.status === 'aprovado') map.aprovado++;
    else if (r.status === 'pendente') map.pendente++;
    else map.outro++;
  }
  return map;
});
</script>

<template>
  <div class="pagina-dashboard">
    <header class="cabecalho">
      <div>
        <p class="caminho">
          Home <span class="separador">›</span>
          <span class="caminho-atual">Dashboard</span>
        </p>
        <h1 class="titulo-pagina"><span class="titulo-destaque">Dashboard</span> Geral</h1>
        <p class="subtitulo">Visão geral de EPIs, retiradas, setores e vencimentos.</p>
      </div>
      <button type="button" class="botao-recarregar" @click="carregar" :disabled="carregando">
        ↻ Atualizar
      </button>
    </header>

    <p v-if="carregando" class="estado-carregando">Carregando dados...</p>

    <template v-else>
      <!-- KPI cards -->
      <section class="kpi-grid">
        <div class="kpi-card">
          <span class="kpi-label">EPIs cadastrados</span>
          <span class="kpi-valor">{{ totalEpis }}</span>
          <span class="kpi-sub">{{ totalEstoque }} unidades em estoque</span>
        </div>
        <div class="kpi-card">
          <span class="kpi-label">Retiradas totais</span>
          <span class="kpi-valor">{{ totalRetiradas }}</span>
          <span class="kpi-sub">{{ retiradasPendentes }} pendentes de aprovação</span>
        </div>
        <div class="kpi-card kpi-alerta">
          <span class="kpi-label">Estoque baixo</span>
          <span class="kpi-valor">{{ estoqueBaixoCount }}</span>
          <span class="kpi-sub">itens abaixo do mínimo</span>
        </div>
        <div class="kpi-card kpi-aviso">
          <span class="kpi-label">Próximos do vencimento</span>
          <span class="kpi-valor">{{ vencimentoProximoCount }}</span>
          <span class="kpi-sub">{{ vencidos }} já vencido(s)</span>
        </div>
      </section>

      <div class="grid-2col">
        <!-- Top EPIs mais retirados -->
        <section class="card-chart">
          <div class="chart-header">
            <h2>EPIs mais retirados</h2>
            <span class="chart-tag">top 6</span>
          </div>
          <div v-if="topEpisRetirados.length === 0" class="vazio">Nenhuma retirada registrada.</div>
          <div v-else class="barras-h">
            <div v-for="item in topEpisRetirados" :key="item.nome" class="barra-linha">
              <span class="barra-nome">{{ item.nome }}</span>
              <div class="barra-trilho">
                <div class="barra-preenchida" :style="{ width: (item.qtd / maxTopEpi * 100) + '%' }"></div>
              </div>
              <span class="barra-valor">{{ item.qtd }}</span>
            </div>
          </div>
        </section>

        <!-- Retiradas por setor (donut) -->
        <section class="card-chart">
          <div class="chart-header">
            <h2>Retiradas por setor</h2>
            <span class="chart-tag">{{ retiradasPorSetor.length }} setor(es)</span>
          </div>
          <div v-if="retiradasPorSetor.length === 0" class="vazio">Sem dados.</div>
          <div v-else class="donut-wrap">
            <svg viewBox="0 0 200 200" class="donut-svg">
              <circle cx="100" cy="100" r="70" fill="none" stroke="#2a2520" stroke-width="22" />
              <circle
                v-for="(seg, i) in donutSegmentos"
                :key="i"
                cx="100" cy="100" r="70"
                fill="none"
                :stroke="seg.cor"
                stroke-width="22"
                :stroke-dasharray="seg.dasharray"
                :stroke-dashoffset="seg.dashoffset"
                transform="rotate(-90 100 100)"
              />
              <text x="100" y="95" text-anchor="middle" class="donut-num">{{ totalRetiradasSetor }}</text>
              <text x="100" y="115" text-anchor="middle" class="donut-lbl">retiradas</text>
            </svg>
            <ul class="donut-legend">
              <li v-for="seg in donutSegmentos" :key="seg.setor">
                <span class="legend-dot" :style="{ background: seg.cor }"></span>
                <span class="legend-name">{{ seg.setor }}</span>
                <span class="legend-val">{{ seg.qtd }} <small>({{ seg.percentual }}%)</small></span>
              </li>
            </ul>
          </div>
        </section>
      </div>

      <!-- Retiradas por mês -->
      <section class="card-chart">
        <div class="chart-header">
          <h2>Retiradas nos últimos 6 meses</h2>
          <span class="chart-tag">tendência</span>
        </div>
        <div class="grafico-mes">
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" class="grafico-svg">
            <defs>
              <linearGradient id="gradMes" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stop-color="#F49D25" stop-opacity="0.5" />
                <stop offset="100%" stop-color="#F49D25" stop-opacity="0" />
              </linearGradient>
            </defs>
            <polyline
              :points="`0,100 ${linhaMeses} 100,100`"
              fill="url(#gradMes)"
              stroke="none"
            />
            <polyline
              :points="linhaMeses"
              fill="none"
              stroke="#F49D25"
              stroke-width="0.8"
              vector-effect="non-scaling-stroke"
            />
          </svg>
          <div class="grafico-pontos">
            <div v-for="m in retiradasPorMes" :key="m.key" class="ponto-col">
              <span class="ponto-valor">{{ m.qtd }}</span>
              <span class="ponto-label">{{ m.label }}</span>
            </div>
          </div>
        </div>
      </section>

      <div class="grid-2col">
        <!-- EPIs próximos do vencimento -->
        <section class="card-chart">
          <div class="chart-header">
            <h2>EPIs próximos do vencimento</h2>
            <span class="chart-tag chart-tag-aviso">≤ 90 dias</span>
          </div>
          <div v-if="episVencendo.length === 0" class="vazio">Nenhum EPI vencendo em breve.</div>
          <ul v-else class="lista-vencimento">
            <li v-for="e in episVencendo" :key="e.id">
              <div class="venc-info">
                <span class="venc-nome">{{ e.nome }}</span>
                <span class="venc-meta">CA #{{ e.numero_ca || '—' }} · validade {{ formatarData(e.data_validade) }}</span>
              </div>
              <span class="venc-badge" :class="{
                'badge-critico': e.dias < 0,
                'badge-alerta': e.dias >= 0 && e.dias <= 30,
                'badge-medio': e.dias > 30,
              }">
                {{ e.dias < 0 ? `Vencido há ${-e.dias}d` : e.dias === 0 ? 'Vence hoje' : `${e.dias} dias` }}
              </span>
            </li>
          </ul>
        </section>

        <!-- Estoque baixo -->
        <section class="card-chart">
          <div class="chart-header">
            <h2>Itens com estoque baixo</h2>
            <span class="chart-tag chart-tag-alerta">atenção</span>
          </div>
          <div v-if="episEstoqueBaixo.length === 0" class="vazio">Todos com estoque saudável.</div>
          <ul v-else class="lista-vencimento">
            <li v-for="e in episEstoqueBaixo" :key="e.id">
              <div class="venc-info">
                <span class="venc-nome">{{ e.nome }}</span>
                <span class="venc-meta">mínimo {{ e.estoque_minimo }} un. · setor {{ e.setor || '—' }}</span>
              </div>
              <span class="venc-badge badge-critico">{{ e.estoque || 0 }} un.</span>
            </li>
          </ul>
        </section>
      </div>
    </template>
  </div>
</template>

<style scoped>
.pagina-dashboard {
  background: #181511;
  min-height: 100vh;
  color: #fff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  padding: 2rem 3rem 3rem;
  box-sizing: border-box;
  width: 100%;
}
.pagina-dashboard *, .pagina-dashboard *::before, .pagina-dashboard *::after { box-sizing: border-box; }

.cabecalho {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1.5rem;
  margin-bottom: 2rem;
}
.caminho { color: #8b8680; font-size: 0.85rem; margin-bottom: 0.7rem; }
.caminho .separador { margin: 0 0.4rem; }
.caminho-atual { color: #fff; }
.titulo-pagina { font-size: 2.6rem; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 0.4rem; }
.titulo-destaque { color: #F49D25; }
.subtitulo { color: #8b8680; font-size: 0.95rem; }

.botao-recarregar {
  background: rgba(244, 157, 37, 0.12);
  color: #F49D25;
  border: 1px solid rgba(244, 157, 37, 0.4);
  padding: 0.65rem 1.1rem;
  border-radius: 0.55rem;
  font-size: 0.88rem;
  font-weight: 700;
  cursor: pointer;
  margin-top: 0.5rem;
  transition: background 0.2s;
}
.botao-recarregar:hover:not(:disabled) { background: rgba(244, 157, 37, 0.22); }
.botao-recarregar:disabled { opacity: 0.5; cursor: not-allowed; }

.estado-carregando { color: #8b8680; }

/* ---------- KPI ---------- */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}
.kpi-card {
  background: linear-gradient(180deg, #2d2823 0%, #221e18 100%);
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 0.85rem;
  padding: 1.2rem 1.3rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  transition: border-color 0.2s, transform 0.15s;
}
.kpi-card:hover { border-color: rgba(244, 157, 37, 0.3); transform: translateY(-1px); }
.kpi-label {
  color: #F49D25;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.kpi-valor { color: #fff; font-size: 2.2rem; font-weight: 800; letter-spacing: -0.02em; line-height: 1; }
.kpi-sub { color: #8b8680; font-size: 0.78rem; margin-top: 0.2rem; }
.kpi-alerta { border-color: rgba(248, 113, 113, 0.3); }
.kpi-alerta .kpi-label { color: #f87171; }
.kpi-aviso { border-color: rgba(250, 204, 21, 0.3); }
.kpi-aviso .kpi-label { color: #facc15; }

/* ---------- grid 2 colunas ---------- */
.grid-2col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

/* ---------- card chart ---------- */
.card-chart {
  background: #221E18;
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 1rem;
  padding: 1.4rem 1.5rem;
}
.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.3rem;
}
.chart-header h2 { color: #fff; font-size: 1.05rem; font-weight: 700; }
.chart-tag {
  color: #F49D25;
  background: rgba(244, 157, 37, 0.1);
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.25rem 0.7rem;
  border-radius: 999px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.chart-tag-aviso { color: #facc15; background: rgba(250, 204, 21, 0.12); }
.chart-tag-alerta { color: #f87171; background: rgba(248, 113, 113, 0.12); }

.vazio { color: #8b8680; font-size: 0.9rem; padding: 1rem 0; text-align: center; }

/* ---------- barras horizontais ---------- */
.barras-h { display: flex; flex-direction: column; gap: 0.85rem; }
.barra-linha {
  display: grid;
  grid-template-columns: 130px 1fr 40px;
  gap: 0.8rem;
  align-items: center;
}
.barra-nome {
  color: #c5bfb5;
  font-size: 0.85rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.barra-trilho {
  background: #2a2520;
  height: 10px;
  border-radius: 999px;
  overflow: hidden;
}
.barra-preenchida {
  height: 100%;
  background: linear-gradient(90deg, #F49D25, #facc15);
  border-radius: 999px;
  transition: width 0.4s ease;
}
.barra-valor { color: #fff; font-weight: 700; font-size: 0.9rem; text-align: right; }

/* ---------- donut ---------- */
.donut-wrap {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 1.5rem;
  align-items: center;
}
.donut-svg { width: 180px; height: 180px; flex-shrink: 0; }
.donut-num { fill: #fff; font-size: 26px; font-weight: 800; }
.donut-lbl { fill: #8b8680; font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; }
.donut-legend {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  min-width: 0;
}
.donut-legend li {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 0.6rem;
  align-items: center;
  font-size: 0.85rem;
}
.legend-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
.legend-name {
  color: #c5bfb5;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.legend-val { color: #fff; font-weight: 700; }
.legend-val small { color: #8b8680; font-weight: 500; font-size: 0.75rem; }

/* ---------- gráfico mensal ---------- */
.grafico-mes { position: relative; }
.grafico-svg {
  width: 100%;
  height: 180px;
  display: block;
}
.grafico-pontos {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  margin-top: 0.6rem;
}
.ponto-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
}
.ponto-valor { color: #fff; font-size: 0.95rem; font-weight: 700; }
.ponto-label {
  color: #8b8680;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

/* ---------- lista vencimento / estoque baixo ---------- */
.lista-vencimento {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}
.lista-vencimento li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.8rem;
  background: #2a2520;
  border: 1px solid rgba(255,255,255,0.04);
  border-radius: 0.55rem;
  padding: 0.7rem 0.95rem;
}
.venc-info { display: flex; flex-direction: column; gap: 0.15rem; min-width: 0; }
.venc-nome {
  color: #fff;
  font-weight: 700;
  font-size: 0.92rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.venc-meta { color: #8b8680; font-size: 0.75rem; }
.venc-badge {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.3rem 0.7rem;
  border-radius: 999px;
  white-space: nowrap;
  flex-shrink: 0;
}
.badge-critico {
  background: rgba(248, 113, 113, 0.15);
  color: #f87171;
  border: 1px solid rgba(248, 113, 113, 0.35);
}
.badge-alerta {
  background: rgba(250, 204, 21, 0.12);
  color: #facc15;
  border: 1px solid rgba(250, 204, 21, 0.35);
}
.badge-medio {
  background: rgba(244, 157, 37, 0.12);
  color: #F49D25;
  border: 1px solid rgba(244, 157, 37, 0.3);
}

/* ---------- responsivo ---------- */
@media (max-width: 1100px) {
  .kpi-grid { grid-template-columns: repeat(2, 1fr); }
  .grid-2col { grid-template-columns: 1fr; }
  .donut-wrap { grid-template-columns: 1fr; }
  .donut-svg { margin: 0 auto; }
}
@media (max-width: 600px) {
  .pagina-dashboard { padding: 1.5rem 1.2rem 2rem; }
  .titulo-pagina { font-size: 1.8rem; }
  .kpi-grid { grid-template-columns: 1fr; }
  .barra-linha { grid-template-columns: 90px 1fr 35px; }
}
</style>
