<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useSupabase } from '../composables/useSupabase';
import { ajustarEstoque } from '../composables/estoque';

const { supabase, perfil } = useSupabase();
const router = useRouter();

const modalAberto = ref(false);
const editandoId = ref(null);
const enviando = ref(false);
const mensagem = ref(null);
const setoresDisponiveis = ref([]);
const setorAberto = ref(false);
const imagemArquivo = ref(null);
const imagemPreview = ref(null);
const imagemExistente = ref(null);

const form = reactive({
  nome: '',
  setor: [],
  fabricante: '',
  custo: '',
  numero_ca: '',
  data_validade: '',
  estoque: '',
  estoque_minimo: '',
  descricao: '',
});

const isoParaBr = (iso) => {
  if (!iso) return '';
  const [a, m, d] = String(iso).split('T')[0].split('-');
  return a && m && d ? `${d}/${m}/${a}` : '';
};
const brParaIso = (br) => {
  if (!br) return null;
  const m = String(br).match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  return `${m[3]}-${m[2]}-${m[1]}`;
};
const aplicarMascaraData = (e) => {
  let v = e.target.value.replace(/\D/g, '').slice(0, 8);
  if (v.length >= 5) v = `${v.slice(0,2)}/${v.slice(2,4)}/${v.slice(4)}`;
  else if (v.length >= 3) v = `${v.slice(0,2)}/${v.slice(2)}`;
  e.target.value = v;
  form.data_validade = v;
};

const mostrarMensagem = (tipo, texto) => {
  mensagem.value = { tipo, texto };
  setTimeout(() => { mensagem.value = null; }, 3500);
};

const carregarSetores = async () => {
  const { data } = await supabase.from('setores').select('nome').order('nome');
  setoresDisponiveis.value = (data || []).map(s => s.nome);
};

const toggleSetor = (nome) => {
  const idx = form.setor.indexOf(nome);
  if (idx >= 0) form.setor.splice(idx, 1);
  else form.setor.push(nome);
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
  const { error } = await supabase.storage
    .from('epis')
    .upload(caminho, imagemArquivo.value, { upsert: false });
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

const aoTeclar = (e) => {
  if (e.key === 'Escape' && modalAberto.value) cancelarEdicao();
};
onUnmounted(() => window.removeEventListener('keydown', aoTeclar));

const cancelarEdicao = () => {
  modalAberto.value = false;
  editandoId.value = null;
  setorAberto.value = false;
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

const irParaCadastro = () => {
  router.push('/cadastro_epi');
};

const verDetalhes = (id) => {
  router.push(`/epi/${id}`);
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
  window.addEventListener('keydown', aoTeclar);
  carregar();
  carregarSetores();
});

watch(() => perfil.value?.id, () => { carregar(); });

const expandido = ref(null);

const toggleCard = (id) => {
  expandido.value = expandido.value === id ? null : id;
};

const formatarData = (data) => {
  if (!data) return '—';
  const [ano, mes, dia] = String(data).split('T')[0].split('-');
  if (!ano || !mes || !dia) return data;
  return `${dia}/${mes}/${ano}`;
};

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
  await carregar();
};

const excluir = async(id) =>{
  const confirmado = confirm('Deseja realmente excluir este cadastro?');
  if (!confirmado) return;

  const { error } = await supabase.from('epis').delete().eq('id', id);
  if (error){
    console.error(error);
    return;
  }
  await carregar();
};

</script>

