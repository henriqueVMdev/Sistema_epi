<script setup>
import { reactive, ref, onMounted } from 'vue';
import { useSupabase } from '@/composables/useSupabase';
import { useRouter } from 'vue-router';

const { supabase } = useSupabase();
const epis = ref([]);
const editandoId = ref(null);
const form = reactive({
  nome: '',
  numero_ca: '',
  descricao: '',
  data_validade: '',
  fabricante: '',
  setor: '',
  custo: '',
  quantidade: '',
  estoque_atual: 0,
});
const router = useRouter();

const carregar = async () => {
  const { data } = await supabase.from('epis').select('*').order('nome');
  epis.value = data || [];
};

const salvar = async () => {
  if (editandoId.value) {
    await supabase.from('epis').update(form).eq('id', editandoId.value);
  } else {
    const { error } = await supabase.from('epis').insert(form);
    if (error) console.error('erro ao cadastrar:', error);
  }
  cancelarEdicao();
  carregar();
};

const cancelarEdicao = () => {
  editandoId.value = null;
  Object.assign(form, {
    nome: '', numero_ca: '', descricao: '', data_validade: '',
    fabricante: '', setor: '', custo: '', quantidade: '', estoque_atual: 0,
  });
};

const voltar = () => {
  router.back();
};

onMounted(carregar);
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
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/>
            <polyline points="17 21 17 13 7 13 7 21"/>
            <polyline points="7 3 7 8 15 8"/>
          </svg>
          Salvar Cadastro
        </button>
      </div>
    </header>

    <!-- grade principal: coluna esquerda (formularios) + coluna direita (imagem e dica) -->
    <form class="grade-principal" @submit.prevent="salvar">

      <!-- COLUNA ESQUERDA -->
      <div class="coluna-esquerda">

        <!-- cartão: informações básicas -->
        <section class="cartao">
          <div class="cartao-cabecalho">
            <span class="icone-cartao">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="16" x2="12" y2="12"/>
                <line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
            </span>
            <h2>Informações Básicas</h2>
          </div>

          <div class="grade-campos">
            <div class="campo">
              <label for="nome">Nome do EPI</label>
              <input id="nome" v-model="form.nome" type="text" placeholder="Ex: Bota bico de ferro">
            </div>

            <div class="campo">
              <label for="setor">Setor de uso</label>
              <div class="select-wrapper">
                <select id="setor" v-model="form.setor">
                  <option value="" disabled selected>Selecione um setor</option>
                  <option value="manutencao">Manutenção</option>
                  <option value="producao">Produção</option>
                  <option value="logistica">Logística</option>
                  <option value="administrativo">Administrativo</option>
                </select>
                <svg class="icone-seta" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>
            </div>

            <div class="campo">
              <label for="fabricante">Fabricante</label>
              <input id="fabricante" v-model="form.fabricante" type="text" placeholder="Ex: MSA Safety">
            </div>

            <div class="campo">
              <label for="custo">Custo</label>
              <input id="custo" v-model="form.custo" type="text" placeholder="Ex: 123456">
            </div>
          </div>
        </section>

        <!-- cartão: certificado de aprovação -->
        <section class="cartao">
          <div class="cartao-cabecalho">
            <span class="icone-cartao">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </span>
            <h2>Certificado de Aprovação (CA)</h2>
          </div>

          <div class="grade-campos">
            <div class="campo">
              <label for="numero_ca">Número do CA</label>
              <div class="input-com-icone">
                <span class="prefixo">#</span>
                <input id="numero_ca" v-model="form.numero_ca" type="text" placeholder="00000">
              </div>
            </div>

            <div class="campo">
              <label for="data_validade">Data de Validade</label>
              <div class="input-com-icone">
                <span class="prefixo">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
                    <line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/>
                    <line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                </span>
                <input id="data_validade" v-model="form.data_validade" type="date">
              </div>
            </div>
          </div>
        </section>

        <!-- cartão: controle de estoque -->
        <section class="cartao">
          <div class="cartao-cabecalho">
            <span class="icone-cartao">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
            </span>
            <h2>Controle de Estoque</h2>
          </div>

          <div class="grade-campos">
            <div class="campo">
              <label for="quantidade">Quantidade a adicionar ao estoque</label>
              <input id="quantidade" v-model="form.quantidade" type="number" placeholder="0">
              <small class="ajuda">Alerta será enviado ao atingir este valor.</small>
            </div>

            <div class="campo">
              <label for="estoque_atual">Estoque Atual</label>
              <div class="select-wrapper">
                <select id="estoque_atual" v-model="form.estoque_atual">
                  <option value="" disabled selected>Selecione o item</option>
                  <option value="0">0</option>
                  <option value="10">10</option>
                  <option value="50">50</option>
                  <option value="100">100</option>
                </select>
                <svg class="icone-seta" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </div>
            </div>
          </div>
        </section>
      </div>

      <!-- COLUNA DIREITA -->
      <aside class="coluna-direita">

        <!-- cartão: imagem do produto -->
        <section class="cartao">
          <h2 class="titulo-lateral">Imagem do Produto</h2>

          <label class="area-upload">
            <div class="icone-upload">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
            </div>
            <p class="upload-titulo">Clique para enviar</p>
            <p class="upload-sub">ou arraste e solte</p>
            <p class="upload-formatos">PNG, JPG ou WEBP (Max. 5MB)</p>
            <input type="file" accept="image/png, image/jpeg, image/webp" hidden>
          </label>
        </section>

        <!-- cartão: dica importante -->
        <section class="cartao-dica">
          <div class="dica-cabecalho">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#F49D25" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 18h6"/>
              <path d="M10 22h4"/>
              <path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z"/>
            </svg>
            <h3>Dica Importante</h3>
          </div>
          <p>
            Mantenha o número do CA atualizado. O sistema notificará automaticamente 30 dias antes do vencimento do certificado.
          </p>
        </section>
      </aside>
    </form>

    <!-- rodapé -->
    <footer class="rodape">
      <div class="rodape-marca">
        <span class="logo-nome">
          <span class="logo-icone">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
            </svg>
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

      <div class="rodape-redes">
        <a href="#" aria-label="Facebook">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M22 12a10 10 0 1 0-11.6 9.87v-6.98H7.9V12h2.5V9.8c0-2.46 1.46-3.82 3.7-3.82 1.07 0 2.2.19 2.2.19v2.42h-1.24c-1.22 0-1.6.76-1.6 1.54V12h2.72l-.43 2.89h-2.29v6.98A10 10 0 0 0 22 12z"/></svg>
        </a>
        <a href="#" aria-label="YouTube">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8zM9.6 15.6V8.4l6.3 3.6-6.3 3.6z"/></svg>
        </a>
        <a href="#" aria-label="Maleta">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20 7h-4V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zm-6 0h-4V5h4z"/></svg>
        </a>
      </div>
    </footer>
  </div>
</template>

<style scoped>
/* ---------- base da pagina ---------- */
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

/* ---------- responsivo ---------- */
@media (max-width: 960px) {
  .grade-principal { flex-direction: column; }
  .coluna-direita { flex: 1 1 auto; width: 100%; }
  .grade-campos { grid-template-columns: 1fr; }
  .cabecalho { flex-direction: column; }
  .rodape { grid-template-columns: 1fr 1fr; }
}
</style>
