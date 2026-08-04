<script setup>
import { ref, computed, onMounted } from 'vue';
import { useSupabase } from '../composables/useSupabase';
import { formatarData, diasAte } from '../composables/datas';

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

const diasAteVencer = diasAte;

const totalEpis = computed(() => epis.value.length);
const totalEstoque = computed(() =>
  epis.value.reduce((s, e) => s + (Number(e.estoque) || 0), 0)
);
const totalRetiradas = computed(() => retiradas.value.length);
const PENDENTES = ['pendente_aprovacao', 'pendente_entrega', 'aprovado'];
const retiradasPendentes = computed(() =>
  retiradas.value.filter(r => PENDENTES.includes(r.status)).length
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

// Paleta categórica do gráfico: são dados, não superfície de UI, por isso ficam
// literais aqui. Começa na cor da marca e segue por matizes distinguíveis.
const paletteCores = ['#f49d25', '#facc15', '#4ade80', '#60a5fa', '#c084fc', '#f87171', '#fb923c', '#34d399'];

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

// 12 itens: a barra anima `width` (ver comentário no CSS), e o painel já tem
// altura máxima com rolagem — passar disso só custava layout fora da tela.
const LIMITE_BARRAS = 12;
const estoquePorEpi = computed(() =>
  epis.value
    .map(e => ({
      nome: e.nome || '—',
      estoque: Number(e.estoque) || 0,
      minimo: Number(e.estoque_minimo) || 0,
      baixo: (Number(e.estoque_minimo) || 0) > 0 && (Number(e.estoque) || 0) <= (Number(e.estoque_minimo) || 0),
    }))
    .sort((a, b) => b.estoque - a.estoque)
    .slice(0, LIMITE_BARRAS)
);
const epiOcultos = computed(() => Math.max(0, epis.value.length - LIMITE_BARRAS));
const maxEstoque = computed(() =>
  estoquePorEpi.value.reduce((m, e) => Math.max(m, e.estoque), 0) || 1
);

const episVencendo = computed(() => {
  return epis.value
    .map(e => ({ ...e, dias: diasAteVencer(e.data_validade) }))
    .filter(e => e.dias !== null && e.dias <= 90)
    .sort((a, b) => a.dias - b.dias)
    .slice(0, 8);
});

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

</script>

<template>
  <div class="pagina-dashboard">
    <header class="cabecalho">
      <div>
        <p class="caminho">
          Análise <span class="separador">›</span>
          <span class="caminho-atual">Dashboard</span>
        </p>
        <h1 class="titulo-pagina"><span class="titulo-destaque">Dashboard</span> Geral</h1>
        <p class="subtitulo">Visão geral de EPIs, retiradas, setores e vencimentos.</p>
      </div>
      <button type="button" class="botao-recarregar" @click="carregar" :disabled="carregando">
        ↻ Atualizar
      </button>
    </header>

    <p v-if="carregando" class="estado-carregando" role="status">Carregando dados…</p>

    <template v-else>
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
        <section class="card-chart">
          <div class="chart-header">
            <h2>EPIs mais retirados</h2>
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

        <section class="card-chart">
          <div class="chart-header">
            <h2>Retiradas por setor</h2>
            <span class="chart-tag">{{ retiradasPorSetor.length }} setor(es)</span>
          </div>
          <div v-if="retiradasPorSetor.length === 0" class="vazio">Sem dados.</div>
          <div v-else class="donut-wrap">
            <!-- a legenda ao lado já traz setor, quantidade e percentual em
                 texto, então o desenho é redundante para leitor de tela -->
            <svg viewBox="0 0 200 200" class="donut-svg" aria-hidden="true">
              <circle cx="100" cy="100" r="70" fill="none" stroke="var(--borda)" stroke-width="22" />
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

      <section class="card-chart">
        <div class="chart-header">
          <h2>Estoque atual por EPI</h2>
          <span class="chart-tag">{{ totalEstoque }} un. no total</span>
        </div>
        <p v-if="epiOcultos > 0" class="chart-nota">
          Mostrando os {{ estoquePorEpi.length }} maiores · mais {{ epiOcultos }} EPI(s) no estoque.
        </p>
        <div v-if="estoquePorEpi.length === 0" class="vazio">Nenhum EPI cadastrado.</div>
        <div v-else class="barras-estoque">
          <div v-for="item in estoquePorEpi" :key="item.nome" class="barra-est-linha">
            <span class="barra-est-nome">{{ item.nome }}</span>
            <div class="barra-est-trilho">
              <div
                class="barra-est-preenchida"
                :class="{ 'barra-est-baixo': item.baixo }"
                :style="{ width: Math.max(2, item.estoque / maxEstoque * 100) + '%' }"
              ></div>
            </div>
            <span class="barra-est-valor" :class="{ 'valor-baixo': item.baixo }">
              {{ item.estoque }}
              <small v-if="item.minimo">/ mín {{ item.minimo }}</small>
            </span>
          </div>
        </div>
      </section>

      <div class="grid-2col">
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
  background: var(--superficie-alta);
  min-height: 100vh;
  color: var(--texto-forte);
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
.caminho { color: var(--texto-suave); font-size: 0.85rem; margin-bottom: 0.7rem; }
.caminho .separador { margin: 0 0.4rem; }
.caminho-atual { color: var(--texto-forte); }
.titulo-pagina { font-size: 2.6rem; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 0.4rem; }
.titulo-destaque { color: var(--marca); }
.subtitulo { color: var(--texto-suave); font-size: 0.95rem; }

.botao-recarregar {
  min-height: 2.75rem;
  background: color-mix(in srgb, var(--marca) 12%, transparent);
  color: var(--marca);
  border: 1px solid color-mix(in srgb, var(--marca) 40%, transparent);
  padding: 0.65rem 1.1rem;
  border-radius: var(--raio-sm);
  font-size: 0.88rem;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  margin-top: 0.5rem;
  white-space: nowrap;
  flex-shrink: 0;
  transition: background 0.2s;
}

.chart-nota {
  color: var(--texto-fraco);
  font-size: 0.78rem;
  margin: -0.7rem 0 1rem;
}
.botao-recarregar:hover:not(:disabled) { background: color-mix(in srgb, var(--marca) 22%, transparent); }
.botao-recarregar:disabled { opacity: 0.5; cursor: not-allowed; }

.estado-carregando { color: var(--texto-suave); }

.kpi-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}
.kpi-card {
  background: linear-gradient(180deg, var(--borda) 0%, var(--superficie-elevada) 100%);
  border: 1px solid color-mix(in srgb, var(--texto-forte) 5%, transparent);
  border-radius: 0.85rem;
  padding: 1.2rem 1.3rem;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  transition: border-color 0.2s, transform 0.15s;
}
.kpi-card:hover { border-color: color-mix(in srgb, var(--marca) 30%, transparent); transform: translateY(-1px); }
.kpi-label {
  color: var(--marca);
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.kpi-valor { color: var(--texto-forte); font-size: 2.2rem; font-weight: 800; letter-spacing: -0.02em; line-height: 1; }
.kpi-sub { color: var(--texto-suave); font-size: 0.78rem; margin-top: 0.2rem; }
.kpi-alerta { border-color: color-mix(in srgb, var(--perigo) 30%, transparent); }
.kpi-alerta .kpi-label { color: var(--perigo); }
.kpi-aviso { border-color: color-mix(in srgb, var(--aviso) 30%, transparent); }
.kpi-aviso .kpi-label { color: var(--aviso); }

.grid-2col {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.card-chart {
  background: var(--superficie-elevada);
  border: 1px solid color-mix(in srgb, var(--texto-forte) 5%, transparent);
  border-radius: 1rem;
  padding: 1.4rem 1.5rem;
  margin-bottom: 1.5rem;
}
.grid-2col .card-chart { margin-bottom: 0; }
.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.3rem;
}
.chart-header h2 { color: var(--texto-forte); font-size: 1.05rem; font-weight: 700; }
.chart-tag {
  color: var(--marca);
  background: color-mix(in srgb, var(--marca) 10%, transparent);
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.25rem 0.7rem;
  border-radius: 999px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.chart-tag-aviso { color: var(--aviso); background: color-mix(in srgb, var(--aviso) 12%, transparent); }
.chart-tag-alerta { color: var(--perigo); background: color-mix(in srgb, var(--perigo) 12%, transparent); }

.vazio { color: var(--texto-suave); font-size: 0.9rem; padding: 1rem 0; text-align: center; }

.barras-h { display: flex; flex-direction: column; gap: 0.85rem; }
.barra-linha {
  display: grid;
  grid-template-columns: 130px 1fr 40px;
  gap: 0.8rem;
  align-items: center;
}
.barra-nome {
  color: var(--texto);
  font-size: 0.85rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.barra-trilho {
  background: var(--borda);
  height: 10px;
  border-radius: 999px;
  overflow: hidden;
}
.barra-preenchida {
  height: 100%;
  background: linear-gradient(90deg, var(--marca), var(--aviso));
  border-radius: 999px;
  /* barra: anima largura de propósito — scaleX achataria as pontas arredondadas.
     Dispara uma vez, e as listas são fatiadas para no máximo 12 elementos. */
  transition: width 0.4s ease;
}
.barra-valor { color: var(--texto-forte); font-weight: 700; font-size: 0.9rem; text-align: right; }

.donut-wrap {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 1.5rem;
  align-items: center;
}
.donut-svg { width: 180px; height: 180px; flex-shrink: 0; }
.donut-num { fill: var(--texto-forte); font-size: 26px; font-weight: 800; }
.donut-lbl { fill: var(--texto-suave); font-size: 10px; text-transform: uppercase; letter-spacing: 0.1em; }
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
  color: var(--texto);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.legend-val { color: var(--texto-forte); font-weight: 700; }
.legend-val small { color: var(--texto-suave); font-weight: 500; font-size: 0.75rem; }

.barras-estoque {
  display: flex;
  flex-direction: column;
  gap: 0.85rem;
  max-height: 360px;
  overflow-y: auto;
}
.barra-est-linha {
  display: grid;
  grid-template-columns: 150px 1fr 90px;
  gap: 0.8rem;
  align-items: center;
}
.barra-est-nome {
  color: var(--texto);
  font-size: 0.85rem;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.barra-est-trilho {
  background: var(--borda);
  height: 12px;
  border-radius: 999px;
  overflow: hidden;
}
.barra-est-preenchida {
  height: 100%;
  background: linear-gradient(90deg, var(--ok), var(--ok));
  border-radius: 999px;
  /* barra: anima largura de propósito — scaleX achataria as pontas arredondadas.
     Dispara uma vez, e as listas são fatiadas para no máximo 12 elementos. */
  transition: width 0.4s ease;
}
.barra-est-baixo {
  background: linear-gradient(90deg, var(--perigo), var(--aviso));
}
.barra-est-valor {
  color: var(--texto-forte);
  font-weight: 700;
  font-size: 0.9rem;
  text-align: right;
}
.barra-est-valor small { color: var(--texto-suave); font-weight: 500; font-size: 0.72rem; }
.valor-baixo { color: var(--perigo); }

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
  background: var(--borda);
  border: 1px solid color-mix(in srgb, var(--texto-forte) 4%, transparent);
  border-radius: 0.55rem;
  padding: 0.7rem 0.95rem;
}
.venc-info { display: flex; flex-direction: column; gap: 0.15rem; min-width: 0; }
.venc-nome {
  color: var(--texto-forte);
  font-weight: 700;
  font-size: 0.92rem;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.venc-meta { color: var(--texto-suave); font-size: 0.75rem; }
.venc-badge {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.3rem 0.7rem;
  border-radius: 999px;
  white-space: nowrap;
  flex-shrink: 0;
}
.badge-critico {
  background: color-mix(in srgb, var(--perigo) 15%, transparent);
  color: var(--perigo);
  border: 1px solid color-mix(in srgb, var(--perigo) 35%, transparent);
}
.badge-alerta {
  background: color-mix(in srgb, var(--aviso) 12%, transparent);
  color: var(--aviso);
  border: 1px solid color-mix(in srgb, var(--aviso) 35%, transparent);
}
.badge-medio {
  background: color-mix(in srgb, var(--marca) 12%, transparent);
  color: var(--marca);
  border: 1px solid color-mix(in srgb, var(--marca) 30%, transparent);
}

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
  .barra-est-linha { grid-template-columns: 90px 1fr 70px; }
}
</style>
