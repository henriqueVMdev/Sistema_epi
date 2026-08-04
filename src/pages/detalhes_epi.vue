<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useSupabase } from '../composables/useSupabase';
import { formatarData } from '../composables/datas';

const { supabase } = useSupabase();
const route = useRoute();
const router = useRouter();

const epi = ref(null);
const carregando = ref(true);
const erro = ref(null);
const entregas = ref([]);

const entregasAprovadas = computed(() =>
  entregas.value.filter(e => (e.status || 'aprovado') === 'aprovado')
);

const totalUnidades = computed(() =>
  entregasAprovadas.value.reduce((s, e) => s + (Number(e.quantidade) || 0), 0)
);

const totalRetiradas = computed(() => entregasAprovadas.value.length);

const totalPessoas = computed(() =>
  new Set(entregasAprovadas.value.map(e => e.nome_retirada)).size
);

const totalSetores = computed(() =>
  new Set(entregasAprovadas.value.map(e => e.setor_retirada).filter(Boolean)).size
);

// 12 barras: cada uma anima `width` (ver comentário no CSS). O corte é o que
// mantém essa escolha barata — sem ele, um EPI usado por 80 pessoas animava 80.
const LIMITE_BARRAS = 12;

const agruparPor = (chave) => {
  const mapa = {};
  for (const e of entregasAprovadas.value) {
    const k = e[chave] || '—';
    mapa[k] = (mapa[k] || 0) + (Number(e.quantidade) || 0);
  }
  const total = Object.values(mapa).reduce((s, n) => s + n, 0) || 1;
  return Object.entries(mapa)
    .map(([nome, qtd]) => ({ nome, qtd, pct: Math.round((qtd / total) * 100) }))
    .sort((a, b) => b.qtd - a.qtd)
    .slice(0, LIMITE_BARRAS);
};

const porSetor = computed(() => agruparPor('setor_retirada'));
const porUsuario = computed(() => agruparPor('nome_retirada'));

const historicoRecente = computed(() =>
  [...entregas.value]
    .sort((a, b) => new Date(b.data_entrega) - new Date(a.data_entrega))
    .slice(0, 8)
);

const carregarEntregas = async (nomeEpi) => {
  const { data, error } = await supabase
    .from('entrega_epi')
    .select('*')
    .eq('nome_epi', nomeEpi)
    .order('data_entrega', { ascending: false });
  if (error) {
    console.error(error);
    return;
  }
  entregas.value = data || [];
};

const carregar = async () => {
  carregando.value = true;
  const { data, error } = await supabase
    .from('epis')
    .select('*')
    .eq('id', route.params.id)
    .single();

  if (error) {
    erro.value = error.message;
    console.error(error);
  } else {
    epi.value = data;
    await carregarEntregas(data.nome);
  }
  carregando.value = false;
};

const voltar = () => router.push('/estoque');

onMounted(carregar);
</script>

