<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useSupabase } from '../composables/useSupabase';

const { supabase, perfil } = useSupabase();

const epis = ref([]);
const meuHistorico = ref([]);
const selecionados = ref({});
const justificativa = ref('');
const carregando = ref(false);
const mensagem = ref(null);

const podeAdministrar = computed(() => ['admin', 'almoxarife'].includes(perfil.value?.role));

const LIMITE_PADRAO = { aluno: 1, professor: 30 };

const mostrarMensagem = (tipo, texto, ms = 4000) => {
  mensagem.value = { tipo, texto };
  setTimeout(() => { mensagem.value = null; }, ms);
};

const formatarData = (data) => {
  if (!data) return '—';
  const d = new Date(data);
  if (isNaN(d.getTime())) return data;
  return d.toLocaleDateString('pt-BR') + ' ' + d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
};

async function carregarEmUso() {
  const hoje = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from('entrega_epi')
    .select('epi_id, quantidade, data_validade')
    .eq('funcionario_id', perfil.value.id)
    .eq('status', 'entregue')
    .is('data_devolucao', null);
  if (error) { console.error(error); return new Map(); }
  const mapa = new Map();
  for (const r of (data || [])) {
    if (r.data_validade && r.data_validade < hoje) continue;
    if (!r.epi_id) continue;
    mapa.set(r.epi_id, (mapa.get(r.epi_id) || 0) + (Number(r.quantidade) || 0));
  }
  return mapa;
}

async function carregar() {
  if (!perfil.value) return;
  carregando.value = true;

  const role = perfil.value.role;
  const meusSetores = (perfil.value.setores || []).map(s => s.nome);

  let baseEpis = [];
  let limitePorEpi = new Map();

  if (podeAdministrar.value) {
    const { data, error } = await supabase.from('epis').select('*').order('nome');
    if (error) console.error(error);
    baseEpis = data || [];
  } else {
    if (meusSetores.length === 0) {
      epis.value = [];
      carregando.value = false;
      return;
    }

    const { data: todos, error } = await supabase.from('epis').select('*').order('nome');
    if (error) console.error(error);

    const limitePadrao = LIMITE_PADRAO[role] ?? 0;

    const setorIds = (perfil.value.setores || []).map(s => s.id);
    const { data: overrides } = await supabase
      .from('epi_permissoes')
      .select('epi_id, limite, setor_id')
      .eq('role', role)
      .in('setor_id', setorIds.length ? setorIds : [-1]);
    const overrideMap = new Map();
    for (const o of (overrides || [])) {
      const atual = overrideMap.get(o.epi_id) ?? -1;
      if (o.limite > atual) overrideMap.set(o.epi_id, o.limite);
    }

    for (const e of (todos || [])) {
      const setoresDoEpi = String(e.setor || '').split(',').map(s => s.trim()).filter(Boolean);
      const intersecao = setoresDoEpi.some(s => meusSetores.includes(s));
      if (!intersecao) continue;
      baseEpis.push(e);
      limitePorEpi.set(e.id, overrideMap.has(e.id) ? overrideMap.get(e.id) : limitePadrao);
    }
  }

  const emUsoMap = await carregarEmUso();

  epis.value = baseEpis.map(e => {
    const limite = limitePorEpi.has(e.id) ? limitePorEpi.get(e.id) : null;
    const em_uso = emUsoMap.get(e.id) || 0;
    const disponivel = limite == null ? Infinity : Math.max(0, limite - em_uso);
    return { ...e, limite, em_uso, disponivel };
  });

  const { data: hist, error: histErr } = await supabase
    .from('entrega_epi')
    .select('*')
    .eq('funcionario_id', perfil.value.id)
    .order('data_retirada', { ascending: false })
    .limit(30);
  if (histErr) console.error(histErr);

  const aprovadores = [...new Set((hist || []).map(r => r.aprovado_por).filter(Boolean))];
  let nomePorUser = new Map();
  if (aprovadores.length) {
    const { data: aprov } = await supabase
      .from('funcionarios')
      .select('user_id, nome')
      .in('user_id', aprovadores);
    nomePorUser = new Map((aprov || []).map(a => [a.user_id, a.nome]));
  }
  meuHistorico.value = (hist || []).map(r => ({
    ...r,
    aprovado_por_nome: r.aprovado_por ? (nomePorUser.get(r.aprovado_por) || 'desconhecido') : null,
  }));

  carregando.value = false;
}

