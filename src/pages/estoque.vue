<script setup>
import { ref, reactive, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useSupabase } from '../composables/useSupabase';
import { ajustarEstoque } from '../composables/estoque';
import { useMensagem } from '../composables/mensagem';
import { isoParaBr, brParaIso, formatarData, aplicarMascaraData } from '../composables/datas';
import Toast from '../components/Toast.vue';
import Modal from '../components/Modal.vue';
import MultiSelect from '../components/MultiSelect.vue';

const { supabase, perfil } = useSupabase();
const { mensagem, mostrarMensagem } = useMensagem();
const router = useRouter();

const modalAberto = ref(false);
const editandoId = ref(null);
const enviando = ref(false);
const setoresDisponiveis = ref([]);
const imagemArquivo = ref(null);
const imagemPreview = ref(null);
const imagemExistente = ref(null);

const form = reactive({
  nome: '', setor: [], fabricante: '', custo: '', numero_ca: '',
  data_validade: '', estoque: '', estoque_minimo: '', descricao: '',
});

const carregarSetores = async () => {
  const { data } = await supabase.from('setores').select('nome').order('nome');
  setoresDisponiveis.value = (data || []).map(s => s.nome);
};

const selecionarImagem = (e) => {
  const f = e.target.files?.[0];
  if (!f) return;
  if (!f.type.startsWith('image/')) {
    mostrarMensagem('erro', 'Selecione um arquivo de imagem.');
    return;
  }
  if (f.size > 5 * 1024 * 1024) {
    mostrarMensagem('erro', 'Imagem muito grande (máx. 5 MB).');
    return;
  }
  imagemArquivo.value = f;
  imagemPreview.value = URL.createObjectURL(f);
};

const removerImagem = () => {
  imagemArquivo.value = null;
  imagemPreview.value = null;
  imagemExistente.value = null;
};