<template>
  <div class="pagina-detalhes">
    <header class="cabecalho">
      <div>
        <p class="caminho">
          Estoque &amp; EPIs <span class="separador">›</span>
          <button type="button" @click="voltar" class="caminho-clicavel">Estoque</button>
          <span class="separador">›</span>
          <span class="caminho-atual">Detalhes do EPI</span>
        </p>
        <h1 class="titulo-pagina">
          Detalhes do <span class="titulo-destaque">EPI</span>
        </h1>
      </div>

      <button type="button" class="botao-voltar" @click="voltar">
        ← Voltar para Estoque
      </button>
    </header>

    <p v-if="carregando" class="estado">Carregando...</p>
    <p v-else-if="erro" class="estado erro">Erro: {{ erro }}</p>
    <p v-else-if="!epi" class="estado">EPI não encontrado.</p>

    <section v-else class="detalhes">
      <div class="bloco-imagem">
        <img loading="lazy" decoding="async" v-if="epi.imagem" :src="epi.imagem" :alt="epi.nome" />
        <div v-else class="imagem-placeholder">Sem imagem</div>
      </div>

      <div class="bloco-info">
        <h2 class="epi-nome">{{ epi.nome }}</h2>
        <p class="epi-fabricante">Fabricante: <span>{{ epi.fabricante || '—' }}</span></p>

        <div class="estoque-destaque" :class="{ alerta: Number(epi.estoque) <= Number(epi.estoque_minimo) && Number(epi.estoque_minimo) > 0 }">
          <span class="estoque-label">Em estoque</span>
          <span class="estoque-numero">{{ epi.estoque || 0 }}</span>
          <span class="estoque-minimo">mín. {{ epi.estoque_minimo || 0 }} un.</span>
        </div>

        <div class="grade-info">
          <div class="campo">
            <span class="label">Número do CA</span>
            <span class="valor">#{{ epi.numero_ca || '—' }}</span>
          </div>
          <div class="campo">
            <span class="label">Data de validade</span>
            <span class="valor">{{ formatarData(epi.data_validade) }}</span>
          </div>
          <div class="campo">
            <span class="label">Custo</span>
            <span class="valor">R$ {{ epi.custo || '—' }}</span>
          </div>
          <div class="campo">
            <span class="label">Setor de uso</span>
            <span class="valor">{{ epi.setor || '—' }}</span>
          </div>
        </div>

        <div class="campo descricao">
          <span class="label">Descrição</span>
          <p class="valor-texto">{{ epi.descricao || 'Sem descrição cadastrada.' }}</p>
        </div>
      </div>
    </section>

    <section v-if="epi" class="dashboards">
      <h2 class="dash-titulo">Onde este <span class="titulo-destaque">EPI</span> está sendo usado</h2>

      <div class="cards-resumo">
        <div class="card-resumo">
          <span class="card-label">Unidades entregues</span>
          <span class="card-numero">{{ totalUnidades }}</span>
        </div>
        <div class="card-resumo">
          <span class="card-label">Retiradas</span>
          <span class="card-numero">{{ totalRetiradas }}</span>
        </div>
        <div class="card-resumo">
          <span class="card-label">Colaboradores</span>
          <span class="card-numero">{{ totalPessoas }}</span>
        </div>
        <div class="card-resumo">
          <span class="card-label">Setores</span>
          <span class="card-numero">{{ totalSetores }}</span>
        </div>
      </div>

      <div class="grade-graficos">
        <div class="painel">
          <h3 class="painel-titulo">Uso por setor</h3>
          <p v-if="!porSetor.length" class="painel-vazio">Sem entregas registradas.</p>
          <ul v-else class="lista-barras">
            <li v-for="item in porSetor" :key="'s-' + item.nome" class="barra-item">
              <div class="barra-info">
                <span class="barra-nome">{{ item.nome }}</span>
                <span class="barra-valor">{{ item.qtd }} un. · {{ item.pct }}%</span>
              </div>
              <div class="barra-trilho">
                <div class="barra-preenchida" :style="{ width: item.pct + '%' }"></div>
              </div>
            </li>
          </ul>
        </div>

        <div class="painel">
          <h3 class="painel-titulo">Uso por colaborador</h3>
          <p v-if="!porUsuario.length" class="painel-vazio">Sem entregas registradas.</p>
          <ul v-else class="lista-barras">
            <li v-for="item in porUsuario" :key="'u-' + item.nome" class="barra-item">
              <div class="barra-info">
                <span class="barra-nome">{{ item.nome }}</span>
                <span class="barra-valor">{{ item.qtd }} un. · {{ item.pct }}%</span>
              </div>
              <div class="barra-trilho">
                <div class="barra-preenchida alt" :style="{ width: item.pct + '%' }"></div>
              </div>
            </li>
          </ul>
        </div>
      </div>

      <div class="painel">
        <h3 class="painel-titulo">Histórico recente</h3>
        <p v-if="!historicoRecente.length" class="painel-vazio">Nenhuma retirada deste EPI até o momento.</p>
        <ul v-else class="lista-historico">
          <li v-for="r in historicoRecente" :key="r.id" class="hist-item">
            <div class="hist-esq">
              <span class="hist-nome">{{ r.nome_retirada }}</span>
              <span class="hist-setor">Setor: {{ r.setor_retirada || '—' }}</span>
            </div>
            <div class="hist-dir">
              <span class="hist-qtd">{{ r.quantidade }} un.</span>
              <span class="hist-data">{{ formatarData(r.data_entrega) }}</span>
              <span class="hist-status" :class="'status-' + (r.status || 'aprovado')">
                {{ r.status || 'aprovado' }}
              </span>
            </div>
          </li>
        </ul>
      </div>
    </section>
  </div>
