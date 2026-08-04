<script setup>
import { reactive, ref, onMounted } from 'vue';
import { useSupabase } from '@/composables/useSupabase';
import { useRouter } from 'vue-router';
import { useMensagem } from '@/composables/mensagem';
import { isoParaBr, brParaIso, formatarData, aplicarMascaraData } from '@/composables/datas';
import Toast from '@/components/Toast.vue';
import Modal from '@/components/Modal.vue';
import MultiSelect from '@/components/MultiSelect.vue';

const { supabase } = useSupabase();
const { mensagem, mostrarMensagem } = useMensagem();
const router = useRouter();

const epis = ref([]);
const setores = ref([]);
const editandoId = ref(null);
const modalAberto = ref(false);
const enviando = ref(false);

const imagemArquivo = ref(null);
const imagemPreview = ref(null);
const imagemExistente = ref(null);

const VAZIO = {
  nome: '', setor: [], fabricante: '', custo: '', numero_ca: '',
  data_validade: '', estoque: '', estoque_minimo: '', descricao: '',
};
const form = reactive({ ...VAZIO });

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

const carregar = async () => {
  const { data } = await supabase.from('epis').select('*').order('nome');
  epis.value = data || [];
};

const carregarSetores = async () => {
  const { data, error } = await supabase.from('setores').select('nome').order('nome');
  if (error) console.error(error);
  setores.value = (data || []).map(s => s.nome);
};

onMounted(() => {
  carregar();
  carregarSetores();
});

const montarPayload = async () => {
  const imagemUrl = await uploadImagem();
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
  return payload;
};

const salvar = async () => {
  if (!form.nome.trim()) { mostrarMensagem('erro', 'Informe o nome do EPI.'); return; }
  if (form.data_validade && !brParaIso(form.data_validade)) {
    mostrarMensagem('erro', 'Data de validade inválida (use DD/MM/AAAA).'); return;
  }
  enviando.value = true;

  let payload;
  try {
    payload = await montarPayload();
  } catch (e) {
    enviando.value = false;
    mostrarMensagem('erro', 'Erro ao enviar a imagem: ' + e.message);
    return;
  }

  const { error } = editandoId.value
    ? await supabase.from('epis').update(payload).eq('id', editandoId.value)
    : await supabase.from('epis').insert(payload);

  enviando.value = false;
  if (error) {
    mostrarMensagem('erro', `Erro ao ${editandoId.value ? 'atualizar' : 'cadastrar'}: ${error.message}`);
    return;
  }

  mostrarMensagem('sucesso', editandoId.value ? 'EPI atualizado com sucesso!' : 'EPI cadastrado com sucesso!');
  limpar();
  carregar();
};

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

const limpar = () => {
  modalAberto.value = false;
  editandoId.value = null;
  Object.assign(form, VAZIO);
  removerImagem();
};
</script>