async function uploadImagem() {
  if (!imagemArquivo.value) return imagemExistente.value || null;
  const ext = imagemArquivo.value.name.split('.').pop().toLowerCase();
  const caminho = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from('epis').upload(caminho, imagemArquivo.value, { upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from('epis').getPublicUrl(caminho);
  return data.publicUrl;
}

const iniciarEdicao = (epi) => {
  editandoId.value = epi.id;
  Object.assign(form, {
    nome: epi.nome ?? '',
    setor: epi.setor ? String(epi.setor).split(',').map(s => s.trim()).filter(Boolean) : [],
    fabricante: epi.fabricante ?? '',
    custo: epi.custo ?? '',
    numero_ca: epi.numero_ca ?? '',
    data_validade: isoParaBr(epi.data_validade),
    estoque: epi.estoque ?? '',
    estoque_minimo: epi.estoque_minimo ?? '',
    descricao: epi.descricao ?? '',
  });
  imagemArquivo.value = null;
  imagemPreview.value = null;
  imagemExistente.value = epi.imagem || null;
  modalAberto.value = true;
};

const cancelarEdicao = () => {
  modalAberto.value = false;
  editandoId.value = null;
  Object.assign(form, {
    nome: '', setor: [], fabricante: '', custo: '', numero_ca: '',
    data_validade: '', estoque: '', estoque_minimo: '', descricao: '',
  });
  removerImagem();
};

const salvarEdicao = async () => {
  if (!editandoId.value) return;
  if (!form.nome.trim()) { mostrarMensagem('erro', 'Informe o nome do EPI.'); return; }
  if (form.data_validade && !brParaIso(form.data_validade)) {
    mostrarMensagem('erro', 'Data de validade inválida (use DD/MM/AAAA).'); return;
  }
  enviando.value = true;

  let imagemUrl;
  try {
    imagemUrl = await uploadImagem();
  } catch (e) {
    enviando.value = false;
    mostrarMensagem('erro', 'Erro ao enviar a imagem: ' + e.message);
    return;
  }

  const payload = {
    ...form,
    setor: (form.setor || []).join(', '),
    custo: form.custo === '' ? null : Number(String(form.custo).replace(',', '.')),
    numero_ca: form.numero_ca === '' ? null : Number(form.numero_ca),
    estoque: form.estoque === '' ? null : Number(form.estoque),
    estoque_minimo: form.estoque_minimo === '' ? null : Number(form.estoque_minimo),
    data_validade: brParaIso(form.data_validade),
  };
  if (imagemUrl) payload.imagem = imagemUrl;

  const { error } = await supabase.from('epis').update(payload).eq('id', editandoId.value);
  enviando.value = false;
  if (error) {
    mostrarMensagem('erro', 'Erro ao atualizar: ' + error.message);
    return;
  }
  mostrarMensagem('sucesso', 'EPI atualizado com sucesso!');
  cancelarEdicao();
  carregar();
};

const epis = ref([]);
const carregando = ref(true);

const podeAdministrar = computed(() => ['admin', 'almoxarife'].includes(perfil.value?.role));

const LIMITE_PADRAO = { aluno: 1, professor: 30 };

const carregar = async () => {
  carregando.value = true;

  const role = perfil.value?.role;
  if (!role) {
    epis.value = [];
    carregando.value = false;
    return;
  }

  if (podeAdministrar.value) {
    const { data, error } = await supabase.from('epis').select('*').order('nome');
    if (error) console.error(error);
    epis.value = data || [];
    carregando.value = false;
    return;
  }

  const meusSetores = (perfil.value?.setores || []).map(s => s.nome);
  if (meusSetores.length === 0) {
    epis.value = [];
    carregando.value = false;
    return;
  }

  const { data: todos } = await supabase.from('epis').select('*').order('nome');
  const limitePadrao = LIMITE_PADRAO[role] ?? 0;

  const setorIds = (perfil.value?.setores || []).map(s => s.id);
  const { data: overrides } = await supabase
    .from('epi_permissoes')
    .select('epi_id, limite')
    .eq('role', role)
    .in('setor_id', setorIds.length ? setorIds : [-1]);
  const overrideMap = new Map();
  for (const o of (overrides || [])) {
    const atual = overrideMap.get(o.epi_id) ?? -1;
    if (o.limite > atual) overrideMap.set(o.epi_id, o.limite);
  }

  epis.value = (todos || [])
    .filter(e => String(e.setor || '').split(',').map(s => s.trim()).some(s => meusSetores.includes(s)))
    .map(e => ({ ...e, limite: overrideMap.has(e.id) ? overrideMap.get(e.id) : limitePadrao }));

  carregando.value = false;
};

onMounted(() => {
  carregar();
  carregarSetores();
});

watch(() => perfil.value?.id, () => { carregar(); });

const expandido = ref(null);
const toggleCard = (id) => { expandido.value = expandido.value === id ? null : id; };

const estoquebaixo = (epi) => {
  const qtd = Number(epi.estoque);
  const min = Number(epi.estoque_minimo);
  return !isNaN(qtd) && !isNaN(min) && min > 0 && qtd <= min;
};

const quantidadeAdicionar = ref({});

const adicionarEstoque = async (epi) => {
  const qtd = parseInt(quantidadeAdicionar.value[epi.id], 10);
  if (isNaN(qtd) || qtd <= 0) return;

  const r = await ajustarEstoque(supabase, epi.id, epi.estoque, qtd);
  if (!r.ok) {
    if (r.error) console.error(r.error);
    mostrarMensagem('erro', r.motivo === 'conflito'
      ? 'O estoque mudou enquanto você editava. Recarregando.'
      : 'Erro ao adicionar ao estoque.');
    await carregar();
    return;
  }
  quantidadeAdicionar.value[epi.id] = '';
  mostrarMensagem('sucesso', `+${qtd} un. em ${epi.nome}.`);
  await carregar();
};

const excluir = async (epi) => {
  if (!confirm(`Excluir "${epi.nome}"? Esta ação não pode ser desfeita.`)) return;
  const { error } = await supabase.from('epis').delete().eq('id', epi.id);
  if (error) {
    console.error(error);
    mostrarMensagem('erro', 'Erro ao excluir: ' + error.message);
    return;
  }
  mostrarMensagem('sucesso', 'EPI excluído.');
  await carregar();
};
</script>

<template>
  <div class="pagina-estoque">
    <Toast :mensagem="mensagem" />

    <header class="cabecalho">
      <div class="cabecalho-texto">
        <p class="caminho">
          Estoque &amp; EPIs <span class="separador" aria-hidden="true">›</span>
          <span class="caminho-atual">Estoque</span>
        </p>
        <h1 class="titulo-pagina">Controle de <span class="titulo-destaque">Estoque</span></h1>
        <p class="subtitulo">Acompanhe quantidades, validades e reposição dos EPIs.</p>
      </div>

      <button v-if="podeAdministrar" type="button" class="botao-cadastrar" @click="router.push('/cadastro_epi')">
        + Cadastrar EPI
      </button>
    </header>

    <p v-if="carregando" class="estado-carregando">Carregando…</p>

    <!-- Vazio de admin não existia: quem ainda não cadastrou nada via só uma
         caixa cinza, sem caminho para o primeiro cadastro. -->
    <section v-else-if="epis.length === 0" class="estoque-vazio">
      <template v-if="podeAdministrar">
        <h2>Nenhum EPI cadastrado ainda</h2>
        <p>Cadastre o primeiro equipamento para começar a controlar estoque, validade e retiradas.</p>
        <button type="button" class="botao-cadastrar" @click="router.push('/cadastro_epi')">
          + Cadastrar primeiro EPI
        </button>
      </template>
      <template v-else>
        <h2>Nenhum EPI liberado para o seu setor</h2>
        <p>Procure o administrador para configurar suas permissões.</p>
      </template>
    </section>

    <section v-else class="lista-epis">
      <article
        v-for="epi in epis"
        :key="epi.id"
        class="card-epi"
        :class="{ 'card-expandido': expandido === epi.id }"
      >
        <div class="card-principal">
          <div class="card-imagem">
            <img loading="lazy" decoding="async" v-if="epi.imagem" :src="epi.imagem" alt="" />
          </div>

          <div class="card-info">
            <div class="card-cabecalho">
              <div class="card-titulo">
                <h2 class="epi-nome">{{ epi.nome }}</h2>
                <p class="epi-fabricante">Fabricante: <span>{{ epi.fabricante || 'não informado' }}</span></p>
              </div>
              <span v-if="estoquebaixo(epi)" class="badge-alerta">Estoque baixo</span>
            </div>

            <dl class="card-meta">
              <div class="meta-chip">
                <dt>CA</dt>
                <dd>#{{ epi.numero_ca || '—' }}</dd>
              </div>
              <div class="meta-chip">
                <dt>Validade</dt>
                <dd>{{ formatarData(epi.data_validade) }}</dd>
              </div>
              <div class="meta-chip">
                <dt>Custo</dt>
                <dd>{{ epi.custo ? `R$ ${epi.custo}` : '—' }}</dd>
              </div>
            </dl>
          </div>

          <p class="card-estoque">
            <span class="estoque-label">Em estoque</span>
            <span class="estoque-numero" :class="{ 'estoque-numero-alerta': estoquebaixo(epi) }">
              {{ epi.estoque || 0 }}
            </span>
            <span class="estoque-minimo">mín. {{ epi.estoque_minimo || 0 }} un.</span>
          </p>

          <button v-if="podeAdministrar" type="button" class="btn-detalhes" @click="router.push(`/epi/${epi.id}`)">
            Ver detalhes
          </button>
          <p v-else-if="epi.limite != null" class="badge-limite">
            Limite por pedido: <strong>{{ epi.limite }}</strong>
          </p>

          <button
            type="button"
            class="btn-expandir"
            :aria-expanded="expandido === epi.id"
            :aria-controls="`detalhe-${epi.id}`"
            :aria-label="expandido === epi.id ? `Recolher ${epi.nome}` : `Expandir ${epi.nome}`"
            @click="toggleCard(epi.id)"
          >
            <svg
              :class="{ rotacionado: expandido === epi.id }"
              width="20" height="20" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" stroke-width="2.5"
              stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </div>

        <div v-if="expandido === epi.id" :id="`detalhe-${epi.id}`" class="card-detalhe">
          <div class="detalhe-topo">
            <div class="detalhe-descricao">
              <h3 class="campo-label">Descrição</h3>
              <p class="descricao-texto">{{ epi.descricao || 'Sem descrição cadastrada.' }}</p>
            </div>

            <div class="detalhe-acoes">
              <p class="setor-info">
                <span class="campo-label">Setor de uso:</span>
                <span class="campo-valor">{{ epi.setor || '—' }}</span>
              </p>

              <div v-if="podeAdministrar" class="acoes-secundarias">
                <button type="button" class="btn-acao btn-editar" @click="iniciarEdicao(epi)">Editar</button>
                <button type="button" class="btn-acao btn-excluir" @click="excluir(epi)">Excluir</button>
              </div>
            </div>
          </div>

          <div v-if="podeAdministrar" class="add-estoque-panel">
            <div class="add-estoque-texto">
              <h3 class="notificacao-titulo">Adicionar estoque</h3>
              <p class="notificacao-sub">
                Estoque atual: <strong>{{ epi.estoque || 0 }}</strong> unidades. Informe a quantidade a somar.
              </p>
            </div>
            <div class="add-estoque-controles">
              <label class="sr-only" :for="`add-${epi.id}`">Quantidade a adicionar em {{ epi.nome }}</label>
              <input
                :id="`add-${epi.id}`"
                type="number"
                min="1"
                placeholder="Qtd."
                class="input-qtd"
                v-model="quantidadeAdicionar[epi.id]"
                @keyup.enter="adicionarEstoque(epi)"
              />
              <button
                type="button"
                class="btn-acao btn-adicionar"
                :disabled="!quantidadeAdicionar[epi.id] || quantidadeAdicionar[epi.id] <= 0"
                @click="adicionarEstoque(epi)"
              >
                + Adicionar
              </button>
            </div>
          </div>
        </div>
      </article>
    </section>

    <Modal v-if="modalAberto" titulo="Editar EPI" @fechar="cancelarEdicao">
      <template #titulo>Editar <span class="titulo-destaque">EPI</span></template>

      <form class="modal-corpo" @submit.prevent="salvarEdicao">
        <div class="modal-grade">
          <div class="campo">
            <label for="est-nome">Nome do EPI</label>
            <input id="est-nome" v-model="form.nome" type="text" />
          </div>

          <MultiSelect
            v-model="form.setor"
            :opcoes="setoresDisponiveis"
            rotulo="Setores de uso"
            placeholder="Selecione um ou mais setores"
            vazio="Nenhum setor cadastrado."
          />

          <div class="campo">
            <label for="est-fabricante">Fabricante</label>
            <input id="est-fabricante" v-model="form.fabricante" type="text" />
          </div>

          <div class="campo">
            <label for="est-custo">Custo</label>
            <input id="est-custo" v-model="form.custo" type="text" inputmode="decimal" />
          </div>

          <div class="campo">
            <label for="est-ca">Número do CA</label>
            <input id="est-ca" v-model="form.numero_ca" type="number" />
          </div>

          <div class="campo">
            <label for="est-validade">Data de Validade</label>
            <input
              id="est-validade"
              :value="form.data_validade"
              @input="aplicarMascaraData($event, form, 'data_validade')"
              type="text" placeholder="dd/mm/aaaa" maxlength="10" inputmode="numeric"
            />
          </div>

          <div class="campo">
            <label for="est-estoque">Estoque</label>
            <input id="est-estoque" v-model="form.estoque" type="number" />
          </div>

          <div class="campo">
            <label for="est-estoque-minimo">Estoque mínimo</label>
            <input id="est-estoque-minimo" v-model="form.estoque_minimo" type="number" />
          </div>

          <div class="campo campo-largo">
            <label for="est-descricao">Descrição</label>
            <textarea id="est-descricao" v-model="form.descricao" rows="3" maxlength="200"></textarea>
          </div>

          <div class="campo campo-largo">
            <span class="rotulo-grupo">Imagem</span>
            <div v-if="imagemPreview || imagemExistente" class="preview-imagem-modal">
              <img loading="lazy" decoding="async" :src="imagemPreview || imagemExistente" alt="Imagem do EPI" />
              <div class="preview-acoes">
                <label class="btn-trocar">
                  Trocar
                  <input type="file" accept="image/png, image/jpeg, image/webp" hidden @change="selecionarImagem" />
                </label>
                <button type="button" class="btn-remover" @click="removerImagem">Remover</button>
              </div>
            </div>
            <label v-else class="area-upload-modal">
              Clique para enviar imagem
              <input type="file" accept="image/png, image/jpeg, image/webp" hidden @change="selecionarImagem" />
            </label>
          </div>
        </div>

        <footer class="modal-rodape">
          <button type="button" class="botao botao-cancelar" @click="cancelarEdicao">Cancelar</button>
          <button type="submit" class="botao botao-salvar" :disabled="enviando">
            {{ enviando ? 'Salvando…' : 'Salvar alterações' }}
          </button>
        </footer>
      </form>
    </Modal>
  </div>
</template>

<style scoped>
.pagina-estoque {
  background: var(--superficie-alta);
  min-height: 100vh;
  min-height: 100dvh;
  color: var(--texto-forte);
  width: 100%;
  padding: 2rem 3rem 3rem;
}

.sr-only {
  position: absolute; width: 1px; height: 1px;
  padding: 0; margin: -1px; overflow: hidden;
  clip-path: inset(50%); white-space: nowrap; border: 0;
}

.cabecalho {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1.5rem;
  margin-bottom: 2.5rem;
}

.botao-cadastrar {
  min-height: 2.75rem;
  background: var(--marca);
  color: var(--marca-texto);
  border: none;
  padding: 0.75rem 1.3rem;
  border-radius: var(--raio-sm);
  font-size: 0.92rem;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.2s;
  white-space: nowrap;
  flex-shrink: 0;
}
.botao-cadastrar:hover { background: var(--marca-escura); }

.caminho { color: var(--texto-suave); font-size: 0.85rem; margin-bottom: 0.7rem; }
.caminho .separador { margin: 0 0.4rem; }
.caminho-atual { color: var(--texto-forte); }

.titulo-pagina {
  font-size: clamp(1.8rem, 4vw, 2.6rem);
  font-weight: 800;
  letter-spacing: -0.02em;
  margin-bottom: 0.4rem;
}
.titulo-destaque { color: var(--marca); }
.subtitulo { color: var(--texto-suave); font-size: 0.95rem; }

.estado-carregando { color: var(--texto-suave); }

.estoque-vazio {
  background: color-mix(in srgb, var(--marca) 6%, transparent);
  border: 1px dashed color-mix(in srgb, var(--marca) 35%, transparent);
  color: var(--texto);
  text-align: center;
  padding: 3rem 2rem;
  border-radius: var(--raio);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.6rem;
}
.estoque-vazio h2 { color: var(--texto-forte); font-size: 1.15rem; font-weight: 700; }
.estoque-vazio p { font-size: 0.92rem; max-width: 34rem; }
.estoque-vazio .botao-cadastrar { margin-top: 0.8rem; }

.lista-epis {
  background: var(--superficie-elevada);
  border: 1px solid color-mix(in srgb, var(--texto-forte) 5%, transparent);
  border-radius: var(--raio);
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.card-epi {
  background: linear-gradient(180deg, var(--borda) 0%, var(--superficie-elevada) 100%);
  border: 1px solid color-mix(in srgb, var(--texto-forte) 5%, transparent);
  border-radius: var(--raio-sm);
  overflow: hidden;
  transition: border-color 0.2s, transform 0.15s, box-shadow 0.2s;
}
.card-epi:hover {
  border-color: color-mix(in srgb, var(--marca) 30%, transparent);
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgb(0 0 0 / 0.25);
}
.card-expandido {
  border-color: color-mix(in srgb, var(--marca) 45%, transparent);
  box-shadow: 0 4px 14px color-mix(in srgb, var(--marca) 8%, transparent);
}

.card-principal {
  display: flex;
  align-items: stretch;
  gap: 1.4rem;
  padding: 1.1rem 1.4rem;
}

.card-imagem {
  flex: 0 0 96px;
  width: 96px;
  height: 96px;
  border-radius: var(--raio-sm);
  overflow: hidden;
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--marca) 8%, transparent), transparent 60%),
    var(--borda-forte);
  border: 1px solid color-mix(in srgb, var(--texto-forte) 5%, transparent);
  align-self: center;
}
.card-imagem img { width: 100%; height: 100%; object-fit: cover; }

