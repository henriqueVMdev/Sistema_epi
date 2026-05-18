<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useSupabase } from '../composables/useSupabase';

const { supabase } = useSupabase();

const funcionarios = ref([]);
const epis = ref([]);
const retiradas = ref([]);
const funcionarioId = ref('');
const carregando = ref(false);
const mensagem = ref(null);

const selecionados = ref({});

const mostrarMensagem = (tipo, texto) => {
  mensagem.value = { tipo, texto };
  setTimeout(() => { mensagem.value = null; }, 4000);
};

const formatarData = (data) => {
  if (!data) return '—';
  const d = new Date(data);
  if (isNaN(d.getTime())) return data;
  return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

const funcionario = computed(() =>
  funcionarios.value.find(f => String(f.id) === String(funcionarioId.value)) || null
);

const episDisponiveis = computed(() => {
  if (!funcionario.value) return [];
  return epis.value.filter(e => Number(e.estoque) > 0);
});

const epiDoSetor = (epi) => {
  if (!funcionario.value || !epi.setor) return false;
  const setorFunc = (funcionario.value.setor || '').trim().toLowerCase();
  const setores = String(epi.setor).split(',').map(s => s.trim().toLowerCase());
  return setores.includes(setorFunc);
};

const precisaAprovacao = (epi) => {
  const qtd = selecionados.value[epi.id] || 0;
  return !epiDoSetor(epi) || qtd > 1;
};

const carregarFuncionarios = async () => {
  const { data, error } = await supabase
    .from('funcionarios')
    .select('id, nome, setor')
    .order('nome');
  if (error) console.error(error);
  funcionarios.value = data || [];
};

const carregarEpis = async () => {
  const { data, error } = await supabase.from('epis').select('*').order('nome');
  if (error) console.error(error);
  epis.value = data || [];
};

const carregarRetiradas = async () => {
  if (!funcionario.value) {
    retiradas.value = [];
    return;
  }
  const { data, error } = await supabase
    .from('entrega_epi')
    .select('*')
    .eq('nome_retirada', funcionario.value.nome)
    .order('data_entrega', { ascending: false });
  if (error) console.error(error);
  retiradas.value = data || [];
};

watch(funcionarioId, async () => {
  selecionados.value = {};
  await carregarRetiradas();
});

const toggleSelecao = (epi) => {
  if (selecionados.value[epi.id] !== undefined) {
    delete selecionados.value[epi.id];
  } else {
    selecionados.value[epi.id] = 1;
  }
};

const ajustarQtd = (epi, delta) => {
  const atual = selecionados.value[epi.id] || 0;
  const novo = Math.max(1, Math.min(Number(epi.estoque) || 0, atual + delta));
  selecionados.value[epi.id] = novo;
};

const totalSelecionados = computed(() => Object.keys(selecionados.value).length);

const totalPendentes = computed(() => {
  return Object.keys(selecionados.value).filter(id => {
    const epi = epis.value.find(e => String(e.id) === String(id));
    return epi && precisaAprovacao(epi);
  }).length;
});

const solicitarRetirada = async () => {
  if (!funcionario.value) {
    mostrarMensagem('erro', 'Selecione um funcionário.');
    return;
  }
  const ids = Object.keys(selecionados.value);
  if (ids.length === 0) {
    mostrarMensagem('erro', 'Selecione ao menos um EPI.');
    return;
  }

  carregando.value = true;
  const dataAgora = new Date().toISOString();

  let qtdAprovadas = 0;
  let qtdPendentes = 0;

  for (const id of ids) {
    const epi = epis.value.find(e => String(e.id) === String(id));
    const qtd = selecionados.value[id];
    const requerAprovacao = precisaAprovacao(epi);

    const { error: errInsert } = await supabase.from('entrega_epi').insert({
      data_entrega: dataAgora,
      nome_retirada: funcionario.value.nome,
      setor_retirada: funcionario.value.setor,
      status: requerAprovacao ? 'pendente' : 'aprovado',
    });
    if (errInsert) {
      console.error(errInsert);
      mostrarMensagem('erro', 'Erro ao registrar retirada. Verifique se a coluna "status" existe em entrega_epi.');
      carregando.value = false;
      return;
    }

    if (!requerAprovacao) {
      const novoEstoque = Math.max(0, (Number(epi.estoque) || 0) - qtd);
      await supabase.from('epis').update({ estoque: novoEstoque }).eq('id', epi.id);
      qtdAprovadas++;
    } else {
      qtdPendentes++;
    }
  }

  selecionados.value = {};
  await carregarEpis();
  await carregarRetiradas();
  carregando.value = false;

  const partes = [];
  if (qtdAprovadas) partes.push(`${qtdAprovadas} retirada(s) aprovada(s)`);
  if (qtdPendentes) partes.push(`${qtdPendentes} aguardando aprovação`);
  mostrarMensagem('sucesso', partes.join(' • ') || 'Retirada registrada!');
};

onMounted(async () => {
  await carregarFuncionarios();
  await carregarEpis();
});
</script>

<template>
  <div class="pagina-retirada">
    <header class="cabecalho">
      <div>
        <p class="caminho">
          Home <span class="separador">›</span>
          <span class="caminho-atual">Retirada de EPIs</span>
        </p>
        <h1 class="titulo-pagina">Retirada de <span class="titulo-destaque">EPIs</span></h1>
        <p class="subtitulo">Selecione um funcionário para ver os EPIs disponíveis e solicitar a retirada.</p>
      </div>
    </header>

    <div v-if="mensagem" :class="['toast', 'toast-' + mensagem.tipo]">
      {{ mensagem.texto }}
    </div>

    <section class="cartao">
      <div class="cartao-cabecalho"><h2>Funcionário</h2></div>
      <div class="campo">
        <label for="funcionario">Quem está retirando?</label>
        <div class="select-wrapper">
          <select id="funcionario" v-model="funcionarioId">
            <option value="" disabled>Selecione um funcionário</option>
            <option v-for="f in funcionarios" :key="f.id" :value="f.id">
              {{ f.nome }} — {{ f.setor }}
            </option>
          </select>
        </div>
      </div>
    </section>

    <section v-if="funcionario" class="cartao">
      <div class="cartao-cabecalho">
        <h2>EPIs disponíveis</h2>
        <span class="contagem">{{ episDisponiveis.length }} item(ns)</span>
      </div>

      <div class="legenda">
        <span class="legenda-item"><span class="dot dot-setor"></span> Do seu setor (retirada direta, 1 unid.)</span>
        <span class="legenda-item"><span class="dot dot-outro"></span> Outro setor / mais de 1 unid. (necessita aprovação)</span>
      </div>

      <p v-if="episDisponiveis.length === 0" class="vazio">
        Nenhum EPI disponível no momento.
      </p>

      <div v-else class="grade-epis">
        <div
          v-for="epi in episDisponiveis"
          :key="epi.id"
          class="card-epi"
          :class="{
            selecionado: selecionados[epi.id] !== undefined,
            'card-outro-setor': !epiDoSetor(epi),
            'precisa-aprovacao': selecionados[epi.id] !== undefined && precisaAprovacao(epi)
          }"
          @click="toggleSelecao(epi)"
        >
          <div class="card-imagem">
            <img v-if="epi.imagem" :src="epi.imagem" :alt="epi.nome" />
            <div v-else class="imagem-placeholder"></div>
          </div>

          <div class="card-info">
            <div class="info-topo">
              <p class="epi-nome">{{ epi.nome }}</p>
              <span v-if="epiDoSetor(epi)" class="badge badge-setor">Seu setor</span>
              <span v-else class="badge badge-outro">Aprovação</span>
            </div>
            <p class="epi-meta">{{ epi.fabricante || '—' }} · CA #{{ epi.numero_ca || '—' }}</p>
            <p class="epi-estoque">{{ epi.estoque }} unid. em estoque</p>
          </div>

          <div v-if="selecionados[epi.id] !== undefined" class="card-controles" @click.stop>
            <button class="btn-qtd" @click="ajustarQtd(epi, -1)">−</button>
            <span class="qtd-valor">{{ selecionados[epi.id] }}</span>
            <button class="btn-qtd" @click="ajustarQtd(epi, 1)">+</button>
          </div>

          <div v-else class="card-marca">
            <span class="circulo-vazio"></span>
          </div>
        </div>
      </div>

      <div class="barra-acao" v-if="totalSelecionados > 0">
        <div class="acao-resumo">
          <span class="acao-info">{{ totalSelecionados }} EPI(s) selecionado(s)</span>
          <span v-if="totalPendentes > 0" class="acao-aviso">
            ⚠ {{ totalPendentes }} item(ns) precisará(ão) de aprovação
          </span>
        </div>
        <button
          class="btn-solicitar"
          :disabled="carregando"
          @click="solicitarRetirada"
        >
          {{ carregando ? 'Enviando...' : 'Solicitar Retirada' }}
        </button>
      </div>
    </section>

    <section v-if="funcionario" class="cartao">
      <div class="cartao-cabecalho">
        <h2>Histórico de retiradas de {{ funcionario.nome }}</h2>
        <span class="contagem">{{ retiradas.length }} registro(s)</span>
      </div>

      <p v-if="retiradas.length === 0" class="vazio">
        Nenhuma retirada registrada para este funcionário.
      </p>

      <div v-else class="lista-historico">
        <div v-for="(r, i) in retiradas" :key="i" class="item-historico">
          <div class="hist-icone">📦</div>
          <div class="hist-info">
            <p class="hist-nome">{{ r.nome_retirada }}</p>
            <p class="hist-setor">Setor: {{ r.setor_retirada }}</p>
          </div>
          <span v-if="r.status" class="hist-status" :class="'status-' + r.status">
            {{ r.status }}
          </span>
          <span class="hist-data">{{ formatarData(r.data_entrega) }}</span>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.pagina-retirada {
  background: #181511;
  min-height: 100vh;
  color: #fff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  padding: 2rem 3rem 3rem;
  box-sizing: border-box;
  width: 100%;
}
.pagina-retirada *, .pagina-retirada *::before, .pagina-retirada *::after { box-sizing: border-box; }

