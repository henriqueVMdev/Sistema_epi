<script setup>
import { reactive, ref, onMounted } from 'vue';
import { useSupabase } from '@/composables/useSupabase';
import { useRouter } from 'vue-router';

const { supabase } = useSupabase();
const epis = ref([]);
const editandoId = ref(null);
const funcionarios = ref([]);
const setorAberto = ref(false);
const modalAberto = ref(false);
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

const router = useRouter();

const mensagem = ref(null);

const imagemArquivo = ref(null);
const imagemPreview = ref(null);
const imagemExistente = ref(null);
const enviando = ref(false);

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
  setTimeout(() => { mensagem.value = null; }, 4000);
};

const carregar = async () => {
  const { data } = await supabase.from('epis').select('*').order('nome');
  epis.value = data || [];
};

const salvar = async () => {
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

  if (editandoId.value) {
    const { error } = await supabase.from('epis').update(payload).eq('id', editandoId.value);
    if (error) {
      enviando.value = false;
      mostrarMensagem('erro', 'Erro ao atualizar o cadastro: ' + error.message);
      return;
    }
    mostrarMensagem('sucesso', 'EPI atualizado com sucesso!');
  } else {
    const { error } = await supabase.from('epis').insert(payload);
    if (error) {
      enviando.value = false;
      mostrarMensagem('erro', 'Erro ao cadastrar o EPI: ' + error.message);
      return;
    }
    mostrarMensagem('sucesso', 'EPI cadastrado com sucesso!');
  }
  enviando.value = false;
  cancelarEdicao();
  carregar();
};

const toggleSetor = (nome) => {
  const idx = form.setor.indexOf(nome);
  if (idx >= 0) form.setor.splice(idx, 1);
  else form.setor.push(nome);
};