.card-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.9rem;
  justify-content: center;
}

.card-cabecalho {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}
.card-titulo { display: flex; flex-direction: column; gap: 0.15rem; min-width: 0; }

.epi-nome {
  color: var(--texto-forte);
  font-size: 1.35rem;
  font-weight: 700;
  letter-spacing: -0.015em;
  line-height: 1.2;
}
.epi-fabricante { color: var(--texto-suave); font-size: 0.85rem; }
.epi-fabricante span { color: var(--texto); font-weight: 600; }

.card-meta { display: flex; flex-wrap: wrap; gap: 0.5rem 1.2rem; }
.meta-chip { display: inline-flex; align-items: baseline; gap: 0.4rem; font-size: 0.85rem; }
.meta-chip dt {
  color: var(--marca);
  font-weight: 700;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.meta-chip dd { color: var(--texto); font-weight: 500; }

.card-estoque {
  flex: 0 0 auto;
  align-self: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.15rem;
  min-width: 110px;
  padding: 0.6rem 1rem;
}
.estoque-label {
  color: var(--marca);
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}
.estoque-numero {
  color: var(--texto-forte);
  font-size: 2rem;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.02em;
}
.estoque-numero-alerta { color: var(--perigo); }
.estoque-minimo { color: var(--texto-suave); font-size: 0.72rem; }

.btn-detalhes {
  flex: 0 0 auto;
  align-self: center;
  min-height: 2.75rem;
  background: transparent;
  border: 1px solid color-mix(in srgb, var(--marca) 40%, transparent);
  color: var(--marca);
  font-size: 0.82rem;
  font-weight: 600;
  font-family: inherit;
  padding: 0.55rem 0.9rem;
  border-radius: var(--raio-sm);
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s, border-color 0.15s;
}
.btn-detalhes:hover {
  background: color-mix(in srgb, var(--marca) 12%, transparent);
  border-color: var(--marca);
}

.badge-limite {
  align-self: center;
  background: color-mix(in srgb, var(--marca) 10%, transparent);
  border: 1px solid color-mix(in srgb, var(--marca) 35%, transparent);
  color: var(--marca);
  font-size: 0.78rem;
  font-weight: 600;
  padding: 0.45rem 0.85rem;
  border-radius: var(--raio-sm);
  white-space: nowrap;
}
.badge-limite strong { color: var(--texto-forte); font-weight: 800; }

.badge-alerta {
  flex: 0 0 auto;
  background: color-mix(in srgb, var(--perigo) 12%, transparent);
  border: 1px solid color-mix(in srgb, var(--perigo) 40%, transparent);
  color: var(--perigo);
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.28rem 0.7rem;
  border-radius: var(--raio-pill);
  white-space: nowrap;
}

.btn-expandir {
  flex: 0 0 auto;
  align-self: center;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  background: none;
  border: none;
  color: var(--marca);
  cursor: pointer;
  border-radius: var(--raio-sm);
  transition: background 0.15s;
}
.btn-expandir:hover { background: color-mix(in srgb, var(--marca) 12%, transparent); }
.btn-expandir svg { transition: transform 0.25s ease; }
.btn-expandir svg.rotacionado { transform: rotate(180deg); }

.card-detalhe {
  border-top: 1px solid color-mix(in srgb, var(--texto-forte) 6%, transparent);
  padding: 1rem 1.4rem 1.2rem;
  animation: detalhe-entra 0.2s ease;
}
@keyframes detalhe-entra {
  from { opacity: 0; transform: translateY(-6px); }
  to   { opacity: 1; transform: none; }
}

.detalhe-topo {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1.5rem;
  margin-bottom: 1.2rem;
}
.detalhe-descricao { display: flex; flex-direction: column; gap: 0.4rem; min-width: 0; }
.descricao-texto { color: var(--texto); font-size: 0.88rem; line-height: 1.65; }

.campo-label { font-size: 0.75rem; font-weight: 700; color: var(--marca); text-transform: uppercase; letter-spacing: 0.05em; }
.campo-valor { font-size: 0.9rem; color: var(--texto-forte); }

.detalhe-acoes {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.7rem;
  flex-shrink: 0;
}
.setor-info { display: flex; align-items: baseline; gap: 0.4rem; font-size: 0.85rem; }

.acoes-secundarias { display: flex; gap: 0.5rem; }

.btn-acao {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.75rem;
  border: none;
  border-radius: var(--raio-sm);
  padding: 0.45rem 1rem;
  font-size: 0.82rem;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  transition: background 0.15s, opacity 0.15s;
}
.btn-editar { background: color-mix(in srgb, var(--marca) 12%, transparent); color: var(--marca); }
.btn-editar:hover { background: color-mix(in srgb, var(--marca) 22%, transparent); }
.btn-excluir { background: color-mix(in srgb, var(--perigo) 12%, transparent); color: var(--perigo); }
.btn-excluir:hover { background: color-mix(in srgb, var(--perigo) 22%, transparent); }

.add-estoque-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
  background: color-mix(in srgb, var(--marca) 6%, transparent);
  border: 1px solid color-mix(in srgb, var(--marca) 20%, transparent);
  border-radius: var(--raio-sm);
  padding: 0.7rem 1rem;
}
.add-estoque-texto { display: flex; flex-direction: column; gap: 0.1rem; }
.notificacao-titulo { color: var(--texto-forte); font-size: 0.85rem; font-weight: 600; }
.notificacao-sub { color: var(--texto-suave); font-size: 0.75rem; margin-top: 0.1rem; }
.notificacao-sub strong { color: var(--texto-forte); }