<template>
  <div class="pagina-estoque">

    <div v-if="mensagem" :class="['toast', 'toast-' + mensagem.tipo]">{{ mensagem.texto }}</div>

    <header class="cabecalho">
      <div class="cabecalho-texto">
        <p class="caminho">
          Estoque &amp; EPIs <span class="separador">›</span>
          <span class="caminho-atual">Estoque</span>
        </p>
        <h1 class="titulo-pagina">Controle de <span class="titulo-destaque">Estoque</span></h1>
        <p class="subtitulo">Aqui é onde vai controlar o estoque de EPIs da sua empresa.</p>
      </div>

      <button v-if="podeAdministrar" type="button" class="botao-cadastrar" @click="irParaCadastro">
        + Cadastrar EPI
      </button>
    </header>

    <p v-if="carregando">Carregando...</p>
    <p v-else-if="epis.length === 0 && !podeAdministrar" class="estoque-vazio">
      Nenhum EPI liberado para o seu setor ainda. Procure o administrador para configurar suas permissões.
    </p>
    <section v-else class="lista-epis">
      <div
        v-for="epi in epis"
        :key="epi.id"
        class="card-epi"
        :class="{ 'card-expandido': expandido === epi.id }"
      >
        <div class="card-principal">
          <div class="card-imagem">
            <img loading="lazy" decoding="async" v-if="epi.imagem" :src="epi.imagem" :alt="epi.nome" />
            <div v-else class="imagem-placeholder"></div>
          </div>

          <div class="card-info">
            <div class="card-cabecalho">
              <div class="card-titulo">
                <p class="epi-nome">{{ epi.nome }}</p>
                <p class="epi-fabricante">Fabricante: <span>{{ epi.fabricante || 'não informado' }}</span></p>
              </div>
              <span v-if="estoquebaixo(epi)" class="badge-alerta">● Estoque baixo</span>
            </div>

            <div class="card-meta">
              <div class="meta-chip">
                <span class="meta-label">CA:</span>
                <span class="meta-valor">#{{ epi.numero_ca || '—' }}</span>
              </div>
              <div class="meta-chip">
                <span class="meta-label">Validade:</span>
                <span class="meta-valor">{{ formatarData(epi.data_validade) }}</span>
              </div>
              <div class="meta-chip">
                <span class="meta-label">Custo:</span>
                <span class="meta-valor">R$ {{ epi.custo || '—' }}</span>
              </div>
            </div>
          </div>

          <div class="card-estoque">
            <span class="estoque-label">Em estoque</span>
            <span class="estoque-numero" :class="{ 'estoque-numero-alerta': estoquebaixo(epi) }">
              {{ epi.estoque || 0 }}
            </span>
            <span class="estoque-minimo">mín. {{ epi.estoque_minimo || 0 }} un.</span>
          </div>

          <button type="button" v-if="podeAdministrar" class="btn-detalhes" @click.stop="verDetalhes(epi.id)">
            Ver mais detalhes →
          </button>
          <div v-else-if="epi.limite != null" class="badge-limite" title="Limite por pedido sem precisar de aprovação">
            Limite: <strong>{{ epi.limite }}</strong>
          </div>

          <button type="button" class="btn-expandir" @click="toggleCard(epi.id)">
            <svg
              :class="{ rotacionado: expandido === epi.id }"
              width="20" height="20" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" stroke-width="2.5"
              stroke-linecap="round" stroke-linejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </button>
        </div>

        <div v-if="expandido === epi.id" class="card-detalhe">
          <div class="detalhe-topo">
            <div class="detalhe-descricao">
              <span class="campo-label">Descrição</span>
              <p class="descricao-texto">{{ epi.descricao }}</p>
            </div>

            <div class="detalhe-acoes">
              <div class="setor-info">
                <span class="campo-label">Setor de uso:</span>
                <span class="campo-valor">{{ epi.setor || '—' }}</span>
              </div>

              <div v-if="podeAdministrar" class="acoes-secundarias">
                <button type="button" class="btn-acao btn-editar" title="Editar" @click="iniciarEdicao(epi)">
                  Editar
                </button>
                <button type="button" class="btn-acao btn-excluir" title="Excluir" @click = "excluir(epi.id)">
                  Excluir
                </button>
              </div>
            </div>
          </div>

          <div v-if="podeAdministrar" class="detalhe-rodape">
            <div class="detalhe-notificacao">
              <div class="notificacao-texto"><div>
                  <p class="notificacao-titulo">Notificação de estoque mínimo</p>
                  <p class="notificacao-sub">Receber alerta quando o estoque atingir {{ epi.estoque_minimo }} unidades em estoque.</p>
                </div>
              </div>
              <button type="button" class="toggle">
                <span class="toggle-bolinha"></span>
              </button>
            </div>

            <div class="add-estoque-panel">
              <div class="add-estoque-texto">
                <p class="notificacao-titulo">Adicionar estoque</p>
                <p class="notificacao-sub">
                  Estoque atual: <strong>{{ epi.estoque || 0 }}</strong> unidades. Informe a quantidade a somar ao estoque.
                </p>
              </div>
              <div class="add-estoque-controles">
                <input
                  type="number"
                  min="1"
                  placeholder="Qtd."
                  class="input-qtd"
                  v-model="quantidadeAdicionar[epi.id]"
                  @keyup.enter="adicionarEstoque(epi)"
                />
                <button type="button"
                  class="btn-acao btn-adicionar"
                  title="Adicionar unidades ao estoque"
                  :disabled="!quantidadeAdicionar[epi.id] || quantidadeAdicionar[epi.id] <= 0"
                  @click="adicionarEstoque(epi)"
                >
                  + Adicionar
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <div v-if="modalAberto" class="modal-overlay" role="dialog" aria-modal="true" @click.self="cancelarEdicao">
      <div class="modal">
        <header class="modal-cabecalho">
          <h2>Editar <span class="titulo-destaque">EPI</span></h2>
          <button type="button" class="modal-fechar" @click="cancelarEdicao">×</button>
        </header>

        <form class="modal-corpo" @submit.prevent="salvarEdicao">
          <div class="modal-grade">
            <div class="campo">
              <label for="est-nome-do-epi">Nome do EPI</label>
              <input id="est-nome-do-epi" v-model="form.nome" type="text" />
            </div>

            <div class="campo">
              <span class="rotulo-grupo">Setores de uso</span>
              <div class="multi-select" :class="{ aberto: setorAberto }">
                <button type="button" class="multi-select-trigger" @click="setorAberto = !setorAberto">
                  <span v-if="form.setor.length === 0" class="ms-placeholder">Selecione um ou mais setores</span>
                  <span v-else class="ms-tags">
                    <span class="ms-tag" v-for="s in form.setor" :key="s">
                      {{ s }}
                      <button type="button" class="ms-tag-x" @click.stop="toggleSetor(s)" :aria-label="`Remover setor ${s}`">×</button>
                    </span>
                  </span>
                  <span class="ms-seta">▾</span>
                </button>
                <div v-if="setorAberto" class="multi-select-menu">
                  <label v-for="nome in setoresDisponiveis" :key="nome" class="ms-opcao">
                    <input type="checkbox" :value="nome" v-model="form.setor" />
                    <span>{{ nome }}</span>
                  </label>
                  <p v-if="setoresDisponiveis.length === 0" class="ms-vazio">Nenhum setor cadastrado.</p>
                </div>
              </div>
            </div>

            <div class="campo">
              <label for="est-fabricante">Fabricante</label>
              <input id="est-fabricante" v-model="form.fabricante" type="text" />
            </div>

            <div class="campo">
              <label for="est-custo">Custo</label>
              <input id="est-custo" v-model="form.custo" type="text" />
            </div>

            <div class="campo">
              <label for="est-numero-do-ca">Número do CA</label>
              <input id="est-numero-do-ca" v-model="form.numero_ca" type="number" />
            </div>

            <div class="campo">
              <label for="est-data-de-validade">Data de Validade</label>
              <input id="est-data-de-validade" :value="form.data_validade" @input="aplicarMascaraData" type="text" placeholder="dd/mm/aaaa" maxlength="10" inputmode="numeric" />
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
                <p>Clique para enviar imagem</p>
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
      </div>
    </div>

    <footer class="rodape">
      <div class="rodape-marca">
        <span class="logo-nome">
          <img loading="lazy" decoding="async" src="@/assets/Logo_branco.svg" alt="OmniSeg" class="logo-icone" />
          Omni<span class="logo-destaque">Seg</span>
        </span>
        <p>Plataforma Focada em gestão de EPIs e segurança do trabalho. Tecnologia que salva vidas.</p>
      </div>

      <div class="rodape-coluna">
        <h4>Produto</h4>
        <a href="#">Funcionalidades</a>
        <a href="#">Integrações</a>
        <a href="#">Preços</a>
        <a href="#">Atualizações</a>
      </div>

      <div class="rodape-coluna">
        <h4>Empresa</h4>
        <a href="#">Sobre Nós</a>
        <a href="#">Carreiras</a>
        <a href="#">Blog</a>
        <a href="#">Contato</a>
      </div>

      <div class="rodape-coluna">
        <h4>Legal</h4>
        <a href="#">Privacidade</a>
        <a href="#">Termos de Uso</a>
        <a href="#">Segurança</a>
      </div>

      <div class="rodape-redes">
        <a href="#" aria-label="Facebook">
          <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
        </a>
        <a href="#" aria-label="YouTube">
          <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46A2.78 2.78 0 0 0 1.46 6.42 29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.96-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58zM9.75 15.02V8.98L15.5 12l-5.75 3.02z"/></svg>
        </a>
        <a href="#" aria-label="LinkedIn">
          <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6zM2 9h4v12H2z"/><circle cx="4" cy="4" r="2"/></svg>
        </a>
      </div>
    </footer>
  </div>