.cabecalho { margin-bottom: 2rem; }
.caminho { color: #8b8680; font-size: 0.85rem; margin-bottom: 0.7rem; }
.caminho .separador { margin: 0 0.4rem; }
.caminho-atual { color: #fff; }
.titulo-pagina {
  font-size: 2.6rem;
  font-weight: 800;
  letter-spacing: -0.02em;
  margin-bottom: 0.4rem;
}
.titulo-destaque { color: #F49D25; }
.subtitulo { color: #8b8680; font-size: 0.95rem; }

.cartao {
  background: #221E18;
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 1rem;
  padding: 1.5rem 1.6rem;
  margin-bottom: 1.5rem;
}
.cartao-cabecalho {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.3rem;
}
.cartao-cabecalho h2 { color: #fff; font-size: 1.05rem; font-weight: 700; }
.contagem {
  color: #F49D25;
  font-size: 0.8rem;
  font-weight: 600;
  background: rgba(244, 157, 37, 0.1);
  padding: 0.25rem 0.7rem;
  border-radius: 999px;
}

.campo { display: flex; flex-direction: column; gap: 0.45rem; max-width: 500px; }
.campo label { color: #c5bfb5; font-size: 0.85rem; font-weight: 500; }
.select-wrapper { position: relative; }
.select-wrapper select {
  width: 100%;
  background: #131110;
  border: 1px solid #2a241e;
  border-radius: 0.5rem;
  padding: 0.75rem 0.9rem;
  color: #fff;
  font-size: 0.95rem;
  outline: none;
  appearance: none;
  font-family: inherit;
  cursor: pointer;
  transition: border-color 0.2s;
}
.select-wrapper select:focus { border-color: #F49D25; }
.select-wrapper::after {
  content: '▾';
  position: absolute;
  right: 1rem; top: 50%;
  transform: translateY(-50%);
  color: #8b8680;
  pointer-events: none;
}

.grade-epis {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 0.9rem;
}

.card-epi {
  position: relative;
  display: flex;
  align-items: center;
  gap: 0.9rem;
  background: #2a2520;
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 0.75rem;
  padding: 0.85rem;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}
.card-epi:hover { border-color: rgba(244, 157, 37, 0.35); }
.card-epi.selecionado {
  border-color: #F49D25;
  background: rgba(244, 157, 37, 0.08);
}
.card-epi.card-outro-setor { opacity: 0.85; }
.card-epi.card-outro-setor:hover { opacity: 1; }
.card-epi.precisa-aprovacao {
  border-color: #facc15;
  background: rgba(250, 204, 21, 0.08);
}

.legenda {
  display: flex;
  flex-wrap: wrap;
  gap: 1.2rem;
  margin-bottom: 1rem;
  font-size: 0.78rem;
  color: #8b8680;
}
.legenda-item { display: inline-flex; align-items: center; gap: 0.4rem; }
.dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
.dot-setor { background: #F49D25; }
.dot-outro { background: #facc15; }

.info-topo {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.4rem;
}
.badge {
  font-size: 0.65rem;
  font-weight: 700;
  padding: 0.15rem 0.45rem;
  border-radius: 999px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  white-space: nowrap;
  flex-shrink: 0;
}
.badge-setor {
  background: rgba(244, 157, 37, 0.18);
  color: #F49D25;
}
.badge-outro {
  background: rgba(250, 204, 21, 0.15);
  color: #facc15;
}

.card-imagem {
  flex: 0 0 60px;
  width: 60px;
  height: 60px;
  border-radius: 0.5rem;
  overflow: hidden;
  background: #3a332b;
}
.card-imagem img { width: 100%; height: 100%; object-fit: cover; }
.imagem-placeholder { width: 100%; height: 100%; background: #3a332b; }

.card-info { flex: 1; min-width: 0; }
.epi-nome {
  color: #fff;
  font-size: 0.95rem;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.epi-meta { color: #8b8680; font-size: 0.78rem; margin-top: 0.15rem; }
.epi-estoque { color: #F49D25; font-size: 0.78rem; font-weight: 600; margin-top: 0.2rem; }

.card-marca { flex: 0 0 auto; }
.circulo-vazio {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid #4a4239;
  display: block;
}

.card-controles {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  background: #181511;
  border: 1px solid rgba(244, 157, 37, 0.3);
  border-radius: 0.5rem;
  padding: 0.2rem;
}
.btn-qtd {
  background: rgba(244, 157, 37, 0.15);
  border: none;
  color: #F49D25;
  width: 26px;
  height: 26px;
  border-radius: 0.35rem;
  font-size: 1.1rem;
  font-weight: 700;
  cursor: pointer;
  line-height: 1;
}
.btn-qtd:hover { background: rgba(244, 157, 37, 0.28); }
.qtd-valor {
  color: #fff;
  font-weight: 700;
  font-size: 0.9rem;
  min-width: 1.5rem;
  text-align: center;
}

.barra-acao {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  margin-top: 1.3rem;
  padding: 0.9rem 1.1rem;
  background: rgba(244, 157, 37, 0.08);
  border: 1px solid rgba(244, 157, 37, 0.25);
  border-radius: 0.7rem;
}
.acao-resumo { display: flex; flex-direction: column; gap: 0.2rem; }
.acao-info { color: #fff; font-weight: 600; font-size: 0.9rem; }
.acao-aviso { color: #facc15; font-size: 0.78rem; font-weight: 600; }
.btn-solicitar {
  background: #F49D25;
  color: #1a1410;
  border: none;
  padding: 0.7rem 1.4rem;
  border-radius: 0.55rem;
  font-size: 0.92rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s, opacity 0.2s;
}
.btn-solicitar:hover:not(:disabled) { background: #e08c18; }
.btn-solicitar:disabled { opacity: 0.5; cursor: not-allowed; }

.lista-historico { display: flex; flex-direction: column; gap: 0.55rem; }
.item-historico {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: #2a2520;
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 0.6rem;
  padding: 0.8rem 1rem;
}
.hist-icone {
  width: 38px;
  height: 38px;
  background: rgba(244, 157, 37, 0.12);
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
}
.hist-info { flex: 1; min-width: 0; }
.hist-nome { color: #fff; font-weight: 700; font-size: 0.92rem; }
.hist-setor { color: #8b8680; font-size: 0.78rem; margin-top: 0.1rem; }
.hist-data {
  color: #c5bfb5;
  font-size: 0.82rem;
  font-weight: 500;
  white-space: nowrap;
}

.hist-status {
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.25rem 0.65rem;
  border-radius: 999px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.status-aprovado {
  background: rgba(34, 197, 94, 0.15);
  color: #4ade80;
  border: 1px solid rgba(34, 197, 94, 0.35);
}
.status-pendente {
  background: rgba(250, 204, 21, 0.12);
  color: #facc15;
  border: 1px solid rgba(250, 204, 21, 0.35);
}

.vazio { color: #8b8680; font-size: 0.9rem; padding: 0.5rem 0; }

.toast {
  position: fixed;
  top: 1.5rem;
  right: 1.5rem;
  z-index: 999;
  padding: 0.85rem 1.3rem;
  border-radius: 0.6rem;
  font-size: 0.9rem;
  font-weight: 600;
  animation: fadeIn 0.2s ease;
}
.toast-sucesso {
  background: rgba(34, 197, 94, 0.15);
  border: 1px solid rgba(34, 197, 94, 0.4);
  color: #4ade80;
}
.toast-erro {
  background: rgba(248, 113, 113, 0.15);
  border: 1px solid rgba(248, 113, 113, 0.4);
  color: #f87171;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-8px); }
  to   { opacity: 1; transform: translateY(0); }
}

@media (max-width: 700px) {
  .pagina-retirada { padding: 1.5rem 1.5rem 2rem; }
  .titulo-pagina { font-size: 1.8rem; }
  .barra-acao { flex-direction: column; align-items: stretch; }
}
</style>