.add-estoque-controles { display: flex; align-items: center; gap: 0.5rem; flex-shrink: 0; }

.input-qtd {
  width: 5rem;
  min-height: 2.75rem;
  background: var(--borda);
  border: 1px solid color-mix(in srgb, var(--marca) 30%, transparent);
  color: var(--texto-forte);
  border-radius: var(--raio-sm);
  padding: 0.4rem 0.6rem;
  font-size: 0.85rem;
  font-family: inherit;
  outline: none;
  transition: border-color 0.15s;
}
.input-qtd::placeholder { color: var(--texto-fraco); }
.input-qtd:focus { border-color: var(--marca); }

.btn-adicionar { background: color-mix(in srgb, var(--marca) 15%, transparent); color: var(--marca); white-space: nowrap; }
.btn-adicionar:hover:not(:disabled) { background: color-mix(in srgb, var(--marca) 28%, transparent); }
.btn-adicionar:disabled { opacity: 0.4; cursor: not-allowed; }

input[type="number"]::-webkit-outer-spin-button,
input[type="number"]::-webkit-inner-spin-button { appearance: none; margin: 0; }
input[type="number"] { appearance: textfield; -moz-appearance: textfield; }

/* --- Modal --- */
.modal-corpo { padding: 1.2rem 1.5rem; overflow-y: auto; flex: 1; }
.modal-grade { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem 1.2rem; }
.campo-largo { grid-column: 1 / -1; }