</template>

<style scoped>
.pagina-estoque {
  background: var(--superficie-alta);
  min-height: 100vh;
  color: var(--texto-forte);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  box-sizing: border-box;
  width: 100%;
  padding: 2rem 3rem 0;
  overflow-x: hidden;
}
.pagina-estoque *,
.pagina-estoque *::before,
.pagina-estoque *::after { box-sizing: border-box; }
.pagina-estoque .rodape { margin-left: -3rem; margin-right: -3rem; width: calc(100% + 6rem); }

.cabecalho {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1.5rem;
  margin-bottom: 2.5rem;
}

.botao-cadastrar {
  background: var(--marca);
  color: var(--marca-texto);
  border: none;
  padding: 0.75rem 1.3rem;
  border-radius: 0.55rem;
  font-size: 0.92rem;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.2s, transform 0.1s;
  white-space: nowrap;
  margin-top: 0.5rem;
}
.botao-cadastrar:hover { background: var(--marca-escura); }
.botao-cadastrar:active { transform: scale(0.97); }

.caminho {
  color: var(--texto-suave);
  font-size: 0.85rem;
  margin-bottom: 0.7rem;
}
.caminho .separador { margin: 0 0.4rem; }
.caminho-atual { color: var(--texto-forte); }

.titulo-pagina {
  font-size: 2.6rem;
  font-weight: 800;
  color: var(--texto-forte);
  letter-spacing: -0.02em;
  margin-bottom: 0.4rem;
}
.titulo-destaque { color: var(--marca); }