onMounted(() => { if (perfil.value) carregar(); });
watch(() => perfil.value?.id, (v) => { if (v) carregar(); });

const toggleSelecao = (epi) => {
  if (selecionados.value[epi.id] !== undefined) {
    const { [epi.id]: _, ...resto } = selecionados.value;
    selecionados.value = resto;
  } else {
    selecionados.value = { ...selecionados.value, [epi.id]: 1 };
  }
};

const ajustarQtd = (epi, delta) => {
  const atual = selecionados.value[epi.id] || 0;
  const maxEstoque = Number(epi.estoque) || 0;
  const novo = Math.max(1, Math.min(maxEstoque, atual + delta));
  selecionados.value = { ...selecionados.value, [epi.id]: novo };
};

const excedeLimite = (epi) => {
  const qtd = selecionados.value[epi.id] || 0;
  if (epi.disponivel === Infinity) return false;
  return qtd > epi.disponivel;
};

const totalSelecionados = computed(() => Object.keys(selecionados.value).length);

const itensQueExcedem = computed(() =>
  Object.keys(selecionados.value)
    .map(id => epis.value.find(e => String(e.id) === String(id)))
    .filter(e => e && excedeLimite(e))
);

const precisaJustificativa = computed(() => itensQueExcedem.value.length > 0);

const solicitarRetirada = async () => {
  const ids = Object.keys(selecionados.value);
  if (ids.length === 0) {
    mostrarMensagem('erro', 'Selecione ao menos um EPI.');
    return;
  }
  if (precisaJustificativa.value && !justificativa.value.trim()) {
    mostrarMensagem('erro', 'Justifique o motivo do pedido acima do limite.');
    return;
  }

  carregando.value = true;
  const agora = new Date().toISOString();

  let pedidos = 0;
  let aprovacoes = 0;
  let erro = null;

  for (const id of ids) {
    const epi = epis.value.find(e => String(e.id) === String(id));
    const qtd = selecionados.value[id];
    const excede = excedeLimite(epi);
    const status = excede ? 'pendente_aprovacao' : 'pendente_entrega';

    const { error } = await supabase.from('entrega_epi').insert({
      funcionario_id: perfil.value.id,
      epi_id: epi.id,
      nome_epi: epi.nome,
      nome_retirada: perfil.value.nome,
      setor_retirada: perfil.value.setor?.nome || null,
      quantidade: qtd,
      status,
      justificativa: excede ? justificativa.value.trim() : null,
      data_retirada: agora,
    });
    if (error) { erro = error; break; }

    pedidos++;
    if (excede) aprovacoes++;
  }

  if (erro) {
    console.error(erro);
    mostrarMensagem('erro', 'Erro ao registrar pedido: ' + erro.message);
    carregando.value = false;
    return;
  }

  selecionados.value = {};
  justificativa.value = '';
  await carregar();
  carregando.value = false;

  const partes = [`${pedidos} pedido(s) criado(s)`];
  if (aprovacoes) partes.push(`${aprovacoes} aguardando aprovação do almoxarife`);
  else partes.push('aguardando entrega');
  mostrarMensagem('sucesso', partes.join(' · '));
};

const labelStatus = (s) => ({
  pendente_aprovacao: 'Aguardando aprovação',
  pendente_entrega: 'Aguardando entrega',
  aprovado: 'Aprovado',
  recusado: 'Recusado',
  entregue: 'Entregue',
  devolvido: 'Devolvido',
})[s] || s;
</script>