<template>
  <div class="pagina-cadastro">
    <Toast :mensagem="mensagem" />

    <header class="cabecalho">
      <div class="cabecalho-texto">
        <p class="caminho">
          Estoque &amp; EPIs <span class="separador" aria-hidden="true">›</span>
          <span class="caminho-atual">Cadastro de EPI</span>
        </p>
        <h1 class="titulo-pagina">Novo <span class="titulo-destaque">EPI</span></h1>
        <p class="subtitulo">Preencha os dados abaixo para registrar um novo equipamento de proteção.</p>
      </div>

      <div class="botoes-acao">
        <button type="button" class="botao botao-cancelar" @click="router.back()">Cancelar</button>
        <button type="submit" form="form-epi" class="botao botao-salvar" :disabled="enviando">
          {{ enviando ? 'Salvando…' : 'Salvar Cadastro' }}
        </button>
      </div>
    </header>

    <form id="form-epi" class="grade-principal" @submit.prevent="salvar">
      <div class="coluna-esquerda">
        <section class="cartao">
          <h2 class="cartao-titulo">Informações Básicas</h2>

          <div class="grade-campos">
            <div class="campo">
              <label for="cad-nome">Nome do EPI</label>
              <input id="cad-nome" v-model="form.nome" type="text" placeholder="Ex: Bota bico de ferro" />
            </div>

            <MultiSelect
              v-model="form.setor"
              :opcoes="setores"
              rotulo="Setores de uso"
              placeholder="Selecione um ou mais setores"
              vazio="Nenhum setor cadastrado."
            />

            <div class="campo">
              <label for="cad-fabricante">Fabricante</label>
              <input id="cad-fabricante" v-model="form.fabricante" type="text" placeholder="Ex: MSA Safety" />
            </div>

            <div class="campo">
              <label for="cad-custo">Custo unitário</label>
              <input id="cad-custo" v-model="form.custo" type="text" inputmode="decimal" placeholder="Ex: 129,90" />
            </div>
          </div>
        </section>

        <section class="cartao">
          <h2 class="cartao-titulo">Certificado de Aprovação (CA)</h2>

          <div class="grade-campos">
            <div class="campo">
              <!-- Estes três rótulos apontavam para ids que não existiam: o
                   clique não focava nada e o leitor de tela lia campo sem nome. -->
              <label for="cad-numero-ca">Número do CA</label>
              <input id="cad-numero-ca" v-model="form.numero_ca" type="number" placeholder="00000" />
            </div>

            <div class="campo">
              <label for="cad-validade">Data de Validade</label>
              <input
                id="cad-validade"
                :value="form.data_validade"
                @input="aplicarMascaraData($event, form, 'data_validade')"
                type="text" placeholder="dd/mm/aaaa" maxlength="10" inputmode="numeric"
              />
            </div>
          </div>
        </section>

        <section class="cartao">
          <h2 class="cartao-titulo">Controle de Estoque</h2>

          <div class="grade-campos">
            <div class="campo">
              <label for="cad-estoque">Quantidade inicial</label>
              <input id="cad-estoque" v-model="form.estoque" type="number" min="0" placeholder="0" />
            </div>

            <div class="campo">
              <label for="cad-estoque-minimo">Estoque mínimo</label>
              <input id="cad-estoque-minimo" v-model="form.estoque_minimo" type="number" min="0" placeholder="0" />
              <p class="campo-ajuda">Abaixo disso o EPI aparece como “estoque baixo”.</p>
            </div>
          </div>
        </section>
      </div>

      <aside class="coluna-direita">
        <section class="cartao">
          <h2 class="cartao-titulo">Imagem do Produto</h2>

          <div v-if="imagemPreview || imagemExistente" class="preview-imagem">
            <img :src="imagemPreview || imagemExistente" alt="Pré-visualização do EPI" />
            <div class="preview-acoes">
              <label class="btn-trocar">
                Trocar
                <input type="file" accept="image/png, image/jpeg, image/webp" hidden @change="selecionarImagem" />
              </label>
              <button type="button" class="btn-remover" @click="removerImagem">Remover</button>
            </div>
          </div>

          <label v-else class="area-upload">
            <span class="upload-titulo">Clique para enviar</span>
            <span class="upload-sub">ou arraste e solte</span>
            <span class="upload-formatos">PNG, JPG ou WEBP (máx. 5 MB)</span>
            <input type="file" accept="image/png, image/jpeg, image/webp" hidden @change="selecionarImagem" />
          </label>
        </section>

        <section class="cartao">
          <h2 class="cartao-titulo">Descrição</h2>
          <div class="campo">
            <label for="cad-descricao">Descreva o equipamento</label>
            <textarea id="cad-descricao" v-model="form.descricao" placeholder="Material, tamanhos disponíveis, cuidados de uso…" rows="5" maxlength="200"></textarea>
            <p class="contador" :class="{ 'contador-limite': form.descricao.length >= 200 }">
              {{ form.descricao.length }}/200
            </p>
          </div>
        </section>
      </aside>
    </form>

    <section class="cartao lista-epis">
      <div class="cartao-cabecalho">
        <h2 class="cartao-titulo">EPIs cadastrados</h2>
        <span class="contagem">{{ epis.length }}</span>
      </div>

      <p v-if="epis.length === 0" class="vazio-lista">Nenhum EPI cadastrado ainda. O primeiro que você salvar aparece aqui.</p>

      <div v-else class="tabela-rolagem">
        <table class="tabela-epis">
          <caption class="sr-only">Lista de EPIs cadastrados, com ação de editar</caption>
          <thead>
            <tr>
              <th scope="col">Nome</th>
              <th scope="col">Setor</th>
              <th scope="col">Fabricante</th>
              <th scope="col">CA</th>
              <th scope="col">Validade</th>
              <th scope="col">Estoque</th>
              <th scope="col"><span class="sr-only">Ações</span></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="epi in epis" :key="epi.id">
              <td>{{ epi.nome }}</td>
              <td class="muted">{{ epi.setor || '—' }}</td>
              <td class="muted">{{ epi.fabricante || '—' }}</td>
              <td class="muted">{{ epi.numero_ca || '—' }}</td>
              <td class="muted">{{ formatarData(epi.data_validade) }}</td>
              <td class="muted">{{ epi.estoque ?? '—' }}</td>
              <td>
                <button type="button" class="btn-editar" @click="iniciarEdicao(epi)">
                  Editar<span class="sr-only"> {{ epi.nome }}</span>
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <Modal v-if="modalAberto" titulo="Editar EPI" @fechar="limpar">
      <template #titulo>Editar <span class="titulo-destaque">EPI</span></template>

      <form class="modal-corpo" @submit.prevent="salvar">
        <div class="modal-grade">
          <div class="campo">
            <label for="mod-nome">Nome do EPI</label>
            <input id="mod-nome" v-model="form.nome" type="text" />
          </div>

          <MultiSelect
            v-model="form.setor"
            :opcoes="setores"
            rotulo="Setores de uso"
            placeholder="Selecione um ou mais setores"
            vazio="Nenhum setor cadastrado."
          />

          <div class="campo">
            <label for="mod-fabricante">Fabricante</label>
            <input id="mod-fabricante" v-model="form.fabricante" type="text" />
          </div>

          <div class="campo">
            <label for="mod-custo">Custo</label>
            <input id="mod-custo" v-model="form.custo" type="text" inputmode="decimal" />
          </div>

          <div class="campo">
            <label for="mod-ca">Número do CA</label>
            <input id="mod-ca" v-model="form.numero_ca" type="number" />
          </div>

          <div class="campo">
            <label for="mod-validade">Data de Validade</label>
            <input
              id="mod-validade"
              :value="form.data_validade"
              @input="aplicarMascaraData($event, form, 'data_validade')"
              type="text" placeholder="dd/mm/aaaa" maxlength="10" inputmode="numeric"
            />
          </div>

          <div class="campo">
            <label for="mod-estoque">Estoque</label>
            <input id="mod-estoque" v-model="form.estoque" type="number" />
          </div>

          <div class="campo">
            <label for="mod-estoque-minimo">Estoque mínimo</label>
            <input id="mod-estoque-minimo" v-model="form.estoque_minimo" type="number" />
          </div>

          <div class="campo campo-largo">
            <label for="mod-descricao">Descrição</label>
            <textarea id="mod-descricao" v-model="form.descricao" rows="3" maxlength="200"></textarea>
          </div>

          <div class="campo campo-largo">
            <span class="rotulo-grupo">Imagem</span>
            <div v-if="imagemPreview || imagemExistente" class="preview-imagem">
              <img :src="imagemPreview || imagemExistente" alt="Imagem do EPI" />
              <div class="preview-acoes">
                <label class="btn-trocar">
                  Trocar
                  <input type="file" accept="image/png, image/jpeg, image/webp" hidden @change="selecionarImagem" />
                </label>
                <button type="button" class="btn-remover" @click="removerImagem">Remover</button>
              </div>
            </div>
            <label v-else class="area-upload area-upload-compacta">
              <span class="upload-titulo">Clique para enviar imagem</span>
              <input type="file" accept="image/png, image/jpeg, image/webp" hidden @change="selecionarImagem" />
            </label>
          </div>
        </div>

        <footer class="modal-rodape">
          <button type="button" class="botao botao-cancelar" @click="limpar">Cancelar</button>
          <button type="submit" class="botao botao-salvar" :disabled="enviando">
            {{ enviando ? 'Salvando…' : 'Salvar alterações' }}
          </button>
        </footer>
      </form>
    </Modal>
  </div>