.subtitulo {
  color: var(--texto-suave);
  font-size: 0.95rem;
}

.lista-epis {
  background: var(--superficie-elevada);
  border: 1px solid color-mix(in srgb, var(--texto-forte) 5%, transparent);
  border-radius: 1rem;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 4rem;
}

.card-epi {
  background: linear-gradient(180deg, var(--borda) 0%, var(--superficie-elevada) 100%);
  border: 1px solid color-mix(in srgb, var(--texto-forte) 5%, transparent);
  border-radius: 0.85rem;
  overflow: hidden;
  transition: border-color 0.2s, transform 0.15s, box-shadow 0.2s;
}
.card-epi:hover {
  border-color: color-mix(in srgb, var(--marca) 30%, transparent);
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(0,0,0,0.25);
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
  border-radius: 0.65rem;
  overflow: hidden;
  background: var(--borda-forte);
  border: 1px solid color-mix(in srgb, var(--texto-forte) 5%, transparent);
  align-self: center;
}
.card-imagem img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.imagem-placeholder {
  width: 100%;
  height: 100%;
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--marca) 8%, transparent), transparent 60%),
    var(--borda-forte);
}

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

.epi-fabricante {
  color: var(--texto-suave);
  font-size: 0.85rem;
}
.epi-fabricante span { color: var(--texto); font-weight: 600; }