<template>
  <div class="pagina-retirada">
    <header class="cabecalho">
      <div>
        <p class="caminho">
          Operações <span class="separador">›</span>
          <span class="caminho-atual">Retirada de EPIs</span>
        </p>
        <h1 class="titulo-pagina">Retirada de <span class="titulo-destaque">EPIs</span></h1>
        <p class="subtitulo" v-if="perfil">
          Olá, <strong>{{ perfil.nome }}</strong> ({{ perfil.role }}, setor {{ perfil.setor?.nome || '—' }}).
          Solicite os EPIs que precisa abaixo.
        </p>
      </div>
    </header>

    <div v-if="mensagem" :class="['toast', 'toast-' + mensagem.tipo]">
      {{ mensagem.texto }}
    </div>

    <section v-if="!carregando && epis.length === 0" class="cartao vazio-cartao">
      <p>Nenhum EPI disponível para você no momento.</p>
      <p class="ajuda" v-if="!podeAdministrar">Procure o administrador para configurar suas permissões.</p>
    </section>

    <section v-else class="cartao">
      <div class="cartao-cabecalho">
        <h2>EPIs disponíveis</h2>
        <span class="contagem">{{ epis.length }} item(ns)</span>
      </div>

      <div class="legenda">
        <span class="legenda-item"><span class="dot dot-setor"></span> Dentro do limite (entrega direta)</span>
        <span class="legenda-item"><span class="dot dot-outro"></span> Acima do limite (precisa justificar/aprovação)</span>
      </div>

      <div v-if="carregando" class="vazio">Carregando…</div>

      <div v-else class="grade-epis">
        <div
          v-for="epi in epis"
          :key="epi.id"
          class="card-epi"
          :class="{
            selecionado: selecionados[epi.id] !== undefined,
            'precisa-aprovacao': selecionados[epi.id] !== undefined && excedeLimite(epi)
          }"
          @click="toggleSelecao(epi)"
        >
          <div class="card-imagem">
            <img loading="lazy" decoding="async" v-if="epi.imagem" :src="epi.imagem" :alt="epi.nome" />
            <div v-else class="imagem-placeholder"></div>
          </div>

          <div class="card-info">
            <div class="info-topo">
              <p class="epi-nome">{{ epi.nome }}</p>
              <span v-if="epi.limite != null" class="badge badge-setor">
                Limite: {{ epi.disponivel }} / {{ epi.limite }}
              </span>
              <span v-else class="badge badge-outro">Sem limite</span>
            </div>
            <p class="epi-meta">{{ epi.fabricante || '—' }} · CA #{{ epi.numero_ca || '—' }}</p>
            <p class="epi-estoque">
              {{ epi.estoque }} em estoque
              <span v-if="epi.em_uso > 0" class="em-uso"> · você já usa {{ epi.em_uso }}</span>
            </p>
          </div>

          <div v-if="selecionados[epi.id] !== undefined" class="card-controles" @click.stop>
            <button type="button" class="btn-qtd" @click="ajustarQtd(epi, -1)">−</button>
            <span class="qtd-valor">{{ selecionados[epi.id] }}</span>
            <button type="button" class="btn-qtd" @click="ajustarQtd(epi, 1)">+</button>
          </div>
          <div v-else class="card-marca">
            <span class="circulo-vazio"></span>
          </div>
        </div>
      </div>

      <div v-if="precisaJustificativa" class="caixa-justificativa">
        <label for="justificativa">
          <i class="fas fa-triangle-exclamation" aria-hidden="true"></i> Você está pedindo mais do que o limite permitido em
          <strong>{{ itensQueExcedem.length }} item(ns)</strong>. Justifique abaixo para o almoxarife avaliar:
        </label>
        <textarea id="justificativa" v-model="justificativa" placeholder="Ex: bota anterior rasgou em serviço, preciso de outra." rows="3"></textarea>
      </div>

      <div class="barra-acao" v-if="totalSelecionados > 0">
        <div class="acao-resumo">
          <span class="acao-info">{{ totalSelecionados }} EPI(s) selecionado(s)</span>
          <span v-if="precisaJustificativa" class="acao-aviso">
            {{ itensQueExcedem.length }} item(ns) acima do limite — aprovação necessária
          </span>
        </div>
        <button type="button"
          class="btn-solicitar"
          :disabled="carregando"
          @click="solicitarRetirada"
        >
          {{ carregando ? 'Enviando...' : 'Solicitar Retirada' }}
        </button>
      </div>
    </section>

    <section class="cartao">
      <div class="cartao-cabecalho">
        <h2>Meu histórico</h2>
        <span class="contagem">{{ meuHistorico.length }} registro(s)</span>
      </div>

      <p v-if="meuHistorico.length === 0" class="vazio">Você ainda não fez pedidos.</p>

      <div v-else class="lista-historico">
        <div v-for="r in meuHistorico" :key="r.id" class="item-historico">
          <div class="hist-info">
            <p class="hist-nome">{{ r.nome_epi || '—' }} <span class="hist-qtd">× {{ r.quantidade || 1 }}</span></p>
            <p class="hist-setor">
              Pedido em {{ formatarData(r.data_retirada) }}
              <span v-if="r.data_entrega"> · entregue em {{ formatarData(r.data_entrega) }}</span>
              <span v-if="r.data_validade"> · validade {{ formatarData(r.data_validade) }}</span>
            </p>
            <p v-if="r.aprovado_por_nome" class="hist-aprovador">
              Aprovado por {{ r.aprovado_por_nome }}
              <span v-if="r.aprovado_em"> em {{ formatarData(r.aprovado_em) }}</span>
            </p>
            <p v-if="r.justificativa" class="hist-just">"{{ r.justificativa }}"</p>
          </div>
          <span class="hist-status" :class="'status-' + r.status">{{ labelStatus(r.status) }}</span>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.pagina-retirada {
  background: var(--superficie-alta);
  min-height: 100vh;
  color: var(--texto-forte);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  padding: 2rem 3rem 3rem;
  box-sizing: border-box;
  width: 100%;
}
.pagina-retirada *, .pagina-retirada *::before, .pagina-retirada *::after { box-sizing: border-box; }

