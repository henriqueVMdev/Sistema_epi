<script setup>
import { reactive, ref, onMounted } from 'vue';
import { useSupabase } from '@/composables/useSupabase';
import { useRouter } from 'vue-router';

const { supabase } = useSupabase();
const epis = ref([]);
const editandoId = ref(null);
const funcionarios = ref([]);
const setorAberto = ref(false);
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

const mostrarMensagem = (tipo, texto) => {
  mensagem.value = { tipo, texto };
  setTimeout(() => { mensagem.value = null; }, 4000);
};

const carregar = async () => {
  const { data } = await supabase.from('epis').select('*').order('nome');
  epis.value = data || [];
};

const salvar = async () => {
  const payload = { ...form, setor: (form.setor || []).join(', ') };

  if (editandoId.value) {
    const { error } = await supabase.from('epis').update(payload).eq('id', editandoId.value);
    if (error) {
      mostrarMensagem('erro', 'Erro ao atualizar o cadastro. Tente novamente.');
      return;
    }
    mostrarMensagem('sucesso', 'EPI atualizado com sucesso!');
  } else {
    const { error } = await supabase.from('epis').insert(payload);
    if (error) {
      mostrarMensagem('erro', 'Erro ao cadastrar o EPI. Tente novamente.');
      return;
    }
    mostrarMensagem('sucesso', 'EPI cadastrado com sucesso!');
  }
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

// reseta o formulário e sai do modo edição
const cancelarEdicao = () => {
  // volta o id para null (modo "novo cadastro")
  editandoId.value = null;
  // Object.assign sobrescreve as chaves do form mantendo a MESMA referência reativa
  // (não dá pra reatribuir um const reactive — perderia a reatividade)
  Object.assign(form, {
   nome: '',
   setor: [],
   fabricante: '',
   custo: '',
   numero_ca: '',
   data_validade: '',
   estoque: '',
   estoque_minimo: '',
  });
};

// volta uma página no histórico (botão Cancelar do cabeçalho)
const voltar = () => {
  router.back();
};

// busca os setores existentes na tabela funcionarios para popular o <select> de setor
const carregarSetor = async () => {
  // SELECT id, setor FROM funcionarios ORDER BY setor
  const { data, error } = await supabase
    .from('funcionarios')
    .select('id, setor')
    .order('setor');
  // loga eventual erro de query (permissões, tabela inexistente, etc.)
  if (error) console.error(error);
  // popula o array reativo; o template faz v-for sobre ele
  // ATENÇÃO: pode vir setor duplicado (vários funcionários no mesmo setor).
  // Pra deduplicar: funcionarios.value = [...new Map((data||[]).map(f => [f.setor, f])).values()];
  funcionarios.value = data || [];
};

// onMounted roda uma única vez, logo após o componente entrar no DOM
onMounted(() => {
  carregar();        // carrega a lista de EPIs
  carregarSetor();   // carrega os setores pro select
});
</script>

<template>
  <div class="pagina-cadastro">

    <!-- cabeçalho da pagina: caminho + titulo + botões -->
    <header class="cabecalho">
      <div class="cabecalho-texto">
        <p class="caminho">
          Home <span class="separador">›</span>
          Estoque <span class="separador">›</span>
          <span class="caminho-atual">Cadastro de EPI</span>
        </p>
        <h1 class="titulo-pagina">Novo <span class="titulo-destaque">EPI</span></h1>
        <p class="subtitulo">Preencha os dados abaixo para registrar um novo equipamento de proteção.</p>
      </div>

      <div class="botoes-acao">
        <button type="button" class="botao botao-cancelar" @click="voltar">Cancelar</button>
        <button type="button" class="botao botao-salvar" @click="salvar">
          Salvar Cadastro
        </button>
      </div>
    </header>

    <div v-if="mensagem" :class="['toast', 'toast-' + mensagem.tipo]">
      {{ mensagem.texto }}
    </div>

    <!-- grade principal: coluna esquerda (formularios) + coluna direita (imagem e dica) -->
    <form class="grade-principal" @submit.prevent="salvar">

      <!-- COLUNA ESQUERDA -->
      <div class="coluna-esquerda">

        <!-- cartão: informações básicas -->
        <section class="cartao">
          <div class="cartao-cabecalho">
            <span class="icone-cartao">
            </span>
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

        <!-- cartão: certificado de aprovação -->
        <section class="cartao">
          <div class="cartao-cabecalho">
            <span class="icone-cartao">
            </span>
            <h2>Certificado de Aprovação (CA)</h2>
          </div>

          <div class="grade-campos">
            <div class="campo">
              <label for="numero_ca">Número do CA</label>
              <div class="input-com-icone">
                <span class="prefixo">#</span>
                <input v-model="form.numero_ca" type="int" placeholder="00000">
              </div>
            </div>

            <div class="campo">
              <label for="data_validade">Data de Validade</label>
              <div class="input-com-icone">
                <span class="prefixo">
                </span>
                <input v-model="form.data_validade" type="date">
              </div>
            </div>
          </div>
        </section>

        <!-- cartão: controle de estoque -->
        <section class="cartao">
          <div class="cartao-cabecalho">
            <span class="icone-cartao">
            </span>
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

          <label class="area-upload">
            <p class="upload-titulo">Clique para enviar</p>
            <p class="upload-sub">ou arraste e solte</p>
            <p class="upload-formatos">PNG, JPG ou WEBP (Max. 5MB)</p>
            <input type="file" accept="image/png, image/jpeg, image/webp" hidden>
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
          
       
    <footer class="rodape">
      <div class="rodape-marca">
        <span class="logo-nome">
          <span class="logo-icone">
          </span>
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

/* ---------- cabeçalho ---------- */
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

/* ---------- grade principal ---------- */
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

/* ---------- cartão padrão ---------- */
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

/* ---------- campos ---------- */
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

/* ---------- multi-select de setor ---------- */
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
  accent-color: #F49D25;
  width: 1rem;
  height: 1rem;
  cursor: pointer;
}

.ms-vazio {
  padding: 0.6rem;
  color: #8b8680;
  font-size: 0.85rem;
  text-align: center;
}

/* ---------- select customizado ---------- */
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

/* ---------- input com icone (CA, data) ---------- */
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

/* ---------- coluna direita: upload ---------- */
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

/* ---------- cartão dica ---------- */
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

/* ---------- rodapé ---------- */
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
  background: #F49D25;
  border-radius: 0.35rem;
  display: inline-flex;
  align-items: center;
  justify-content: center;
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

/* ---------- toast ---------- */
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

/* ---------- contador textarea ---------- */
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

/* ---------- responsivo ---------- */
@media (max-width: 960px) {
  .grade-principal { flex-direction: column; }
  .coluna-direita { flex: 1 1 auto; width: 100%; }
  .grade-campos { grid-template-columns: 1fr; }
  .cabecalho { flex-direction: column; }
  .rodape { grid-template-columns: 1fr 1fr; }

}
</style>