.card-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.meta-chip {
  display: inline-flex;
  align-items: baseline;
  gap: 0.4rem;
  padding: 0.3rem 0.8rem;
  font-size: 0.85rem;
}

.meta-label {
  color: var(--marca);
  font-weight: 700;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.meta-valor {
  color: var(--texto);
  font-weight: 500;
}

.card-estoque {
  flex: 0 0 auto;
  align-self: stretch;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
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

.estoque-minimo {
  color: var(--texto-suave);
  font-size: 0.72rem;
}

.btn-detalhes {
  flex: 0 0 auto;
  align-self: center;
  background: transparent;
  border: 1px solid color-mix(in srgb, var(--marca) 40%, transparent);
  color: var(--marca);
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.55rem 0.9rem;
  border-radius: 0.5rem;
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
  border-radius: 0.5rem;
  white-space: nowrap;
}
.badge-limite strong { color: var(--texto-forte); font-weight: 800; }

.estoque-vazio {
  background: color-mix(in srgb, var(--marca) 6%, transparent);
  border: 1px dashed color-mix(in srgb, var(--marca) 35%, transparent);
  color: var(--texto);
  text-align: center;
  padding: 2rem;
  border-radius: 1rem;
  margin-bottom: 4rem;
  font-size: 0.92rem;
}

.badge-alerta {
  flex: 0 0 auto;
  background: rgba(220, 60, 60, 0.12);
  border: 1px solid rgba(220, 60, 60, 0.4);
  color: var(--perigo);
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.28rem 0.7rem;
  border-radius: 999px;
  white-space: nowrap;
}

.btn-expandir {
  flex: 0 0 auto;
  background: none;
  border: none;
  color: var(--marca);
  cursor: pointer;
  padding: 0.4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.4rem;
  transition: background 0.15s;
}
.btn-expandir svg {
  transition: transform 0.25s ease;
}
.btn-expandir svg.rotacionado {
  transform: rotate(180deg);
}

.card-detalhe {
  border-top: 1px solid color-mix(in srgb, var(--texto-forte) 6%, transparent);
  padding: 1rem 1.3rem 1.2rem;
  animation: slideDown 0.2s ease;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-6px); }
  to   { opacity: 1; transform: translateY(0); }
}

.detalhe-grade {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem 1.5rem;
}

.detalhe-campo {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
}
.detalhe-campo .campo-label {
  font-size: 0.75rem;
  color: var(--marca);
}
.detalhe-campo .campo-valor {
  font-size: 0.9rem;
  color: var(--texto-forte);
}

.detalhe-acoes .campo-label{
  font-size: 0.85rem;
  color: var(--marca);
}

.rodape {
  margin-top: 4rem;
  padding: 3rem 4rem 2rem;
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 3rem;
  border-top: 1px solid var(--borda);
  background: var(--superficie-alta);
  width: 100%;
}

.rodape-marca .logo-nome {
  font-size: 1.2rem;
  font-weight: 700;
  color: var(--texto-forte);
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  margin-bottom: 0.8rem;
}
.logo-icone {
  width: 1.5rem;
  height: 1.5rem;
  object-fit: contain;
  vertical-align: middle;
}
.logo-destaque { color: var(--marca); }

.rodape-marca p {
  color: var(--texto-fraco);
  font-size: 0.82rem;
  line-height: 1.7;
  margin-top: 0.5rem;
}

.rodape-coluna h4 {
  color: var(--texto-forte);
  font-size: 0.9rem;
  font-weight: 700;
  margin-bottom: 1rem;
}
.rodape-coluna a {
  display: block;
  color: var(--texto-fraco);
  text-decoration: none;
  font-size: 0.82rem;
  margin-bottom: 0.55rem;
  transition: color 0.2s;
}
.rodape-coluna a:hover { color: var(--marca); }

