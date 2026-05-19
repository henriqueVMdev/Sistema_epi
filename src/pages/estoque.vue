<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useSupabase } from '../composables/useSupabase';

const { supabase, perfil } = useSupabase();
const router = useRouter();

const irParaCadastro = () => {
  router.push('/cadastro_epi');
};

const verDetalhes = (id) => {
  router.push(`/epi/${id}`);
};

const epis = ref([]);
const carregando = ref(true);

// Quem é admin/almoxarife enxerga tudo e tem ações administrativas.
const podeAdministrar = computed(() => ['admin', 'almoxarife'].includes(perfil.value?.role));

const carregar = async () => {
  carregando.value = true;

  const role = perfil.value?.role;
  const setorId = perfil.value?.setor_id;

  // Sem perfil resolvido ainda — não tenta carregar pra evitar mostrar tudo erradamente.
  if (!role) {
    epis.value = [];
    carregando.value = false;
    return;
  }

  // Admin/almoxarife: vê todos os EPIs (sem limite atrelado).
  if (podeAdministrar.value) {
    const { data, error } = await supabase.from('epis').select('*').order('nome');
    if (error) console.error(error);
    epis.value = data || [];
    carregando.value = false;
    return;
  }

  // Professor/aluno: só vê EPIs com permissão para sua role + seu setor.
  if (!setorId) {
    epis.value = [];
    carregando.value = false;
    return;
  }

  const { data: perms, error: errPerms } = await supabase
    .from('epi_permissoes')
    .select('epi_id, limite, epi:epis(*)')
    .eq('role', role)
    .eq('setor_id', setorId);

  if (errPerms) {
    console.error(errPerms);
    epis.value = [];
    carregando.value = false;
    return;
  }

  // Achata: cada epi vira uma linha com .limite anexo
  epis.value = (perms || [])
    .filter(p => p.epi) // segurança caso EPI tenha sido removido
    .map(p => ({ ...p.epi, limite: p.limite }))
    .sort((a, b) => a.nome.localeCompare(b.nome));

  carregando.value = false;
};

onMounted(() => {
  carregar();
});

// Recarrega se o perfil mudar (ex.: admin promove o usuário e ele recarrega a tela).
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
  const qtd = Number(epi.quantidade);
  const min = Number(epi.estoque_minimo);
  return !isNaN(qtd) && !isNaN(min) && min > 0 && qtd <= min;
};

const quantidadeAdicionar = ref({});