.modal-rodape {
  display: flex; justify-content: flex-end; gap: 0.7rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--borda);
  background: var(--superficie-alta);
  position: sticky;
  bottom: 0;
}

.campo { display: flex; flex-direction: column; gap: 0.4rem; }
.campo label, .campo .rotulo-grupo { color: var(--texto); font-size: 0.82rem; font-weight: 500; }
.campo input, .campo textarea {
  background: var(--superficie); border: 1px solid var(--borda);
  border-radius: var(--raio-sm); padding: 0.7rem 0.85rem;
  color: var(--texto-forte); font-size: 0.88rem; outline: none;
  width: 100%; font-family: inherit; transition: border-color 0.2s;
}
.campo input:focus, .campo textarea:focus { border-color: var(--marca); }
.campo textarea { resize: vertical; }

.preview-imagem-modal { display: flex; flex-direction: column; gap: 0.6rem; }
.preview-imagem-modal img {
  width: 100%; max-height: 180px; object-fit: cover;
  border-radius: var(--raio-sm); border: 1px solid var(--borda);
}
.preview-acoes { display: flex; gap: 0.5rem; }

.btn-trocar, .btn-remover {
  flex: 1;
  display: inline-flex; align-items: center; justify-content: center;
  min-height: 2.75rem;
  padding: 0.5rem 0.7rem; border-radius: var(--raio-sm);
  font-size: 0.82rem; font-weight: 600; cursor: pointer; font-family: inherit;
}
.btn-trocar {
  background: color-mix(in srgb, var(--marca) 12%, transparent); color: var(--marca);
  border: 1px solid color-mix(in srgb, var(--marca) 40%, transparent);
}
.btn-trocar:hover { background: color-mix(in srgb, var(--marca) 22%, transparent); }
.btn-remover {
  background: color-mix(in srgb, var(--perigo) 12%, transparent); color: var(--perigo);
  border: 1px solid color-mix(in srgb, var(--perigo) 30%, transparent);
}
.btn-remover:hover { background: color-mix(in srgb, var(--perigo) 22%, transparent); }