const setoresUnicos = () => {
  const nomes = (funcionarios.value || []).map(f => f.setor).filter(Boolean);
  return [...new Set(nomes)];
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

const cancelarEdicao = () => {
  modalAberto.value = false;
  editandoId.value = null;
  Object.assign(form, {
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
  removerImagem();
};

const voltar = () => {
  router.back();
};

const carregarSetor = async () => {
  const { data, error } = await supabase
    .from('setores')
    .select('id, nome')
    .order('nome');
  if (error) console.error(error);
  funcionarios.value = (data || []).map(s => ({ id: s.id, setor: s.nome }));
};

onMounted(() => {
  carregar();
  carregarSetor();
});
</script>

<template>
  <div class="pagina-cadastro">

    <header class="cabecalho">
      <div class="cabecalho-texto">
        <p class="caminho">
          Estoque &amp; EPIs <span class="separador">›</span>
          <span class="caminho-atual">Cadastro de EPI</span>
        </p>
        <h1 class="titulo-pagina">Novo <span class="titulo-destaque">EPI</span></h1>
        <p class="subtitulo">Preencha os dados abaixo para registrar um novo equipamento de proteção.</p>
      </div>

      <div class="botoes-acao">
        <button type="button" class="botao botao-cancelar" @click="voltar">Cancelar</button>
        <button type="button" class="botao botao-salvar" :disabled="enviando" @click="salvar">
          {{ enviando ? 'Salvando…' : 'Salvar Cadastro' }}
        </button>
      </div>
    </header>

    <div v-if="mensagem" :class="['toast', 'toast-' + mensagem.tipo]">
      {{ mensagem.texto }}
    </div>

    <form class="grade-principal" @submit.prevent="salvar">

      <div class="coluna-esquerda">

        <section class="cartao">
          <div class="cartao-cabecalho">
<h2>Informações Básicas</h2>
          </div>

          <div class="grade-campos">
            <div class="campo">
              <label for="nome">Nome do EPI</label>
              <input id="nome" v-model="form.nome" type="text" placeholder="Ex: Bota bico de ferro">
            </div>

            <div class="campo">
              <label for="setor">Setores de uso</label>
              <div class="multi-select" :class="{ aberto: setorAberto }">
                <button
                  type="button"
                  class="multi-select-trigger"
                  @click="setorAberto = !setorAberto"
                >
                  <span v-if="form.setor.length === 0" class="ms-placeholder">
                    Selecione um ou mais setores
                  </span>
                  <span v-else class="ms-tags">
                    <span class="ms-tag" v-for="s in form.setor" :key="s">
                      {{ s }}
                      <span class="ms-tag-x" @click.stop="toggleSetor(s)">×</span>
                    </span>
                  </span>
                  <span class="ms-seta">▾</span>
                </button>

                <div v-if="setorAberto" class="multi-select-menu">
                  <label
                    v-for="nome in setoresUnicos()"
                    :key="nome"
                    class="ms-opcao"
                  >
                    <input
                      type="checkbox"
                      :value="nome"
                      v-model="form.setor"
                    />
                    <span>{{ nome }}</span>
                  </label>
                  <p v-if="setoresUnicos().length === 0" class="ms-vazio">
                    Nenhum setor cadastrado.
                  </p>
                </div>
              </div>
            </div>

            <div class="campo">
              <label>Fabricante</label>
              <input v-model="form.fabricante" type="text" placeholder="Ex: MSA Safety">
            </div>

            <div class="campo">
              <label>Custo</label>
              <input v-model="form.custo" type="text" placeholder="Ex: 123456">
            </div>
          </div>
        </section>

        <section class="cartao">
          <div class="cartao-cabecalho">
<h2>Certificado de Aprovação (CA)</h2>
          </div>

          <div class="grade-campos">
            <div class="campo">
              <label for="numero_ca">Número do CA</label>
              <div class="input-com-icone">
                <span class="prefixo">#</span>
                <input v-model="form.numero_ca" type="number" placeholder="00000">
              </div>
            </div>

            <div class="campo">
              <label for="data_validade">Data de Validade</label>
              <div class="input-com-icone">
                <span class="prefixo">
                </span>
                <input :value="form.data_validade" @input="aplicarMascaraData" type="text" placeholder="dd/mm/aaaa" maxlength="10" inputmode="numeric">
              </div>
            </div>
          </div>
        </section>

        <section class="cartao">
          <div class="cartao-cabecalho">
<h2>Controle de Estoque</h2>
          </div>

          <div class="grade-campos">
            <div class="campo">
              <label for="estoque">Quantidade a adicionar ao estoque</label>
              <input id="estoque" v-model="form.estoque" type="number" placeholder="0">
            </div>

            <div class="campo">
              <label for="estoque_minimo">Estoque Minimo</label>
              <div class="select-wrapper">
                <input id = "estoque_minimo" v-model="form.estoque_minimo" type="number" default ="0">
              </div>
            </div>
          </div>
        </section>
      </div>

      <aside class="coluna-direita">

        <section class="cartao">
          <h2 class="titulo-lateral">Imagem do Produto</h2>

          <div v-if="imagemPreview || imagemExistente" class="preview-imagem">
            <img :src="imagemPreview || imagemExistente" alt="Pré-visualização do EPI" />
            <div class="preview-acoes">
              <label class="btn-trocar">
                Trocar
                <input type="file" accept="image/png, image/jpeg, image/svg+xml, image/webp" hidden @change="selecionarImagem">
              </label>
              <button type="button" class="btn-remover" @click="removerImagem">Remover</button>
            </div>
          </div>

          <label v-else class="area-upload">
            <p class="upload-titulo">Clique para enviar</p>
            <p class="upload-sub">ou arraste e solte</p>
            <p class="upload-formatos">PNG, JPG ou WEBP (Max. 5MB)</p>
            <input type="file" accept="image/png, image/jpeg, image/svg+xml, image/webp" hidden @change="selecionarImagem">
          </label>
        </section>
      
    
    
      
        <section class = "cartao">
          <div class="campo">
            <h2 class ="titulo-lateral">Descrição</h2>
            <label for="descricao">insira a descrição do Produto</label>
            <div class="select-wrapper">
            <textarea id="descricao" v-model="form.descricao" placeholder="Descreva o epi" rows="5" maxlength="200"></textarea>
            <span class="contador" :class="{ 'contador-limite': form.descricao.length >= 200 }">
              {{ form.descricao.length }}/200
            </span>
            </div>
          </div>
        </section>
      </aside>
    </form>

    <section class="cartao lista-epis">
      <div class="cartao-cabecalho">
        <h2>EPIs cadastrados</h2>
      </div>
      <div v-if="epis.length === 0" class="vazio-lista">Nenhum EPI cadastrado ainda.</div>
      <table v-else class="tabela-epis">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Setor</th>
            <th>Fabricante</th>
            <th>CA</th>
            <th>Estoque</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="epi in epis" :key="epi.id">
            <td>{{ epi.nome }}</td>
            <td class="muted">{{ epi.setor }}</td>
            <td class="muted">{{ epi.fabricante }}</td>
            <td class="muted">{{ epi.numero_ca }}</td>
            <td class="muted">{{ epi.estoque }}</td>
            <td><button type="button" class="btn-editar" @click="iniciarEdicao(epi)">Editar</button></td>
          </tr>
        </tbody>
      </table>
    </section>

    <div v-if="modalAberto" class="modal-overlay" @click.self="cancelarEdicao">
      <div class="modal">
        <header class="modal-cabecalho">
          <h2>Editar <span class="titulo-destaque">EPI</span></h2>
          <button type="button" class="modal-fechar" @click="cancelarEdicao">×</button>
        </header>

        <form class="modal-corpo" @submit.prevent="salvar">
          <div class="modal-grade">
            <div class="campo">
              <label>Nome do EPI</label>
              <input v-model="form.nome" type="text" />
            </div>

            <div class="campo">
              <label>Setores de uso</label>
              <div class="multi-select" :class="{ aberto: setorAberto }">
                <button type="button" class="multi-select-trigger" @click="setorAberto = !setorAberto">
                  <span v-if="form.setor.length === 0" class="ms-placeholder">Selecione um ou mais setores</span>
                  <span v-else class="ms-tags">
                    <span class="ms-tag" v-for="s in form.setor" :key="s">
                      {{ s }}
                      <span class="ms-tag-x" @click.stop="toggleSetor(s)">×</span>
                    </span>
                  </span>
                  <span class="ms-seta">▾</span>
                </button>
                <div v-if="setorAberto" class="multi-select-menu">
                  <label v-for="nome in setoresUnicos()" :key="nome" class="ms-opcao">
                    <input type="checkbox" :value="nome" v-model="form.setor" />
                    <span>{{ nome }}</span>
                  </label>
                </div>
              </div>
            </div>

            <div class="campo">
              <label>Fabricante</label>
              <input v-model="form.fabricante" type="text" />
            </div>

            <div class="campo">
              <label>Custo</label>
              <input v-model="form.custo" type="text" />
            </div>

            <div class="campo">
              <label>Número do CA</label>
              <input v-model="form.numero_ca" type="number" />
            </div>

            <div class="campo">
              <label>Data de Validade</label>
              <input :value="form.data_validade" @input="aplicarMascaraData" type="text" placeholder="dd/mm/aaaa" maxlength="10" inputmode="numeric" />
            </div>

            <div class="campo">
              <label>Estoque</label>
              <input v-model="form.estoque" type="number" />
            </div>

            <div class="campo">
              <label>Estoque mínimo</label>
              <input v-model="form.estoque_minimo" type="number" />
            </div>

            <div class="campo campo-largo">
              <label>Descrição</label>
              <textarea v-model="form.descricao" rows="3" maxlength="200"></textarea>
            </div>

            <div class="campo campo-largo">
              <label>Imagem</label>
              <div v-if="imagemPreview || imagemExistente" class="preview-imagem-modal">
                <img :src="imagemPreview || imagemExistente" alt="Imagem do EPI" />
                <div class="preview-acoes">
                  <label class="btn-trocar">
                    Trocar
                    <input type="file" accept="image/png, image/jpeg, image/webp" hidden @change="selecionarImagem" />
                  </label>
                  <button type="button" class="btn-remover" @click="removerImagem">Remover</button>
                </div>
              </div>
              <label v-else class="area-upload area-upload-modal">
                <p class="upload-titulo">Clique para enviar imagem</p>
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
          <img src="@/assets/Logo_branco.svg" alt="OmniSeg" class="logo-icone" />
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
    </footer>
  </div>
</template>

<style scoped>
.pagina-cadastro {
  background: #181511;
  min-height: 100vh;
  color: #fff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  box-sizing: border-box;
  width: 100%;
  padding: 2rem 3rem 0;
  overflow-x: hidden;
}
.pagina-cadastro *,
.pagina-cadastro *::before,
.pagina-cadastro *::after { box-sizing: border-box; }
.pagina-cadastro .rodape { margin-left: -3rem; margin-right: -3rem; width: calc(100% + 6rem); }

.cabecalho {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2.5rem;
  gap: 2rem;
}

.caminho {
  color: #8b8680;
  font-size: 0.85rem;
  margin-bottom: 0.7rem;
}
.caminho .separador { margin: 0 0.4rem; }
.caminho-atual { color: #fff; }

.titulo-pagina {
  font-size: 2.6rem;
  font-weight: 800;
  color: #fff;
  letter-spacing: -0.02em;
  margin-bottom: 0.4rem;
}
.titulo-destaque { color: #F49D25; }

.subtitulo {
  color: #8b8680;
  font-size: 0.95rem;
}

.botoes-acao {
  display: flex;
  gap: 0.7rem;
  margin-top: 0.5rem;
}

.botao {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  border: none;
  padding: 0.65rem 1.2rem;
  border-radius: 0.55rem;
  font-size: 0.9rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, opacity 0.2s;
}
.botao-cancelar {
  background: #2a241e;
  color: #fff;
  border: 1px solid #3a332b;
}
.botao-cancelar:hover { background: #342c25; }
.botao-salvar {
  background: #F49D25;
  color: #1a1410;
}
.botao-salvar:hover { background: #e08c18; }

.grade-principal {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 1.5rem;
  width: 100%;
  margin: 0;
  padding: 0;
  border: 0;
}

.coluna-esquerda {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  flex: 1 1 0;
  min-width: 0;
}

.coluna-direita {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  flex: 0 0 340px;
  width: 340px;
  min-width: 0;
}

.cartao { min-width: 0; width: 100%; }

.cabecalho,
.rodape { width: 100%; }

.cartao {
  background: #221E18;
  border: 1px solid rgba(255,255,255,0.04);
  border-radius: 1rem;
  padding: 1.5rem 1.6rem;
}

.cartao-cabecalho {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  margin-bottom: 1.5rem;
}
.cartao-cabecalho h2 {
  color: #fff;
  font-size: 1.1rem;
  font-weight: 700;
}
.icone-cartao {
  width: 2rem;
  height: 2rem;
  background: rgba(244, 157, 37, 0.12);
  color: #F49D25;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.grade-campos {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.2rem 1.4rem;
}

.campo {
  display: flex;
  flex-direction: column;
  gap: 0.45rem;
}
.campo label {
  color: #c5bfb5;
  font-size: 0.85rem;
  font-weight: 500;
}
.campo input,
.campo select {
  background: #131110;
  border: 1px solid #2a241e;
  border-radius: 0.5rem;
  padding: 0.75rem 0.9rem;
  color: #fff;
  font-size: 0.9rem;
  outline: none;
  width: 100%;
  transition: border-color 0.2s;
  appearance: none;
  font-family: inherit;
}
.campo input::placeholder { color: #5c554d; }
.campo input:focus,
.campo select:focus { border-color: #F49D25; }

.ajuda {
  color: #6b6359;
  font-size: 0.75rem;
}

.multi-select { position: relative; width: 100%; }

.multi-select-trigger {
  width: 100%;
  min-height: 2.85rem;
  background: #131110;
  border: 1px solid #2a241e;
  border-radius: 0.5rem;
  padding: 0.4rem 2.2rem 0.4rem 0.7rem;
  color: #fff;
  font-size: 0.9rem;
  text-align: left;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.4rem;
  position: relative;
  font-family: inherit;
  transition: border-color 0.2s;
}
.multi-select.aberto .multi-select-trigger,
.multi-select-trigger:hover { border-color: #F49D25; }

.ms-placeholder { color: #5c554d; font-size: 0.9rem; }

.ms-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  flex: 1;
}

.ms-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.3rem;
  background: rgba(244, 157, 37, 0.15);
  color: #F49D25;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.2rem 0.5rem;
  border-radius: 0.4rem;
}
.ms-tag-x {
  cursor: pointer;
  color: #F49D25;
  font-weight: 700;
  line-height: 1;
  padding: 0 0.15rem;
  border-radius: 0.2rem;
}
.ms-tag-x:hover { background: rgba(244, 157, 37, 0.3); }

.ms-seta {
  position: absolute;
  right: 0.9rem;
  color: #8b8680;
  transition: transform 0.2s;
}
.multi-select.aberto .ms-seta { transform: rotate(180deg); }

.multi-select-menu {
  position: absolute;
  top: calc(100% + 0.3rem);
  left: 0;
  right: 0;
  background: #1c1814;
  border: 1px solid #2a241e;
  border-radius: 0.5rem;
  padding: 0.4rem;
  max-height: 220px;
  overflow-y: auto;
  z-index: 50;
  box-shadow: 0 8px 20px rgba(0,0,0,0.4);
}

.ms-opcao {
  display: flex;
  align-items: center;
  gap: 0.55rem;
  padding: 0.5rem 0.6rem;
  border-radius: 0.35rem;
  cursor: pointer;
  color: #ebe8e4;
  font-size: 0.88rem;
  transition: background 0.15s;
}
.ms-opcao:hover { background: rgba(244, 157, 37, 0.08); }
.ms-opcao input[type="checkbox"] {
  appearance: none;
  -webkit-appearance: none;
  width: 1.05rem;
  height: 1.05rem;
  border: 1.5px solid #5c554d;
  border-radius: 0.25rem;
  background: transparent;
  cursor: pointer;
  position: relative;
  flex-shrink: 0;
  margin: 0;
  transition: background 0.15s, border-color 0.15s;
}
.ms-opcao input[type="checkbox"]:hover { border-color: #F49D25; }
.ms-opcao input[type="checkbox"]:checked {
  background: #F49D25;
  border-color: #F49D25;
}

.ms-vazio {
  padding: 0.6rem;
  color: #8b8680;
  font-size: 0.85rem;
  text-align: center;
}

.select-wrapper {
  position: relative;
}
.select-wrapper select { padding-right: 2.2rem; color: #8b8680; }
.icone-seta {
  position: absolute;
  right: 0.9rem;
  top: 50%;
  transform: translateY(-50%);
  color: #8b8680;
  pointer-events: none;
}

.input-com-icone {
  position: relative;
  display: flex;
  align-items: center;
}
.input-com-icone .prefixo {
  position: absolute;
  left: 0.85rem;
  color: #8b8680;
  display: flex;
  align-items: center;
}
.input-com-icone input {
  padding-left: 2.2rem;
}

.titulo-lateral {
  color: #fff;
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: 1.2rem;
}

.area-upload {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  border: 2px dashed #3a332b;
  border-radius: 0.75rem;
  padding: 2rem 1rem;
  cursor: pointer;
  background: #1c1814;
  transition: border-color 0.2s;
}
.area-upload:hover { border-color: #F49D25; }

.preview-imagem {
  display: flex;
  flex-direction: column;
  gap: 0.8rem;
}
.preview-imagem img {
  width: 100%;
  height: 200px;
  object-fit: cover;
  border-radius: 0.75rem;
  border: 1px solid #2a241e;
  background: #1c1814;
}
.preview-acoes {
  display: flex;
  gap: 0.6rem;
}
.btn-trocar,
.btn-remover {
  flex: 1;
  text-align: center;
  padding: 0.55rem 0.8rem;
  border-radius: 0.5rem;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}
.btn-trocar {
  background: rgba(244, 157, 37, 0.12);
  color: #F49D25;
  border: 1px solid rgba(244, 157, 37, 0.4);
}
.btn-trocar:hover { background: rgba(244, 157, 37, 0.22); }
.btn-remover {
  background: rgba(248, 113, 113, 0.12);
  color: #f87171;
  border: 1px solid rgba(248, 113, 113, 0.3);
}
.btn-remover:hover { background: rgba(248, 113, 113, 0.22); }

.botao-salvar:disabled { opacity: 0.5; cursor: not-allowed; }

.icone-upload {
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  background: #2a241e;
  color: #c5bfb5;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.9rem;
}
.upload-titulo {
  color: #fff;
  font-weight: 600;
  font-size: 0.95rem;
}
.upload-sub {
  color: #8b8680;
  font-size: 0.8rem;
  margin-top: 0.2rem;
}
.upload-formatos {
  color: #6b6359;
  font-size: 0.75rem;
  margin-top: 1rem;
}

.cartao-dica {
  background: rgba(244, 157, 37, 0.06);
  border: 1px solid rgba(244, 157, 37, 0.35);
  border-radius: 1rem;
  padding: 1.2rem 1.3rem;
}
.dica-cabecalho {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.6rem;
}
.dica-cabecalho h3 {
  color: #fff;
  font-size: 0.95rem;
  font-weight: 700;
}
.cartao-dica p {
  color: #c5bfb5;
  font-size: 0.82rem;
  line-height: 1.6;
}

.rodape {
  margin-top: 4rem;
  padding: 3rem 4rem 2rem;
  display: grid;
  grid-template-columns: 2fr 1fr 1fr 1fr;
  gap: 3rem;
  border-top: 1px solid #2a2520;
  background: #181511;
  width: 100%;
}

.rodape-marca .logo-nome {
  font-size: 1.2rem;
  font-weight: 700;
  color: #fff;
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
.logo-destaque { color: #F49D25; }

.rodape-marca p {
  color: #6b6359;
  font-size: 0.82rem;
  line-height: 1.7;
  margin-top: 0.5rem;
}

.rodape-coluna h4 {
  color: #fff;
  font-size: 0.9rem;
  font-weight: 700;
  margin-bottom: 1rem;
}
.rodape-coluna a {
  display: block;
  color: #6b6359;
  text-decoration: none;
  font-size: 0.82rem;
  margin-bottom: 0.55rem;
  transition: color 0.2s;
}
.rodape-coluna a:hover { color: #F49D25; }

.rodape-redes {
  grid-column: 1 / -1;
  display: flex;
  justify-content: flex-end;
  gap: 1.2rem;
  color: #6b6359;
  padding-top: 1rem;
  border-top: 1px solid #2a2520;
}
.rodape-redes a {
  color: #6b6359;
  transition: color 0.2s;
}
.rodape-redes a:hover { color: #F49D25; }

.campo textarea { 
  background: #131110;
  border: 1px solid #2a241e;
  border-radius: 0.5rem;
  padding: 0.75rem 0.9rem;
  color: #fff;
  font-size: 0.9rem;
  outline: none;
  width: 100%;
  transition: border-color 0.2s;
  appearance: none;
  font-family: inherit;
  resize: none;
}

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

.contador {
  display: block;
  text-align: right;
  font-size: 0.75rem;
  color: #6b6359;
  margin-top: 0.3rem;
}
.contador-limite {
  color: #f87171;
}

.lista-epis { margin-top: 1.5rem; }
.lista-epis .cartao-cabecalho { margin-bottom: 1rem; }
.tabela-epis { width: 100%; border-collapse: collapse; }
.tabela-epis th, .tabela-epis td {
  text-align: left;
  padding: 0.75rem 0.8rem;
  border-bottom: 1px solid #2a241e;
  font-size: 0.88rem;
}
.tabela-epis th {
  color: #8b8680;
  font-weight: 600;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}
.tabela-epis .muted { color: #8b8680; }
.vazio-lista { color: #8b8680; padding: 1rem; text-align: center; }

.btn-editar {
  background: rgba(244, 157, 37, 0.12);
  color: #F49D25;
  border: 1px solid rgba(244, 157, 37, 0.4);
  padding: 0.45rem 0.9rem;
  border-radius: 0.45rem;
  font-weight: 600;
  font-size: 0.82rem;
  cursor: pointer;
  font-family: inherit;
}
.btn-editar:hover { background: rgba(244, 157, 37, 0.22); }

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.65);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1.5rem;
  animation: fadeIn 0.15s ease;
}
.modal {
  background: #221E18;
  border: 1px solid rgba(255,255,255,0.06);
  border-radius: 1rem;
  width: 100%;
  max-width: 720px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
.modal-cabecalho {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.2rem 1.5rem;
  border-bottom: 1px solid #2a241e;
}
.modal-cabecalho h2 { font-size: 1.25rem; font-weight: 700; color: #fff; }
.modal-fechar {
  background: transparent;
  border: none;
  color: #8b8680;
  font-size: 1.6rem;
  cursor: pointer;
  line-height: 1;
  padding: 0 0.3rem;
}
.modal-fechar:hover { color: #fff; }
.modal-corpo {
  padding: 1.2rem 1.5rem;
  overflow-y: auto;
  flex: 1;
}
.modal-grade {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem 1.2rem;
}
.campo-largo { grid-column: 1 / -1; }
.modal-rodape {
  display: flex;
  justify-content: flex-end;
  gap: 0.7rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #2a241e;
  background: #1c1814;
}
.preview-imagem-modal img {
  width: 100%;
  max-height: 180px;
  object-fit: cover;
  border-radius: 0.6rem;
  border: 1px solid #2a241e;
}
.area-upload-modal { padding: 1.2rem; }

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

@media (max-width: 960px) {
  .modal-grade { grid-template-columns: 1fr; }
  .grade-principal { flex-direction: column; }
  .coluna-direita { flex: 1 1 auto; width: 100%; }
  .grade-campos { grid-template-columns: 1fr; }
  .cabecalho { flex-direction: column; }
  .rodape { grid-template-columns: 1fr 1fr; }

}
</style>