</template>

<style scoped>
.pagina-detalhes {
  background: var(--superficie-alta);
  min-height: 100vh;
  color: var(--texto-forte);
  padding: 2rem 3rem;
  box-sizing: border-box;
  width: 100%;
}

.cabecalho {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1.5rem;
  margin-bottom: 2.5rem;
}

.caminho { color: var(--texto-suave); font-size: 0.85rem; margin-bottom: 0.7rem; }
.caminho .separador { margin: 0 0.4rem; }
.caminho-atual { color: var(--texto-forte); }
.caminho-clicavel { cursor: pointer; background: none; border: none; padding: 0; font: inherit; color: inherit; transition: color 0.2s; }
.caminho-clicavel:hover { color: var(--marca); }

.titulo-pagina {
  font-size: 2.6rem;
  font-weight: 800;
  letter-spacing: -0.02em;
}
.titulo-destaque { color: var(--marca); }

.botao-voltar {
  background: var(--borda);
  color: var(--texto-forte);
  border: 1px solid var(--borda-forte);
  padding: 0.7rem 1.2rem;
  border-radius: 0.55rem;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 0.5rem;
  transition: background 0.2s;
}
.botao-voltar:hover { background: var(--borda-forte); }

.estado { color: var(--texto-suave); }
.estado.erro { color: var(--perigo); }

.detalhes {
  display: grid;
  grid-template-columns: 320px 1fr;
  gap: 2rem;
  background: var(--superficie-elevada);
  border: 1px solid color-mix(in srgb, var(--texto-forte) 5%, transparent);
  border-radius: 1rem;
  padding: 2rem;
}

.bloco-imagem {
  background: var(--borda);
  border-radius: 0.85rem;
  overflow: hidden;
  aspect-ratio: 1 / 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
.bloco-imagem img { width: 100%; height: 100%; object-fit: cover; }
.imagem-placeholder { color: var(--texto-fraco); font-size: 0.9rem; }

.bloco-info { display: flex; flex-direction: column; gap: 1.4rem; }

.epi-nome {
  font-size: 2rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--texto-forte);
}
.epi-fabricante { color: var(--texto-suave); font-size: 0.95rem; margin-top: -0.8rem; }
.epi-fabricante span { color: var(--texto); font-weight: 600; }

