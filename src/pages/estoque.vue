<script setup>
import { ref, onMounted } from 'vue';
import { useSupabase } from '../composables/useSupabase';

const{supabase} = useSupabase();

const epis = ref([]);
const carregando = ref(true);

const carregar = async () => {
  carregando.value = true;
  const { data, error } = await supabase.from ('epis').select('*').order('nome');
  if (error) console.error(error);
  epis.value = data || [];
  carregando.value = false;
}
onMounted(() =>{
  carregar();
});

const expandido = ref(null);

const toggleCard = (id) => {
  expandido.value = expandido.value === id ? null : id;
};

const estoquebaixo = (epi) => {
  const qtd = Number(epi.quantidade);
  const min = Number(epi.estoque_minimo);
  return !isNaN(qtd) && !isNaN(min) && min > 0 && qtd <= min;
};

</script>

<template>
  <div class="pagina-estoque">

    <header class="cabecalho">
      <div class="cabecalho-texto">
        <p class="caminho">
          Home <span class="separador">›</span>
          <span class="caminho-atual">Estoque</span>
        </p>
        <h1 class="titulo-pagina">Controle de <span class="titulo-destaque">Estoque</span></h1>
        <p class="subtitulo">Aqui é onde vai controlar o estoque de EPIs da sua empresa.</p>
      </div>
    </header>

    <p v-if = "carregando">Carregando...</p>
    <section v-else class="lista-epis">
      <div
        v-for="epi in epis"
        :key="epi.id"
        class="card-epi"
        :class="{ 'card-expandido': expandido === epi.id }"
      >
        <div class="card-principal">
          <div class="card-imagem">
            <img v-if="epi.imagem" :src="epi.imagem" :alt="epi.nome" />
            <div v-else class="imagem-placeholder"></div>
          </div>

          <div class="card-info">
            <div class="info-esquerda">
              <p class="epi-nome">{{ epi.nome }}</p>
              <p class="epi-campo">
                <span class="campo-label">Fabricante:</span>
                <span class="campo-valor">{{ epi.fabricante }}</span>
              </p>
              <p class="epi-campo">
                <span class="campo-label">Custo:</span>
                <span class="campo-valor">{{ epi.custo }}</span>
              </p>
            </div>

            <div class="info-direita">
              <div class="estoque-linha">
                <p class="epi-campo">
                  <span class="campo-label">Estoque:</span>
                  <span class="campo-valor">{{ epi.estoque }}</span>
                </p>
                <p class="epi-campo">
                  <span class="campo-label">Estoque mínimo:</span>
                  <span class="campo-valor">{{ epi.estoque_minimo }}</span>
                </p>
              </div>
              <p class="epi-campo">
                <span class="campo-label">Data de validade:</span>
                <span class="campo-valor">{{ epi.data_validade }}</span>
              </p>
              <p class="epi-campo">
                <span class="campo-label">CA:</span>
                <span class="campo-valor">{{ epi.numero_ca }}</span>
              </p>
            </div>
          </div>

          <span v-if="estoquebaixo(epi)" class="badge-alerta">Estoque baixo</span>

          <button class="btn-expandir" @click="toggleCard(epi.id)">
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
              <button class="btn-acao btn-editar" title="Editar">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
                Editar
              </button>
              <button class="btn-acao btn-excluir" title="Excluir">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M10 11v6M14 11v6"/>
                  <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                </svg>
                Excluir
              </button>
            </div>
          </div>

          <div class="detalhe-notificacao">
            <div class="notificacao-texto">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
              </svg>
              <div>
                <p class="notificacao-titulo">Notificação de estoque mínimo</p>
                <p class="notificacao-sub">Receber alerta quando o estoque atingir {{ epi.estoque_minimo }} unidades</p>
              </div>
            </div>
            <button class="toggle">
              <span class="toggle-bolinha"></span>
            </button>
          </div>
        </div>
      </div>
    </section>

    <footer class="rodape">
      <div class="rodape-marca">
        <span class="logo-nome">
          <span class="logo-icone"></span>
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
  background: #181511;
  min-height: 100vh;
  color: #fff;
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