.cabecalho { margin-bottom: 2rem; }
.caminho { color: var(--texto-suave); font-size: 0.85rem; margin-bottom: 0.7rem; }
.caminho .separador { margin: 0 0.4rem; }
.caminho-atual { color: var(--texto-forte); }
.titulo-pagina { font-size: 2.6rem; font-weight: 800; letter-spacing: -0.02em; margin-bottom: 0.4rem; }
.titulo-destaque { color: var(--marca); }
.subtitulo { color: var(--texto-suave); font-size: 0.95rem; }
.subtitulo strong { color: var(--texto-forte); }

.cartao {
  background: var(--superficie-elevada);
  border: 1px solid color-mix(in srgb, var(--texto-forte) 5%, transparent);
  border-radius: 1rem;
  padding: 1.5rem 1.6rem;
  margin-bottom: 1.5rem;
}
.cartao-cabecalho {
  display: flex; align-items: center; justify-content: space-between; gap: 1rem;
  margin-bottom: 1.3rem;
}
.cartao-cabecalho h2 { color: var(--texto-forte); font-size: 1.05rem; font-weight: 700; }
.contagem {
  color: var(--marca); font-size: 0.8rem; font-weight: 600;
  background: color-mix(in srgb, var(--marca) 10%, transparent); padding: 0.25rem 0.7rem; border-radius: 999px;
}

.vazio-cartao { text-align: center; color: var(--texto-suave); }
.vazio-cartao .ajuda { font-size: 0.85rem; margin-top: 0.5rem; }

.legenda { display: flex; flex-wrap: wrap; gap: 1.2rem; margin-bottom: 1rem; font-size: 0.78rem; color: var(--texto-suave); }
.legenda-item { display: inline-flex; align-items: center; gap: 0.4rem; }
.dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; }
.dot-setor { background: var(--marca); }
.dot-outro { background: var(--aviso); }