</template>

<style scoped>
.pagina-cadastro {
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
  margin-bottom: 2rem;
  gap: 2rem;
}

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

.botoes-acao { display: flex; gap: 0.7rem; flex-shrink: 0; margin-top: 0.5rem; }

.botao {
  min-height: 2.75rem;
  border: none;
  padding: 0.6rem 1.2rem;
  border-radius: var(--raio-sm);
  font-size: 0.88rem;
  font-weight: 700;
  font-family: inherit;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.2s;
}
.botao-cancelar { background: var(--borda); color: var(--texto-forte); border: 1px solid var(--borda-forte); }
.botao-cancelar:hover { background: var(--borda-forte); }
.botao-salvar { background: var(--marca); color: var(--marca-texto); }
.botao-salvar:hover:not(:disabled) { background: var(--marca-escura); }
.botao-salvar:disabled { opacity: 0.5; cursor: not-allowed; }

.grade-principal {
  display: grid;
  grid-template-columns: 1fr 22rem;
  gap: 1.2rem;
  align-items: start;
  margin-bottom: 1.5rem;
}
.coluna-esquerda, .coluna-direita { display: flex; flex-direction: column; gap: 1.2rem; }

.cartao {
  background: var(--superficie-elevada);
  border: 1px solid color-mix(in srgb, var(--texto-forte) 5%, transparent);
  border-radius: var(--raio);
  padding: 1.5rem;
}
.cartao-titulo { color: var(--texto-forte); font-size: 1.05rem; font-weight: 700; margin-bottom: 1.2rem; }
.cartao-cabecalho { display: flex; align-items: center; justify-content: space-between; gap: 1rem; }
.cartao-cabecalho .cartao-titulo { margin-bottom: 0; }
.contagem {
  color: var(--marca); font-size: 0.8rem; font-weight: 700;
  background: color-mix(in srgb, var(--marca) 10%, transparent);
  padding: 0.25rem 0.7rem; border-radius: var(--raio-pill);
}