.estoque-destaque {
  display: inline-flex;
  flex-direction: column;
  background: color-mix(in srgb, var(--marca) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--marca) 25%, transparent);
  border-radius: 0.75rem;
  padding: 1rem 1.4rem;
  align-self: flex-start;
  min-width: 180px;
}
.estoque-destaque.alerta {
  background: rgba(220, 60, 60, 0.1);
  border-color: rgba(220, 60, 60, 0.4);
}
.estoque-label {
  color: var(--marca);
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.estoque-destaque.alerta .estoque-label { color: var(--perigo); }
.estoque-numero {
  color: var(--texto-forte);
  font-size: 3rem;
  font-weight: 800;
  line-height: 1;
  margin: 0.3rem 0 0.2rem;
}
.estoque-destaque.alerta .estoque-numero { color: var(--perigo); }
.estoque-minimo { color: var(--texto-suave); font-size: 0.8rem; }

.grade-info {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem 1.5rem;
}

.campo { display: flex; flex-direction: column; gap: 0.25rem; }
.label {
  color: var(--marca);
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.valor { color: var(--texto-forte); font-size: 1rem; font-weight: 500; }
.valor-texto {
  color: var(--texto);
  font-size: 0.95rem;
  line-height: 1.65;
  background: var(--borda);
  padding: 0.9rem 1.1rem;
  border-radius: 0.6rem;
  border: 1px solid color-mix(in srgb, var(--texto-forte) 4%, transparent);
}

.dashboards {
  margin-top: 2.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.dash-titulo {
  font-size: 1.6rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  margin: 0 0 0.3rem;
}

.cards-resumo {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
}

.card-resumo {
  background: var(--superficie-elevada);
  border: 1px solid color-mix(in srgb, var(--marca) 20%, transparent);
  border-radius: 0.85rem;
  padding: 1.1rem 1.3rem;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.card-label {
  color: var(--marca);
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.card-numero {
  color: var(--texto-forte);
  font-size: 2rem;
  font-weight: 800;
  line-height: 1;
}

.grade-graficos {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
}

.painel {
  background: var(--superficie-elevada);
  border: 1px solid color-mix(in srgb, var(--texto-forte) 5%, transparent);
  border-radius: 1rem;
  padding: 1.5rem;
}
.painel-titulo {
  font-size: 1.05rem;
  font-weight: 700;
  color: var(--texto-forte);
  margin: 0 0 1rem;
}
.painel-vazio { color: var(--texto-suave); font-size: 0.9rem; }

.lista-barras { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.85rem; }
.barra-item { display: flex; flex-direction: column; gap: 0.35rem; }
.barra-info { display: flex; justify-content: space-between; font-size: 0.85rem; }
.barra-nome { color: var(--texto-forte); font-weight: 600; }
.barra-valor { color: var(--texto-suave); }
.barra-trilho {
  background: var(--borda);
  border-radius: 999px;
  height: 8px;
  overflow: hidden;
}
.barra-preenchida {
  height: 100%;
  background: linear-gradient(90deg, var(--marca), var(--marca-clara));
  border-radius: 999px;
  /* barra: anima largura de propósito — scaleX achataria as pontas arredondadas.
     Dispara uma vez, em no máximo 8 elementos. */
  transition: width 0.4s ease;
}
.barra-preenchida.alt {
  background: linear-gradient(90deg, var(--info), var(--info));
}

.lista-historico { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.6rem; }
.hist-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: var(--borda);
  border: 1px solid color-mix(in srgb, var(--texto-forte) 4%, transparent);
  border-radius: 0.6rem;
  padding: 0.75rem 1rem;
  gap: 1rem;
}
.hist-esq { display: flex; flex-direction: column; gap: 0.15rem; }
.hist-nome { color: var(--texto-forte); font-weight: 600; font-size: 0.95rem; }
.hist-setor { color: var(--texto-suave); font-size: 0.8rem; }
.hist-dir { display: flex; align-items: center; gap: 0.9rem; }
.hist-qtd { color: var(--marca); font-weight: 700; font-size: 0.9rem; }
.hist-data { color: var(--texto); font-size: 0.85rem; }
.hist-status {
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.2rem 0.55rem;
  border-radius: 999px;
}
.status-aprovado { background: color-mix(in srgb, var(--ok) 12%, transparent); color: var(--ok); }
.status-pendente { background: color-mix(in srgb, var(--marca) 15%, transparent); color: var(--marca); }
.status-recusado { background: color-mix(in srgb, var(--perigo) 12%, transparent); color: var(--perigo); }

@media (max-width: 900px) {
  .detalhes { grid-template-columns: 1fr; }
  .grade-info { grid-template-columns: 1fr; }
  .cards-resumo { grid-template-columns: repeat(2, 1fr); }
  .grade-graficos { grid-template-columns: 1fr; }
  .hist-item { flex-direction: column; align-items: flex-start; }
}
</style>