.rodape-redes {
  grid-column: 1 / -1;
  display: flex;
  justify-content: flex-end;
  gap: 1.2rem;
  color: var(--texto-fraco);
  padding-top: 1rem;
  border-top: 1px solid var(--borda);
}
.rodape-redes a {
  color: var(--texto-fraco);
  transition: color 0.2s;
}
.rodape-redes a:hover { color: var(--marca); }

.detalhe-topo {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.2rem;
}

.detalhe-descricao {
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}
.descricao-texto {
  color: var(--texto);
  font-size: 0.88rem;
  line-height: 1.65;
}

.detalhe-acoes {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.7rem;
  flex-shrink: 0;
}

.setor-info {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  padding: 0.35rem 0.7rem;
  border-radius: 0.45rem;
}



.acoes-secundarias {
  display: flex;
  gap: 0.5rem;
}

.btn-acao {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  border: none;
  border-radius: 0.45rem;
  padding: 0.45rem 0.85rem;
  font-size: 0.82rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s, opacity 0.15s;
}

.add-estoque-texto { display: flex; flex-direction: column; gap: 0.1rem; }
.add-estoque-texto strong { color: var(--texto-forte); }

.add-estoque-controles {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  flex-shrink: 0;
}

.input-qtd {
  width: 80px;
  background: var(--borda);
  border: 1px solid color-mix(in srgb, var(--marca) 30%, transparent);
  color: var(--texto-forte);
  border-radius: 0.4rem;
  padding: 0.4rem 0.55rem;
  font-size: 0.82rem;
  outline: none;
  transition: border-color 0.15s;
}
.input-qtd::placeholder { color: var(--texto-fraco); }
.input-qtd:focus { border-color: var(--marca); }
.input-qtd::-webkit-outer-spin-button,
.input-qtd::-webkit-inner-spin-button { appearance: none; -webkit-appearance: none; margin: 0; }
.input-qtd[type=number] { appearance: textfield; -moz-appearance: textfield; }

.btn-adicionar {
  background: color-mix(in srgb, var(--marca) 15%, transparent);
  color: var(--marca);
  padding: 0.45rem 0.85rem;
  font-size: 0.82rem;
  white-space: nowrap;
}
.btn-adicionar:hover:not(:disabled) { background: color-mix(in srgb, var(--marca) 28%, transparent); }
.btn-adicionar:disabled { opacity: 0.4; cursor: not-allowed; }

.btn-editar {
  background: color-mix(in srgb, var(--marca) 12%, transparent);
  color: var(--marca);
}
.btn-editar:hover { background: color-mix(in srgb, var(--marca) 22%, transparent); }

.btn-excluir {
  background: color-mix(in srgb, var(--perigo) 12%, transparent);
  color: var(--perigo);
}
.btn-excluir:hover { background: color-mix(in srgb, var(--perigo) 22%, transparent); }

.detalhe-rodape {
  display: flex;
  gap: 1rem;
  align-items: stretch;
  flex-wrap: wrap;
}

.detalhe-notificacao,
.add-estoque-panel {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  background: color-mix(in srgb, var(--marca) 6%, transparent);
  border: 1px solid color-mix(in srgb, var(--marca) 20%, transparent);
  border-radius: 0.65rem;
  padding: 0.55rem 1rem;
  flex: 1 1 0;
  min-width: 0;
}

.notificacao-texto {
  display: flex;
  align-items: flex-start;
  gap: 0.7rem;
  color: var(--marca);
}

.notificacao-titulo {
  color: var(--texto-forte);
  font-size: 0.85rem;
  font-weight: 600;
}
.notificacao-sub {
  color: var(--texto-suave);
  font-size: 0.75rem;
  margin-top: 0.1rem;
}

.toggle {
  flex-shrink: 0;
  width: 44px;
  height: 24px;
  background: var(--borda-forte);
  border: none;
  border-radius: 999px;
  cursor: pointer;
  position: relative;
  transition: background 0.25s;
  padding: 0;
}
.toggle-ativo { background: var(--marca); }