/* ---------- cabeçalho ---------- */
.cabecalho {
  margin-bottom: 2.5rem;
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

/* ---------- lista ---------- */
.lista-epis {
  background: #221E18;
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 1rem;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 4rem;
}

/* ---------- card EPI ---------- */
.card-epi {
  background: #2a2520;
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 0.75rem;
  overflow: hidden;
  transition: border-color 0.2s;
}
.card-epi:hover { border-color: rgba(244, 157, 37, 0.25); }
.card-expandido { border-color: rgba(244, 157, 37, 0.4); }

.card-principal {
  display: flex;
  align-items: center;
  gap: 1.2rem;
  padding: 1.1rem 1.3rem;
}

/* ---------- imagem ---------- */
.card-imagem {
  flex: 0 0 80px;
  width: 80px;
  height: 80px;
  border-radius: 0.5rem;
  overflow: hidden;
  background: #3a332b;
}
.card-imagem img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.imagem-placeholder {
  width: 100%;
  height: 100%;
  background: #3a332b;
}

/* ---------- info ---------- */
.card-info {
  flex: 1;
  display: flex;
  gap: 2rem;
  align-items: flex-start;
}

.info-esquerda {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.info-direita {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
}

.estoque-linha {
  display: flex;
  gap: 1.5rem;
}

.epi-nome {
  color: #F49D25;
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: 0.15rem;
}

.epi-campo {
  font-size: 0.88rem;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  flex-wrap: wrap;
}

.campo-label {
  color: #F49D25;
  font-weight: 600;
}

.campo-valor {
  color: #fff;
  font-weight: 500;
}

/* ---------- badge estoque baixo ---------- */
.badge-alerta {
  flex: 0 0 auto;
  background: rgba(220, 60, 60, 0.15);
  border: 1px solid rgba(220, 60, 60, 0.4);
  color: #f87171;
  font-size: 0.72rem;
  font-weight: 600;
  padding: 0.25rem 0.65rem;
  border-radius: 999px;
  white-space: nowrap;
}

/* ---------- botão expandir ---------- */
.btn-expandir {
  flex: 0 0 auto;
  background: none;
  border: none;
  color: #F49D25;
  cursor: pointer;
  padding: 0.4rem;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.4rem;
  transition: background 0.15s;
}
.btn-expandir:hover { background: rgba(244, 157, 37, 0.1); }

.btn-expandir svg {
  transition: transform 0.25s ease;
}
.btn-expandir svg.rotacionado {
  transform: rotate(180deg);
}

/* ---------- detalhe expandido ---------- */
.card-detalhe {
  border-top: 1px solid rgba(255,255,255,0.06);
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
  color: #F49D25;
}
.detalhe-campo .campo-valor {
  font-size: 0.9rem;
  color: #fff;
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

/* ---------- detalhe expandido ---------- */
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
  color: #c5bfb5;
  font-size: 0.88rem;
  line-height: 1.65;
}

.detalhe-acoes {
  display: flex;
  gap: 0.5rem;
  flex-shrink: 0;
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

.btn-editar {
  background: rgba(244, 157, 37, 0.12);
  color: #F49D25;
}
.btn-editar:hover { background: rgba(244, 157, 37, 0.22); }

.btn-excluir {
  background: rgba(248, 113, 113, 0.12);
  color: #f87171;
}
.btn-excluir:hover { background: rgba(248, 113, 113, 0.22); }

.detalhe-notificacao {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  background: rgba(244, 157, 37, 0.06);
  border: 1px solid rgba(244, 157, 37, 0.2);
  border-radius: 0.65rem;
  padding: 0.55rem 1rem;
}

.notificacao-texto {
  display: flex;
  align-items: flex-start;
  gap: 0.7rem;
  color: #F49D25;
}
.notificacao-texto svg { flex-shrink: 0; margin-top: 2px; }

.notificacao-titulo {
  color: #fff;
  font-size: 0.85rem;
  font-weight: 600;
}
.notificacao-sub {
  color: #8b8680;
  font-size: 0.75rem;
  margin-top: 0.1rem;
}

/* toggle switch */
.toggle {
  flex-shrink: 0;
  width: 44px;
  height: 24px;
  background: #3a332b;
  border: none;
  border-radius: 999px;
  cursor: pointer;
  position: relative;
  transition: background 0.25s;
  padding: 0;
}
.toggle-ativo { background: #F49D25; }

.toggle-bolinha {
  position: absolute;
  top: 3px;
  left: 3px;
  width: 18px;
  height: 18px;
  background: #fff;
  border-radius: 50%;
  transition: transform 0.25s;
  display: block;
}
.toggle-ativo .toggle-bolinha { transform: translateX(20px); }

/* ---------- responsivo ---------- */
@media (max-width: 960px) {
  .pagina-estoque { padding: 1.5rem 1.5rem 0; }
  .card-info { flex-direction: column; gap: 0.75rem; }
  .detalhe-grade { grid-template-columns: repeat(2, 1fr); }
  .rodape { grid-template-columns: 1fr 1fr; }
}

@media (max-width: 600px) {
  .titulo-pagina { font-size: 1.8rem; }
  .estoque-linha { flex-direction: column; gap: 0.2rem; }
  .detalhe-grade { grid-template-columns: 1fr 1fr; }
  .rodape { grid-template-columns: 1fr; gap: 1.5rem; }
}
</style>
