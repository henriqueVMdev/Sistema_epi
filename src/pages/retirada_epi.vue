<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useSupabase } from '../composables/useSupabase';
import { useMensagem } from '../composables/mensagem';
import { formatarData, formatarDataHora } from '../composables/datas';
import Toast from '../components/Toast.vue';
import Icone from '../components/Icone.vue';

const { supabase, perfil } = useSupabase();
const { mensagem, mostrarMensagem } = useMensagem();

const epis = ref([]);
const meuHistorico = ref([]);
const selecionados = ref({});
const justificativa = ref('');
const carregando = ref(false);
const enviando = ref(false);

const podeAdministrar = computed(() => ['admin', 'almoxarife'].includes(perfil.value?.role));

const LIMITE_PADRAO = { aluno: 1, professor: 30 };

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
      if (!setoresDoEpi.some(s => meusSetores.includes(s))) continue;
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

const estaSelecionado = (epi) => selecionados.value[epi.id] !== undefined;

const toggleSelecao = (epi) => {
  if (estaSelecionado(epi)) {
    const { [epi.id]: _, ...resto } = selecionados.value;
    selecionados.value = resto;
  } else {
    selecionados.value = { ...selecionados.value, [epi.id]: 1 };
  }
};

const ajustarQtd = (epi, delta) => {
  const maxEstoque = Number(epi.estoque) || 0;
  if (maxEstoque < 1) return;
  const novo = Math.max(1, Math.min(maxEstoque, (selecionados.value[epi.id] || 0) + delta));
  selecionados.value = { ...selecionados.value, [epi.id]: novo };
};