.toggle-bolinha {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 18px;
  height: 18px;
  background: var(--texto-forte);
  border-radius: 50%;
  transition: transform 0.25s;
  display: block;
}
.toggle-ativo .toggle-bolinha { transform: translateX(20px); }

input[type="number"]::-webkit-outer-spin-button,
input[type="number"]::-webkit-inner-spin-button {
  -webkit-appearance: none;
  appearance: none;
  margin: 0;
}
input[type="number"] {
  -moz-appearance: textfield;
  appearance: textfield;
}

.toast {
  position: fixed;
  top: 1.5rem;
  right: 1.5rem;
  z-index: 1100;
  padding: 0.85rem 1.3rem;
  border-radius: 0.6rem;
  font-size: 0.9rem;
  font-weight: 600;
}
.toast-sucesso { background: color-mix(in srgb, var(--ok) 15%, transparent); border: 1px solid color-mix(in srgb, var(--ok) 40%, transparent); color: var(--ok); }
.toast-erro    { background: color-mix(in srgb, var(--perigo) 15%, transparent); border: 1px solid color-mix(in srgb, var(--perigo) 40%, transparent); color: var(--perigo); }

.modal-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.65);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000; padding: 1.5rem;
}
.modal {
  background: var(--superficie-elevada);
  border: 1px solid color-mix(in srgb, var(--texto-forte) 6%, transparent);
  border-radius: 1rem;
  width: 100%; max-width: 720px; max-height: 90vh;
  display: flex; flex-direction: column; overflow: hidden;
}
.modal-cabecalho {
  display: flex; align-items: center; justify-content: space-between;
  padding: 1.2rem 1.5rem;
  border-bottom: 1px solid var(--borda);
}
.modal-cabecalho h2 { font-size: 1.25rem; font-weight: 700; color: var(--texto-forte); }
.modal-fechar {
  background: transparent; border: none; color: var(--texto-suave);
  font-size: 1.6rem; cursor: pointer; line-height: 1; padding: 0 0.3rem;
}
.modal-fechar:hover { color: var(--texto-forte); }
.modal-corpo { padding: 1.2rem 1.5rem; overflow-y: auto; flex: 1; }
.modal-grade { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem 1.2rem; }
.campo-largo { grid-column: 1 / -1; }
.modal-rodape {
  display: flex; justify-content: flex-end; gap: 0.7rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid var(--borda);
  background: var(--superficie-alta);
}
.preview-imagem-modal img {
  width: 100%; max-height: 180px; object-fit: cover;
  border-radius: 0.6rem; border: 1px solid var(--borda);
}
.preview-imagem-modal { display: flex; flex-direction: column; gap: 0.6rem; }
.preview-acoes { display: flex; gap: 0.5rem; }
.btn-trocar, .btn-remover {
  flex: 1; text-align: center;
  padding: 0.5rem 0.7rem; border-radius: 0.45rem;
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
  padding: 1.2rem; border: 2px dashed var(--borda-forte); border-radius: 0.6rem;
  background: var(--superficie-alta); cursor: pointer; color: var(--texto-suave); font-size: 0.85rem;
}
.area-upload-modal:hover { border-color: var(--marca); }

.modal .campo { display: flex; flex-direction: column; gap: 0.4rem; }
.modal .campo label, .campo .rotulo-grupo { color: var(--texto); font-size: 0.82rem; font-weight: 500; }
.modal .campo input, .modal .campo textarea {
  background: var(--superficie); border: 1px solid var(--borda);
  border-radius: 0.5rem; padding: 0.7rem 0.85rem;
  color: var(--texto-forte); font-size: 0.88rem; outline: none;
  width: 100%; font-family: inherit; transition: border-color 0.2s;
}
.modal .campo input:focus, .modal .campo textarea:focus { border-color: var(--marca); }
.modal .campo textarea { resize: none; }