.grade-campos { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem 1.2rem; }

.campo { display: flex; flex-direction: column; gap: 0.4rem; }
.campo label, .rotulo-grupo { color: var(--texto); font-size: 0.82rem; font-weight: 500; }
.campo input, .campo textarea {
  background: var(--superficie);
  border: 1px solid var(--borda);
  border-radius: var(--raio-sm);
  padding: 0.7rem 0.85rem;
  color: var(--texto-forte);
  font-size: 0.88rem;
  font-family: inherit;
  outline: none;
  width: 100%;
  transition: border-color 0.2s;
}
.campo input:focus, .campo textarea:focus { border-color: var(--marca); }
.campo input::placeholder, .campo textarea::placeholder { color: var(--texto-fraco); }
.campo textarea { resize: vertical; }
.campo-ajuda { color: var(--texto-fraco); font-size: 0.75rem; }

.contador { color: var(--texto-fraco); font-size: 0.75rem; text-align: right; }
.contador-limite { color: var(--aviso); font-weight: 600; }

.preview-imagem { display: flex; flex-direction: column; gap: 0.6rem; }
.preview-imagem img {
  width: 100%; max-height: 200px; object-fit: cover;
  border-radius: var(--raio-sm); border: 1px solid var(--borda);
}
.preview-acoes { display: flex; gap: 0.5rem; }

.btn-trocar, .btn-remover {
  flex: 1;
  display: inline-flex; align-items: center; justify-content: center;
  min-height: 2.75rem;
  padding: 0.5rem 0.7rem;
  border-radius: var(--raio-sm);
  font-size: 0.82rem; font-weight: 600; font-family: inherit; cursor: pointer;
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

.area-upload {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.25rem;
  text-align: center;
  padding: 2rem 1.2rem;
  border: 2px dashed var(--borda-forte);
  border-radius: var(--raio-sm);
  background: var(--superficie-alta);
  cursor: pointer;
  transition: border-color 0.15s;
}
.area-upload:hover { border-color: var(--marca); }
.area-upload-compacta { padding: 1.4rem 1.2rem; }
.upload-titulo { color: var(--texto-forte); font-size: 0.9rem; font-weight: 600; }
.upload-sub { color: var(--texto-suave); font-size: 0.82rem; }
.upload-formatos { color: var(--texto-fraco); font-size: 0.75rem; margin-top: 0.3rem; }

/* tabela larga não pode empurrar a página no celular */
.tabela-rolagem { overflow-x: auto; }
.tabela-epis { width: 100%; min-width: 640px; border-collapse: collapse; }
.tabela-epis th, .tabela-epis td {
  text-align: left;
  padding: 0.7rem 0.8rem;
  border-bottom: 1px solid var(--borda);
  font-size: 0.86rem;
}
.tabela-epis th {
  color: var(--texto-suave);
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.tabela-epis td { color: var(--texto-forte); }
.tabela-epis td.muted { color: var(--texto-suave); }
.tabela-epis tbody tr:last-child td { border-bottom: none; }
.tabela-epis tbody tr:hover { background: color-mix(in srgb, var(--marca) 5%, transparent); }

.btn-editar {
  min-height: 2.4rem;
  background: color-mix(in srgb, var(--marca) 12%, transparent);
  color: var(--marca);
  border: none;
  border-radius: var(--raio-sm);
  padding: 0.4rem 0.9rem;
  font-size: 0.8rem; font-weight: 600; font-family: inherit; cursor: pointer;
  transition: background 0.15s;
}
.btn-editar:hover { background: color-mix(in srgb, var(--marca) 22%, transparent); }

.vazio-lista { color: var(--texto-suave); font-size: 0.9rem; padding: 1rem 0; }

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

@media (max-width: 1000px) {
  .grade-principal { grid-template-columns: 1fr; }
}

@media (max-width: 700px) {
  .pagina-cadastro { padding: 1.5rem 1.2rem 2rem; }
  .cabecalho { flex-direction: column; gap: 1.2rem; }
  .botoes-acao { width: 100%; margin-top: 0; }
  .botoes-acao .botao { flex: 1; }
  .grade-campos, .modal-grade { grid-template-columns: 1fr; }
}
</style>