const excedeLimite = (epi) => {
  if (!epi || epi.disponivel === Infinity) return false;
  return (selecionados.value[epi.id] || 0) > epi.disponivel;
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

  enviando.value = true;
  const agora = new Date().toISOString();

  // Um insert só. Antes era um await por item dentro de um for: se o quarto
  // falhava, os três primeiros já estavam gravados e o usuário via só "erro".
  const linhas = ids.map(id => {
    const epi = epis.value.find(e => String(e.id) === String(id));
    const excede = excedeLimite(epi);
    return {
      funcionario_id: perfil.value.id,
      epi_id: epi.id,
      nome_epi: epi.nome,
      nome_retirada: perfil.value.nome,
      setor_retirada: perfil.value.setor?.nome || null,
      quantidade: selecionados.value[id],
      status: excede ? 'pendente_aprovacao' : 'pendente_entrega',
      justificativa: excede ? justificativa.value.trim() : null,
      data_retirada: agora,
    };
  });

  const { error } = await supabase.from('entrega_epi').insert(linhas);
  if (error) {
    console.error(error);
    enviando.value = false;
    mostrarMensagem('erro', 'Nenhum pedido foi criado: ' + error.message, 7000);
    return;
  }

  const aprovacoes = linhas.filter(l => l.status === 'pendente_aprovacao').length;
  selecionados.value = {};
  justificativa.value = '';
  await carregar();
  enviando.value = false;

  mostrarMensagem('sucesso', [
    `${linhas.length} pedido(s) criado(s)`,
    aprovacoes ? `${aprovacoes} aguardando aprovação do almoxarife` : 'aguardando entrega',
  ].join(' · '));
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
    <Toast :mensagem="mensagem" />

    <header class="cabecalho">
      <p class="caminho">
        Operações <span class="separador" aria-hidden="true">›</span>
        <span class="caminho-atual">Retirada de EPIs</span>
      </p>
      <h1 class="titulo-pagina">Retirada de <span class="titulo-destaque">EPIs</span></h1>
      <p class="subtitulo" v-if="perfil">
        Olá, <strong>{{ perfil.nome }}</strong> ({{ perfil.role }}, setor {{ perfil.setor?.nome || '—' }}).
        Solicite os EPIs que precisa abaixo.
      </p>
    </header>

    <section v-if="!carregando && epis.length === 0" class="cartao vazio-cartao">
      <p>Nenhum EPI disponível para você no momento.</p>
      <p class="ajuda" v-if="!podeAdministrar">Procure o administrador para configurar suas permissões.</p>
    </section>

    <section v-else class="cartao">
      <div class="cartao-cabecalho">
        <h2>EPIs disponíveis</h2>
        <span class="contagem">{{ epis.length }} item(ns)</span>
      </div>

      <p class="legenda">
        Marque os EPIs que precisa. Pedidos <strong>dentro do limite</strong> vão direto para entrega;
        <strong class="legenda-aviso">acima do limite</strong> exigem justificativa e aprovação do almoxarife.
      </p>

      <p v-if="carregando" class="vazio">Carregando…</p>

      <div v-else class="grade-epis">
        <div
          v-for="epi in epis"
          :key="epi.id"
          class="card-epi"
          :class="{
            selecionado: estaSelecionado(epi),
            'precisa-aprovacao': estaSelecionado(epi) && excedeLimite(epi)
          }"
        >
          <!-- O card inteiro é o rótulo de um checkbox real: clique funciona em
               qualquer ponto e Tab/Espaço também. Antes era um <div @click>, e
               quem usava teclado simplesmente não conseguia pedir EPI. -->
          <label class="card-alvo">
            <input
              type="checkbox"
              class="card-check"
              :checked="estaSelecionado(epi)"
              @change="toggleSelecao(epi)"
            />

            <span class="card-imagem">
              <img loading="lazy" decoding="async" v-if="epi.imagem" :src="epi.imagem" alt="" />
            </span>

            <span class="card-info">
              <span class="info-topo">
                <span class="epi-nome">{{ epi.nome }}</span>
                <span v-if="epi.limite != null" class="badge badge-limite">
                  Limite: {{ epi.disponivel }} / {{ epi.limite }}
                </span>
                <span v-else class="badge badge-sem-limite">Sem limite</span>
              </span>
              <span class="epi-meta">{{ epi.fabricante || '—' }} · CA #{{ epi.numero_ca || '—' }}</span>
              <span class="epi-estoque">
                {{ epi.estoque || 0 }} em estoque
                <span v-if="epi.em_uso > 0" class="em-uso"> · você já usa {{ epi.em_uso }}</span>
              </span>
            </span>

            <span class="card-marca" aria-hidden="true">
              <svg v-if="estaSelecionado(epi)" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
          </label>

          <div v-if="estaSelecionado(epi)" class="card-controles">
            <button
              type="button"
              class="btn-qtd"
              :aria-label="`Diminuir quantidade de ${epi.nome}`"
              :disabled="selecionados[epi.id] <= 1"
              @click="ajustarQtd(epi, -1)"
            >−</button>
            <span class="qtd-valor">
              <span class="qtd-numero">{{ selecionados[epi.id] }}</span>
              <span class="qtd-unidade">un.</span>
            </span>
            <button
              type="button"
              class="btn-qtd"
              :aria-label="`Aumentar quantidade de ${epi.nome}`"
              :disabled="selecionados[epi.id] >= (Number(epi.estoque) || 0)"
              @click="ajustarQtd(epi, 1)"
            >+</button>
          </div>
        </div>
      </div>

      <div v-if="precisaJustificativa" class="caixa-justificativa">
        <label for="justificativa" class="just-rotulo">
          <Icone nome="alerta" :tamanho="16" />
          <span>
            Você está pedindo mais do que o limite permitido em
            <strong>{{ itensQueExcedem.length }} item(ns)</strong>. Justifique abaixo para o almoxarife avaliar:
          </span>
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
        <button type="button" class="btn-solicitar" :disabled="enviando" @click="solicitarRetirada">
          {{ enviando ? 'Enviando…' : 'Solicitar Retirada' }}
        </button>
      </div>
    </section>

    <section class="cartao">
      <div class="cartao-cabecalho">
        <h2>Meu histórico</h2>
        <span class="contagem">{{ meuHistorico.length }} registro(s)</span>
      </div>

      <p v-if="meuHistorico.length === 0" class="vazio">Você ainda não fez pedidos.</p>

      <ul v-else class="lista-historico">
        <li v-for="r in meuHistorico" :key="r.id" class="item-historico">
          <div class="hist-info">
            <p class="hist-nome">{{ r.nome_epi || '—' }} <span class="hist-qtd">× {{ r.quantidade || 1 }}</span></p>
            <p class="hist-setor">
              Pedido em {{ formatarDataHora(r.data_retirada) }}
              <span v-if="r.data_entrega"> · entregue em {{ formatarDataHora(r.data_entrega) }}</span>
              <span v-if="r.data_validade"> · validade {{ formatarData(r.data_validade) }}</span>
            </p>
            <p v-if="r.aprovado_por_nome" class="hist-aprovador">
              Aprovado por {{ r.aprovado_por_nome }}
              <span v-if="r.aprovado_em"> em {{ formatarDataHora(r.aprovado_em) }}</span>
            </p>
            <p v-if="r.justificativa" class="hist-just">"{{ r.justificativa }}"</p>
          </div>
          <span class="hist-status" :class="'status-' + r.status">{{ labelStatus(r.status) }}</span>
        </li>
      </ul>
    </section>
  </div>