const adicionarEstoque = async (epi) => {
  const qtd = parseInt(quantidadeAdicionar.value[epi.id], 10);
  if (isNaN(qtd) || qtd <= 0) return;

  const novoEstoque = (Number(epi.estoque) || 0) + qtd;
  const { error } = await supabase
    .from('epis')
    .update({ estoque: novoEstoque })
    .eq('id', epi.id);

  if (error) {
    console.error(error);
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

    <header class="cabecalho">
      <div class="cabecalho-texto">
        <p class="caminho">
          Home <span class="separador">›</span>
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
            <img v-if="epi.imagem" :src="epi.imagem" :alt="epi.nome" />
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

          <button v-if="podeAdministrar" class="btn-detalhes" @click.stop="verDetalhes(epi.id)">
            Ver mais detalhes →
          </button>
          <div v-else-if="epi.limite != null" class="badge-limite" title="Limite por pedido sem precisar de aprovação">
            Limite: <strong>{{ epi.limite }}</strong>
          </div>

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
              <div class="setor-info">
                <span class="campo-label">Setor de uso:</span>
                <span class="campo-valor">{{ epi.setor || '—' }}</span>
              </div>

              <div v-if="podeAdministrar" class="acoes-secundarias">
                <button class="btn-acao btn-editar" title="Editar">
                  Editar
                </button>
                <button class="btn-acao btn-excluir" title="Excluir" @click = "excluir(epi.id)">
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
              <button class="toggle">
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
                <button
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
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 1.5rem;
  margin-bottom: 2.5rem;
}

.botao-cadastrar {
  background: #F49D25;
  color: #1a1410;
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
.botao-cadastrar:hover { background: #e08c18; }
.botao-cadastrar:active { transform: scale(0.97); }

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
  background: linear-gradient(180deg, #2d2823 0%, #28231e 100%);
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 0.85rem;
  overflow: hidden;
  transition: border-color 0.2s, transform 0.15s, box-shadow 0.2s;
}
.card-epi:hover {
  border-color: rgba(244, 157, 37, 0.3);
  transform: translateY(-1px);
  box-shadow: 0 6px 18px rgba(0,0,0,0.25);
}
.card-expandido {
  border-color: rgba(244, 157, 37, 0.45);
  box-shadow: 0 4px 14px rgba(244, 157, 37, 0.08);
}

.card-principal {
  display: flex;
  align-items: stretch;
  gap: 1.4rem;
  padding: 1.1rem 1.4rem;
}

/* ---------- imagem ---------- */
.card-imagem {
  flex: 0 0 96px;
  width: 96px;
  height: 96px;
  border-radius: 0.65rem;
  overflow: hidden;
  background: #3a332b;
  border: 1px solid rgba(255,255,255,0.05);
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
    linear-gradient(135deg, rgba(244,157,37,0.08), transparent 60%),
    #3a332b;
}

/* ---------- info ---------- */
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
  color: #fff;
  font-size: 1.35rem;
  font-weight: 700;
  letter-spacing: -0.015em;
  line-height: 1.2;
}

.epi-fabricante {
  color: #8b8680;
  font-size: 0.85rem;
}
.epi-fabricante span { color: #c5bfb5; font-weight: 600; }

/* ---------- chips de meta ---------- */
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
  color: #F49D25;
  font-weight: 700;
  font-size: 0.72rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.meta-valor {
  color: #ebe8e4;
  font-weight: 500;
}

/* ---------- bloco de estoque ---------- */
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
  color: #F49D25;
  font-size: 0.7rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.estoque-numero {
  color: #fff;
  font-size: 2rem;
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.02em;
}
.estoque-numero-alerta { color: #f87171; }

.estoque-minimo {
  color: #8b8680;
  font-size: 0.72rem;
}

.btn-detalhes {
  flex: 0 0 auto;
  align-self: center;
  background: transparent;
  border: 1px solid rgba(244, 157, 37, 0.4);
  color: #F49D25;
  font-size: 0.8rem;
  font-weight: 600;
  padding: 0.55rem 0.9rem;
  border-radius: 0.5rem;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s, border-color 0.15s;
}
.btn-detalhes:hover {
  background: rgba(244, 157, 37, 0.12);
  border-color: #F49D25;
}

.badge-limite {
  align-self: center;
  background: rgba(244, 157, 37, 0.10);
  border: 1px solid rgba(244, 157, 37, 0.35);
  color: #F49D25;
  font-size: 0.78rem;
  font-weight: 600;
  padding: 0.45rem 0.85rem;
  border-radius: 0.5rem;
  white-space: nowrap;
}
.badge-limite strong { color: #fff; font-weight: 800; }

.estoque-vazio {
  background: rgba(244, 157, 37, 0.06);
  border: 1px dashed rgba(244, 157, 37, 0.35);
  color: #c5bfb5;
  text-align: center;
  padding: 2rem;
  border-radius: 1rem;
  margin-bottom: 4rem;
  font-size: 0.92rem;
}

/* ---------- badge estoque baixo ---------- */
.badge-alerta {
  flex: 0 0 auto;
  background: rgba(220, 60, 60, 0.12);
  border: 1px solid rgba(220, 60, 60, 0.4);
  color: #f87171;
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.28rem 0.7rem;
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

.detalhe-acoes .campo-label{
  font-size: 0.85rem;
  color: #F49D25;
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
.add-estoque-texto strong { color: #fff; }

.add-estoque-controles {
  display: flex;
  align-items: center;
  gap: 0.45rem;
  flex-shrink: 0;
}

.input-qtd {
  width: 80px;
  background: #2a2520;
  border: 1px solid rgba(244, 157, 37, 0.3);
  color: #fff;
  border-radius: 0.4rem;
  padding: 0.4rem 0.55rem;
  font-size: 0.82rem;
  outline: none;
  transition: border-color 0.15s;
}
.input-qtd::placeholder { color: #6b6359; }
.input-qtd:focus { border-color: #F49D25; }
.input-qtd::-webkit-outer-spin-button,
.input-qtd::-webkit-inner-spin-button { appearance: none; -webkit-appearance: none; margin: 0; }
.input-qtd[type=number] { appearance: textfield; -moz-appearance: textfield; }

.btn-adicionar {
  background: rgba(244, 157, 37, 0.15);
  color: #F49D25;
  padding: 0.45rem 0.85rem;
  font-size: 0.82rem;
  white-space: nowrap;
}
.btn-adicionar:hover:not(:disabled) { background: rgba(244, 157, 37, 0.28); }
.btn-adicionar:disabled { opacity: 0.4; cursor: not-allowed; }

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
  background: rgba(244, 157, 37, 0.06);
  border: 1px solid rgba(244, 157, 37, 0.2);
  border-radius: 0.65rem;
  padding: 0.55rem 1rem;
  flex: 1 1 0;
  min-width: 0;
}

.notificacao-texto {
  display: flex;
  align-items: flex-start;
  gap: 0.7rem;
  color: #F49D25;
}

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