.area-upload-modal {
  display: flex; align-items: center; justify-content: center;
  padding: 1.4rem; border: 2px dashed var(--borda-forte); border-radius: var(--raio-sm);
  background: var(--superficie-alta); cursor: pointer; color: var(--texto-suave); font-size: 0.85rem;
  transition: border-color 0.15s;
}
.area-upload-modal:hover { border-color: var(--marca); }

.botao {
  min-height: 2.75rem;
  border: none; padding: 0.6rem 1.2rem; border-radius: var(--raio-sm);
  font-size: 0.88rem; font-weight: 700; cursor: pointer; font-family: inherit;
}
.botao-cancelar { background: var(--borda); color: var(--texto-forte); border: 1px solid var(--borda-forte); }
.botao-cancelar:hover { background: var(--borda-forte); }
.botao-salvar { background: var(--marca); color: var(--marca-texto); }
.botao-salvar:hover:not(:disabled) { background: var(--marca-escura); }
.botao-salvar:disabled { opacity: 0.5; cursor: not-allowed; }

@media (max-width: 960px) {
  .pagina-estoque { padding: 1.5rem 1.2rem 2rem; }
  .modal-grade { grid-template-columns: 1fr; }
  .card-principal { flex-wrap: wrap; }
  .card-estoque {
    flex: 1 1 100%;
    flex-direction: row;
    align-items: baseline;
    justify-content: space-between;
    padding: 0.7rem 0;
  }
  .estoque-numero { font-size: 1.5rem; }
  .detalhe-topo { flex-direction: column; }
  .detalhe-acoes { align-items: flex-start; width: 100%; }
}

@media (max-width: 600px) {
  .cabecalho { flex-direction: column; }
  .botao-cadastrar { width: 100%; }
  .card-imagem { flex-basis: 64px; width: 64px; height: 64px; }
  .add-estoque-panel { flex-direction: column; align-items: stretch; }
  .add-estoque-controles { justify-content: space-between; }
}
</style>