</template>

<style scoped>
.pagina-retirada {
  background: var(--superficie-alta);
  min-height: 100vh;
  min-height: 100dvh;
  color: var(--texto-forte);
  padding: 2rem 3rem 3rem;
  width: 100%;
}

.cabecalho { margin-bottom: 2rem; }
.caminho { color: var(--texto-suave); font-size: 0.85rem; margin-bottom: 0.7rem; }
.caminho .separador { margin: 0 0.4rem; }
.caminho-atual { color: var(--texto-forte); }
.titulo-pagina { font-size: clamp(1.8rem, 4vw, 2.6rem); font-weight: 800; letter-spacing: -0.02em; margin-bottom: 0.4rem; }
.titulo-destaque { color: var(--marca); }
.subtitulo { color: var(--texto-suave); font-size: 0.95rem; }
.subtitulo strong { color: var(--texto-forte); }

.cartao {
  background: var(--superficie-elevada);
  border: 1px solid color-mix(in srgb, var(--texto-forte) 5%, transparent);
  border-radius: var(--raio);
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
  background: color-mix(in srgb, var(--marca) 10%, transparent);
  padding: 0.25rem 0.7rem; border-radius: var(--raio-pill);
}

.vazio-cartao { text-align: center; color: var(--texto-suave); }
.vazio-cartao .ajuda { font-size: 0.85rem; margin-top: 0.5rem; }

/* A legenda antiga prometia duas bolinhas coloridas que não correspondiam aos
   badges reais. Frase única, sem código de cor para decorar. */
.legenda {
  color: var(--texto-suave);
  font-size: 0.83rem;
  line-height: 1.6;
  margin-bottom: 1.1rem;
}
.legenda strong { color: var(--texto-forte); font-weight: 600; }
.legenda .legenda-aviso { color: var(--aviso); }

.grade-epis {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 0.9rem;
}

.card-epi {
  background: var(--borda);
  border: 1px solid color-mix(in srgb, var(--texto-forte) 6%, transparent);
  border-radius: var(--raio-sm);
  transition: border-color 0.15s, background 0.15s;
}
.card-epi:hover { border-color: color-mix(in srgb, var(--marca) 35%, transparent); }
.card-epi:has(.card-check:focus-visible) { outline: 2px solid var(--marca); outline-offset: 2px; }
.card-epi.selecionado { border-color: var(--marca); background: color-mix(in srgb, var(--marca) 7%, var(--borda)); }
.card-epi.precisa-aprovacao { border-color: var(--aviso); background: color-mix(in srgb, var(--aviso) 7%, var(--borda)); }