.grade-epis {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 0.9rem;
}

.card-epi {
  position: relative;
  display: flex; align-items: center; gap: 0.9rem;
  background: var(--borda);
  border: 1px solid color-mix(in srgb, var(--texto-forte) 6%, transparent);
  border-radius: 0.75rem;
  padding: 0.85rem;
  cursor: pointer;
  transition: border-color 0.15s, background 0.15s;
}
.card-epi:hover { border-color: color-mix(in srgb, var(--marca) 35%, transparent); }
.card-epi.selecionado { border-color: var(--marca); }
.card-epi.precisa-aprovacao { border-color: var(--aviso); }

.info-topo { display: flex; align-items: center; justify-content: space-between; gap: 0.4rem; }
.badge {
  font-size: 0.72rem; font-weight: 700; padding: 0.18rem 0.5rem; border-radius: 999px;
  text-transform: uppercase; letter-spacing: 0.04em; white-space: nowrap; flex-shrink: 0;
}
.badge-setor { background: color-mix(in srgb, var(--marca) 18%, transparent); color: var(--marca); }
.badge-outro { background: color-mix(in srgb, var(--ok) 15%, transparent); color: var(--ok); }

.card-imagem {
  flex: 0 0 60px; width: 60px; height: 60px; border-radius: 0.5rem; overflow: hidden; background: var(--borda-forte);
}
.card-imagem img { width: 100%; height: 100%; object-fit: cover; }
.imagem-placeholder { width: 100%; height: 100%; background: var(--borda-forte); }

.card-info { flex: 1; min-width: 0; }
.epi-nome { color: var(--texto-forte); font-size: 1.05rem; font-weight: 700; overflow: hidden; text-overflow: ellipsis; }
.epi-meta { color: var(--texto-suave); font-size: 0.85rem; margin-top: 0.25rem; }
.epi-estoque { color: var(--marca); font-size: 0.82rem; font-weight: 600; margin-top: 0.3rem; }
.em-uso { color: var(--aviso); font-weight: 600; }

.card-marca { flex: 0 0 auto; }
.circulo-vazio { width: 22px; height: 22px; border-radius: 50%; border: 2px solid var(--borda-forte); display: block; }

.card-controles {
  display: flex; align-items: center; gap: 0.4rem;
  background: var(--superficie-alta); border: 1px solid color-mix(in srgb, var(--marca) 30%, transparent);
  border-radius: 0.5rem; padding: 0.2rem;
}
.btn-qtd {
  background: color-mix(in srgb, var(--marca) 15%, transparent); border: none; color: var(--marca);
  width: 26px; height: 26px; border-radius: 0.35rem; font-size: 1.1rem; font-weight: 700; cursor: pointer; line-height: 1;
}
.btn-qtd:hover { background: color-mix(in srgb, var(--marca) 28%, transparent); }
.qtd-valor { color: var(--texto-forte); font-weight: 700; font-size: 0.9rem; min-width: 1.5rem; text-align: center; }

.caixa-justificativa {
  margin-top: 1.2rem;
  background: color-mix(in srgb, var(--aviso) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--aviso) 30%, transparent);
  border-radius: 0.7rem;
  padding: 0.9rem 1.1rem;
}
.caixa-justificativa label { color: var(--aviso); font-size: 0.85rem; display: block; margin-bottom: 0.5rem; }
.caixa-justificativa label strong { color: var(--texto-forte); }
.caixa-justificativa textarea {
  width: 100%; background: var(--superficie); border: 1px solid var(--borda); color: var(--texto-forte);
  border-radius: 0.5rem; padding: 0.6rem 0.8rem; font-size: 0.88rem; outline: none;
  font-family: inherit; resize: vertical;
}
.caixa-justificativa textarea:focus { border-color: var(--marca); }