.botao {
  border: none; padding: 0.6rem 1.1rem; border-radius: 0.5rem;
  font-size: 0.88rem; font-weight: 600; cursor: pointer; font-family: inherit;
}
.botao-cancelar { background: var(--borda); color: var(--texto-forte); border: 1px solid var(--borda-forte); }
.botao-cancelar:hover { background: var(--borda-forte); }
.botao-salvar { background: var(--marca); color: var(--marca-texto); }
.botao-salvar:hover { background: var(--marca-escura); }
.botao-salvar:disabled { opacity: 0.5; cursor: not-allowed; }

.multi-select { position: relative; width: 100%; }
.multi-select-trigger {
  width: 100%; min-height: 2.85rem;
  background: var(--superficie); border: 1px solid var(--borda); border-radius: 0.5rem;
  padding: 0.4rem 2.2rem 0.4rem 0.7rem;
  color: var(--texto-forte); font-size: 0.88rem; text-align: left; cursor: pointer;
  display: flex; align-items: center; gap: 0.4rem;
  position: relative; font-family: inherit;
}
.multi-select.aberto .multi-select-trigger,
.multi-select-trigger:hover { border-color: var(--marca); }
.ms-placeholder { color: var(--texto-fraco); }
.ms-tags { display: flex; flex-wrap: wrap; gap: 0.35rem; flex: 1; }
.ms-tag {
  display: inline-flex; align-items: center; gap: 0.3rem;
  background: color-mix(in srgb, var(--marca) 15%, transparent); color: var(--marca);
  font-size: 0.78rem; font-weight: 600;
  padding: 0.2rem 0.5rem; border-radius: 0.4rem;
}
.ms-tag-x { cursor: pointer; background: none; border: none; color: inherit; font-size: inherit; font-weight: 700; line-height: 1; padding: 0 0.15rem; }
.ms-seta { position: absolute; right: 0.9rem; color: var(--texto-suave); }
.multi-select-menu {
  position: absolute; top: calc(100% + 0.3rem); left: 0; right: 0;
  background: var(--superficie-alta); border: 1px solid var(--borda); border-radius: 0.5rem;
  padding: 0.4rem; max-height: 220px; overflow-y: auto;
  z-index: 50; box-shadow: 0 8px 20px rgba(0,0,0,0.4);
}
.ms-opcao {
  display: flex; align-items: center; gap: 0.55rem;
  padding: 0.5rem 0.6rem; border-radius: 0.35rem;
  cursor: pointer; color: var(--texto); font-size: 0.86rem;
  transition: background 0.15s;
}
.ms-opcao:hover { background: color-mix(in srgb, var(--marca) 8%, transparent); }
.ms-opcao input[type="checkbox"] {
  appearance: none; -webkit-appearance: none;
  width: 1.05rem; height: 1.05rem;
  border: 1.5px solid var(--texto-fraco); border-radius: 0.25rem;
  background: transparent; cursor: pointer; position: relative;
  flex-shrink: 0; margin: 0;
  transition: background 0.15s, border-color 0.15s;
}
.ms-opcao input[type="checkbox"]:hover { border-color: var(--marca); }
.ms-opcao input[type="checkbox"]:checked {
  background: var(--marca); border-color: var(--marca);
}
.ms-vazio { padding: 0.6rem; color: var(--texto-suave); font-size: 0.82rem; text-align: center; }

@media (max-width: 960px) {
  .modal-grade { grid-template-columns: 1fr; }
  .pagina-estoque { padding: 1.5rem 1.5rem 0; }
  .card-principal { flex-wrap: wrap; }
  .card-estoque { flex: 1 1 100%; flex-direction: row; justify-content: space-between; padding: 0.7rem 1rem; }
  .estoque-numero { font-size: 1.5rem; }
  .detalhe-grade { grid-template-columns: repeat(2, 1fr); }
  .rodape { grid-template-columns: 1fr 1fr; }
}

@media (max-width: 600px) {
  .titulo-pagina { font-size: 1.8rem; }
  .detalhe-grade { grid-template-columns: 1fr 1fr; }
  .rodape { grid-template-columns: 1fr; gap: 1.5rem; }
}
</style>