.card-alvo {
  display: flex;
  align-items: center;
  gap: 0.9rem;
  padding: 0.85rem;
  cursor: pointer;
}

/* Fora da tela mas ainda focável e operável por Espaço. */
.card-check {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}

.card-imagem {
  flex: 0 0 60px; width: 60px; height: 60px;
  border-radius: var(--raio-sm); overflow: hidden;
  background: var(--borda-forte);
  display: block;
}
.card-imagem img { width: 100%; height: 100%; object-fit: cover; }

.card-info { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 0.25rem; }
.info-topo { display: flex; align-items: center; justify-content: space-between; gap: 0.4rem; }
.epi-nome {
  color: var(--texto-forte); font-size: 1.05rem; font-weight: 700;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.epi-meta { color: var(--texto-suave); font-size: 0.85rem; }
.epi-estoque { color: var(--marca); font-size: 0.82rem; font-weight: 600; }
.em-uso { color: var(--aviso); font-weight: 600; }

.badge {
  font-size: 0.72rem; font-weight: 700; padding: 0.18rem 0.5rem;
  border-radius: var(--raio-pill);
  text-transform: uppercase; letter-spacing: 0.04em; white-space: nowrap; flex-shrink: 0;
}
.badge-limite { background: color-mix(in srgb, var(--marca) 18%, transparent); color: var(--marca); }
.badge-sem-limite { background: color-mix(in srgb, var(--ok) 15%, transparent); color: var(--ok); }

.card-marca {
  flex: 0 0 auto;
  display: flex; align-items: center; justify-content: center;
  width: 24px; height: 24px;
  border-radius: 50%;
  border: 2px solid var(--borda-forte);
  color: var(--marca-texto);
  transition: background 0.15s, border-color 0.15s;
}
.selecionado .card-marca { background: var(--marca); border-color: var(--marca); }
.precisa-aprovacao .card-marca { background: var(--aviso); border-color: var(--aviso); }

.card-controles {
  display: flex; align-items: center; justify-content: flex-end; gap: 0.5rem;
  padding: 0 0.85rem 0.85rem;
}
.btn-qtd {
  display: flex; align-items: center; justify-content: center;
  width: 2.75rem; height: 2.75rem;
  background: color-mix(in srgb, var(--marca) 15%, transparent);
  border: none; border-radius: var(--raio-sm);
  color: var(--marca);
  font-size: 1.25rem; font-weight: 700; line-height: 1; cursor: pointer;
  transition: background 0.15s;
}
.btn-qtd:hover:not(:disabled) { background: color-mix(in srgb, var(--marca) 28%, transparent); }
.btn-qtd:disabled { opacity: 0.35; cursor: not-allowed; }

.qtd-valor {
  display: flex; align-items: baseline; gap: 0.25rem;
  min-width: 3.5rem; justify-content: center;
}
.qtd-numero { color: var(--texto-forte); font-weight: 800; font-size: 1.1rem; }
.qtd-unidade { color: var(--texto-suave); font-size: 0.75rem; }

.caixa-justificativa {
  margin-top: 1.2rem;
  background: color-mix(in srgb, var(--aviso) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--aviso) 30%, transparent);
  border-radius: var(--raio-sm);
  padding: 0.9rem 1.1rem;
}
.just-rotulo {
  display: flex; align-items: flex-start; gap: 0.5rem;
  color: var(--aviso); font-size: 0.85rem; margin-bottom: 0.6rem;
}
.just-rotulo strong { color: var(--texto-forte); }
.caixa-justificativa textarea {
  width: 100%; background: var(--superficie); border: 1px solid var(--borda); color: var(--texto-forte);
  border-radius: var(--raio-sm); padding: 0.6rem 0.8rem; font-size: 0.88rem; outline: none;
  font-family: inherit; resize: vertical;
}
.caixa-justificativa textarea:focus { border-color: var(--marca); }