.barra-acao {
  display: flex; align-items: center; justify-content: space-between; gap: 1rem;
  margin-top: 1.3rem; padding: 0.9rem 1.1rem;
  background: color-mix(in srgb, var(--marca) 8%, transparent); border: 1px solid color-mix(in srgb, var(--marca) 25%, transparent);
  border-radius: 0.7rem;
}
.acao-resumo { display: flex; flex-direction: column; gap: 0.2rem; }
.acao-info { color: var(--texto-forte); font-weight: 600; font-size: 0.9rem; }
.acao-aviso { color: var(--aviso); font-size: 0.78rem; font-weight: 600; }
.btn-solicitar {
  background: var(--marca); color: var(--marca-texto); border: none; padding: 0.7rem 1.4rem;
  border-radius: 0.55rem; font-size: 0.92rem; font-weight: 700; cursor: pointer;
}
.btn-solicitar:hover:not(:disabled) { background: var(--marca-escura); }
.btn-solicitar:disabled { opacity: 0.5; cursor: not-allowed; }

.lista-historico { display: flex; flex-direction: column; gap: 0.55rem; }
.item-historico {
  display: flex; align-items: center; gap: 1rem;
  background: var(--borda); border: 1px solid color-mix(in srgb, var(--texto-forte) 5%, transparent);
  border-radius: 0.6rem; padding: 0.8rem 1rem;
}
.hist-info { flex: 1; min-width: 0; }
.hist-nome { color: var(--texto-forte); font-weight: 700; font-size: 0.95rem; }
.hist-qtd { color: var(--marca); font-weight: 600; margin-left: 0.3rem; }
.hist-setor { color: var(--texto-suave); font-size: 0.78rem; margin-top: 0.1rem; }
.hist-aprovador { color: var(--ok); font-size: 0.78rem; margin-top: 0.1rem; }
.hist-just { color: var(--aviso); font-size: 0.78rem; margin-top: 0.2rem; font-style: italic; }

.hist-status {
  font-size: 0.7rem; font-weight: 700; padding: 0.25rem 0.65rem;
  border-radius: 999px; text-transform: uppercase; letter-spacing: 0.04em; white-space: nowrap;
}
.status-pendente_aprovacao { background: color-mix(in srgb, var(--aviso) 12%, transparent); color: var(--aviso); border: 1px solid color-mix(in srgb, var(--aviso) 35%, transparent); }
.status-pendente_entrega   { background: color-mix(in srgb, var(--info) 12%, transparent); color: var(--info); border: 1px solid color-mix(in srgb, var(--info) 35%, transparent); }
.status-aprovado           { background: color-mix(in srgb, var(--info) 12%, transparent); color: var(--info); border: 1px solid color-mix(in srgb, var(--info) 35%, transparent); }
.status-entregue           { background: color-mix(in srgb, var(--ok) 15%, transparent); color: var(--ok); border: 1px solid color-mix(in srgb, var(--ok) 35%, transparent); }
.status-recusado           { background: color-mix(in srgb, var(--perigo) 12%, transparent); color: var(--perigo); border: 1px solid color-mix(in srgb, var(--perigo) 35%, transparent); }
.status-devolvido          { background: rgba(168,168,168,0.12); color: var(--texto-suave); border: 1px solid rgba(168,168,168,0.3); }

.vazio { color: var(--texto-suave); font-size: 0.9rem; padding: 0.5rem 0; }

.toast {
  position: fixed; top: 1.5rem; right: 1.5rem; z-index: 999;
  padding: 0.85rem 1.3rem; border-radius: 0.6rem; font-size: 0.9rem; font-weight: 600;
}
.toast-sucesso { background: color-mix(in srgb, var(--ok) 15%, transparent); border: 1px solid color-mix(in srgb, var(--ok) 40%, transparent); color: var(--ok); }
.toast-erro    { background: color-mix(in srgb, var(--perigo) 15%, transparent); border: 1px solid color-mix(in srgb, var(--perigo) 40%, transparent); color: var(--perigo); }
</style>