.barra-acao {
  display: flex; align-items: center; justify-content: space-between; gap: 1rem;
  margin-top: 1.3rem; padding: 0.9rem 1.1rem;
  background: color-mix(in srgb, var(--marca) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--marca) 25%, transparent);
  border-radius: var(--raio-sm);
}
.acao-resumo { display: flex; flex-direction: column; gap: 0.2rem; }
.acao-info { color: var(--texto-forte); font-weight: 600; font-size: 0.9rem; }
.acao-aviso { color: var(--aviso); font-size: 0.78rem; font-weight: 600; }
.btn-solicitar {
  min-height: 2.75rem;
  background: var(--marca); color: var(--marca-texto); border: none; padding: 0.7rem 1.4rem;
  border-radius: var(--raio-sm); font-size: 0.92rem; font-weight: 700; cursor: pointer;
  font-family: inherit;
  transition: background 0.2s;
}
.btn-solicitar:hover:not(:disabled) { background: var(--marca-escura); }
.btn-solicitar:disabled { opacity: 0.5; cursor: not-allowed; }

.lista-historico { list-style: none; display: flex; flex-direction: column; gap: 0.55rem; }
.item-historico {
  display: flex; align-items: center; gap: 1rem;
  background: var(--borda); border: 1px solid color-mix(in srgb, var(--texto-forte) 5%, transparent);
  border-radius: var(--raio-sm); padding: 0.8rem 1rem;
}
.hist-info { flex: 1; min-width: 0; }
.hist-nome { color: var(--texto-forte); font-weight: 700; font-size: 0.95rem; }
.hist-qtd { color: var(--marca); font-weight: 600; margin-left: 0.3rem; }
.hist-setor { color: var(--texto-suave); font-size: 0.78rem; margin-top: 0.1rem; }
.hist-aprovador { color: var(--ok); font-size: 0.78rem; margin-top: 0.1rem; }
.hist-just { color: var(--aviso); font-size: 0.78rem; margin-top: 0.2rem; font-style: italic; }

.hist-status {
  font-size: 0.7rem; font-weight: 700; padding: 0.25rem 0.65rem;
  border-radius: var(--raio-pill); text-transform: uppercase; letter-spacing: 0.04em;
  white-space: nowrap; flex-shrink: 0;
}
.status-pendente_aprovacao { background: color-mix(in srgb, var(--aviso) 12%, transparent); color: var(--aviso); border: 1px solid color-mix(in srgb, var(--aviso) 35%, transparent); }
.status-pendente_entrega   { background: color-mix(in srgb, var(--info) 12%, transparent); color: var(--info); border: 1px solid color-mix(in srgb, var(--info) 35%, transparent); }
.status-aprovado           { background: color-mix(in srgb, var(--info) 12%, transparent); color: var(--info); border: 1px solid color-mix(in srgb, var(--info) 35%, transparent); }
.status-entregue           { background: color-mix(in srgb, var(--ok) 15%, transparent); color: var(--ok); border: 1px solid color-mix(in srgb, var(--ok) 35%, transparent); }
.status-recusado           { background: color-mix(in srgb, var(--perigo) 12%, transparent); color: var(--perigo); border: 1px solid color-mix(in srgb, var(--perigo) 35%, transparent); }
.status-devolvido          { background: color-mix(in srgb, var(--texto-fraco) 12%, transparent); color: var(--texto-suave); border: 1px solid color-mix(in srgb, var(--texto-fraco) 30%, transparent); }

.vazio { color: var(--texto-suave); font-size: 0.9rem; padding: 0.5rem 0; }

@media (max-width: 700px) {
  .pagina-retirada { padding: 1.5rem 1.2rem 2rem; }
  .grade-epis { grid-template-columns: 1fr; }
  .barra-acao { flex-direction: column; align-items: stretch; }
  .btn-solicitar { width: 100%; }
}
</style>
