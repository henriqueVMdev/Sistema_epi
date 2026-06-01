<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useSupabase } from '@/composables/useSupabase';

const { supabase } = useSupabase();

const setores = ref([]);
const epis = ref([]);
const vinculos = ref([]); // [{ setor_id, epi_id, quantidade }]
const carregando = ref(true);
const mensagem = ref(null);
const setorAbertoId = ref(null);
const salvandoId = ref(null);

// estado local da edição de epis do setor aberto: { [epi_id]: { selecionado, quantidade } }
const edicaoEpis = ref({});

const novoSetor = reactive({ nome: '' });
const editandoId = ref(null);
const editandoNome = ref('');

const mostrarMensagem = (tipo, texto) => {
  mensagem.value = { tipo, texto };
  setTimeout(() => { mensagem.value = null; }, 3500);
};

const carregar = async () => {
  carregando.value = true;
  const [{ data: s }, { data: e }, { data: v }] = await Promise.all([
    supabase.from('setores').select('id, nome').order('nome'),
    supabase.from('epis').select('id, nome').order('nome'),
    supabase.from('setor_epis').select('setor_id, epi_id, quantidade'),
  ]);
  setores.value = s || [];
  epis.value = e || [];
  vinculos.value = v || [];
  carregando.value = false;
};

const totalEpisVinculados = (setorId) =>
  vinculos.value.filter(v => v.setor_id === setorId).length;

const criarSetor = async () => {
  if (!novoSetor.nome.trim()) return;
  const { error } = await supabase.from('setores').insert({ nome: novoSetor.nome.trim() });
  if (error) return mostrarMensagem('erro', 'Erro ao criar: ' + error.message);
  novoSetor.nome = '';
  mostrarMensagem('sucesso', 'Setor criado!');
  carregar();
};

const iniciarEdicao = (s) => {
  editandoId.value = s.id;
  editandoNome.value = s.nome;
};

const salvarNome = async (s) => {
  if (!editandoNome.value.trim()) return;
  const { error } = await supabase
    .from('setores')
    .update({ nome: editandoNome.value.trim() })
    .eq('id', s.id);
  if (error) return mostrarMensagem('erro', 'Erro ao salvar: ' + error.message);
  editandoId.value = null;
  mostrarMensagem('sucesso', 'Nome atualizado.');
  carregar();
};

const excluirSetor = async (s) => {
  if (!confirm(`Excluir o setor "${s.nome}"? Isso remove os vínculos com EPIs.`)) return;
  const { error } = await supabase.from('setores').delete().eq('id', s.id);
  if (error) return mostrarMensagem('erro', 'Erro ao excluir: ' + error.message);
  mostrarMensagem('sucesso', 'Setor excluído.');
  carregar();
};

// abre o painel e prepara o estado local de edição com os dados atuais
const toggleAbrir = (setorId) => {
  if (setorAbertoId.value === setorId) {
    setorAbertoId.value = null;
    edicaoEpis.value = {};
    return;
  }
  setorAbertoId.value = setorId;
  const novo = {};
  for (const epi of epis.value) {
    const v = vinculos.value.find(x => x.setor_id === setorId && x.epi_id === epi.id);
    novo[epi.id] = {
      selecionado: !!v,
      quantidade: v?.quantidade ?? 0,
    };
  }
  edicaoEpis.value = novo;
};

// salva todos os vínculos do setor (upsert dos selecionados + delete dos desmarcados)
const salvarEpisDoSetor = async (setorId) => {
  salvandoId.value = setorId;

  const selecionados = epis.value.filter(e => edicaoEpis.value[e.id]?.selecionado);
  const desmarcados  = epis.value.filter(e => !edicaoEpis.value[e.id]?.selecionado);

  if (selecionados.length) {
    const rows = selecionados.map(e => ({
      setor_id: setorId,
      epi_id: e.id,
      quantidade: Number(edicaoEpis.value[e.id].quantidade) || 0,
    }));
    const { error: e1 } = await supabase
      .from('setor_epis')
      .upsert(rows, { onConflict: 'setor_id,epi_id' });
    if (e1) {
      salvandoId.value = null;
      return mostrarMensagem('erro', 'Erro ao salvar: ' + e1.message);
    }
  }

  const idsParaRemover = desmarcados
    .map(e => e.id)
    .filter(epiId => vinculos.value.some(v => v.setor_id === setorId && v.epi_id === epiId));

  if (idsParaRemover.length) {
    const { error: e2 } = await supabase
      .from('setor_epis')
      .delete()
      .eq('setor_id', setorId)
      .in('epi_id', idsParaRemover);
    if (e2) {
      salvandoId.value = null;
      return mostrarMensagem('erro', 'Erro ao remover: ' + e2.message);
    }
  }

  salvandoId.value = null;
  mostrarMensagem('sucesso', 'EPIs do setor atualizados.');
  await carregar();
  // mantém o painel aberto e atualiza o estado local com os dados recém-salvos
  const novo = {};
  for (const epi of epis.value) {
    const v = vinculos.value.find(x => x.setor_id === setorId && x.epi_id === epi.id);
    novo[epi.id] = {
      selecionado: !!v,
      quantidade: v?.quantidade ?? 0,
    };
  }
  edicaoEpis.value = novo;
};

onMounted(carregar);
</script>

<template>
  <div class="pagina">
    <header class="cabecalho">
      <div>
        <p class="caminho">Admin <span class="separador">›</span> <span class="atual">Setores</span></p>
        <h1 class="titulo">Gerenciar <span class="destaque">Setores</span></h1>
        <p class="subtitulo">Crie setores e defina os EPIs disponíveis (com quantidade) para cada um.</p>
      </div>
    </header>

    <div v-if="mensagem" :class="['toast', 'toast-' + mensagem.tipo]">{{ mensagem.texto }}</div>

    <!-- criar setor -->
    <section class="cartao cartao-novo">
      <h2>Novo setor</h2>
      <form class="form-novo" @submit.prevent="criarSetor">
        <input v-model="novoSetor.nome" type="text" placeholder="Nome do setor (ex: Mecatronica)" />
        <button type="submit" class="btn-primario" :disabled="!novoSetor.nome.trim()">Adicionar</button>
      </form>
    </section>

    <!-- lista de setores -->
    <section class="cartao">
      <div v-if="carregando" class="vazio">Carregando…</div>
      <div v-else-if="setores.length === 0" class="vazio">Nenhum setor cadastrado ainda.</div>

      <div v-else class="lista-setores">
        <div v-for="s in setores" :key="s.id" class="setor-card">
          <!-- cabeçalho do setor -->
          <div class="setor-cabecalho">
            <div class="setor-info">
              <template v-if="editandoId === s.id">
                <input v-model="editandoNome" class="input-edit-nome" @keyup.enter="salvarNome(s)" />
              </template>
              <template v-else>
                <h3 class="setor-nome">{{ s.nome }}</h3>
                <span class="setor-tag">{{ totalEpisVinculados(s.id) }} EPI(s)</span>
              </template>
            </div>

            <div class="setor-acoes">
              <template v-if="editandoId === s.id">
                <button class="btn-secundario" @click="editandoId = null">Cancelar</button>
                <button class="btn-primario" @click="salvarNome(s)">Salvar nome</button>
              </template>
              <template v-else>
                <button class="btn-secundario" @click="iniciarEdicao(s)">Renomear</button>
                <button class="btn-perigo" @click="excluirSetor(s)">Excluir</button>
                <button class="btn-primario" @click="toggleAbrir(s.id)">
                  {{ setorAbertoId === s.id ? 'Fechar' : 'EPIs disponíveis' }}
                </button>
              </template>
            </div>
          </div>

          <!-- painel de EPIs do setor -->
          <div v-if="setorAbertoId === s.id" class="setor-painel">
            <p v-if="epis.length === 0" class="vazio">
              Nenhum EPI cadastrado no sistema. Cadastre EPIs primeiro.
            </p>
            <template v-else>
              <table class="tabela-epis">
                <thead>
                  <tr>
                    <th class="col-check"></th>
                    <th>EPI</th>
                    <th class="col-qtd">Quantidade</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="epi in epis" :key="epi.id">
                    <td>
                      <input
                        type="checkbox"
                        v-model="edicaoEpis[epi.id].selecionado"
                      />
                    </td>
                    <td>{{ epi.nome }}</td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        v-model="edicaoEpis[epi.id].quantidade"
                        :disabled="!edicaoEpis[epi.id].selecionado"
                        class="input-qtd"
                      />
                    </td>
                  </tr>
                </tbody>
              </table>

              <div class="painel-acoes">
                <button
                  class="btn-primario"
                  :disabled="salvandoId === s.id"
                  @click="salvarEpisDoSetor(s.id)"
                >
                  {{ salvandoId === s.id ? 'Salvando…' : 'Salvar EPIs' }}
                </button>
              </div>
            </template>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.pagina {
  background: #181511;
  min-height: 100vh;
  color: #fff;
  padding: 2rem 3rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.cabecalho { margin-bottom: 2rem; }
.caminho { color: #8b8680; font-size: 0.85rem; margin-bottom: 0.5rem; }
.caminho .separador { margin: 0 0.4rem; }
.atual { color: #fff; }
.titulo { font-size: 2.2rem; font-weight: 800; margin-bottom: 0.3rem; }
.destaque { color: #F49D25; }
.subtitulo { color: #8b8680; font-size: 0.9rem; }

.cartao {
  background: #221E18;
  border: 1px solid rgba(255,255,255,0.04);
  border-radius: 1rem;
  padding: 1.2rem 1.4rem;
  margin-bottom: 1.4rem;
}

.cartao-novo h2 {
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: 0.9rem;
  color: #fff;
}
.form-novo { display: flex; gap: 0.6rem; }
.form-novo input {
  flex: 1;
  background: #131110;
  border: 1px solid #2a241e;
  color: #fff;
  padding: 0.7rem 0.9rem;
  border-radius: 0.5rem;
  outline: none;
  font-size: 0.9rem;
}
.form-novo input:focus { border-color: #F49D25; }

.btn-primario {
  background: #F49D25;
  color: #1a1410;
  border: none;
  padding: 0.6rem 1.1rem;
  border-radius: 0.5rem;
  font-weight: 700;
  font-size: 0.85rem;
  cursor: pointer;
}
.btn-primario:hover { background: #e08c18; }
.btn-primario:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-secundario {
  background: #2a241e;
  color: #fff;
  border: 1px solid #3a332b;
  padding: 0.6rem 1rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.82rem;
  cursor: pointer;
}
.btn-secundario:hover { background: #342c25; }

.btn-perigo {
  background: rgba(248, 113, 113, 0.12);
  color: #f87171;
  border: 1px solid rgba(248, 113, 113, 0.3);
  padding: 0.6rem 1rem;
  border-radius: 0.5rem;
  font-weight: 600;
  font-size: 0.82rem;
  cursor: pointer;
}
.btn-perigo:hover { background: rgba(248, 113, 113, 0.22); }

.lista-setores { display: flex; flex-direction: column; gap: 0.9rem; }

.setor-card {
  background: #1c1814;
  border: 1px solid #2a241e;
  border-radius: 0.75rem;
  padding: 1rem 1.1rem;
}
.setor-cabecalho {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}
.setor-info { display: flex; align-items: center; gap: 0.7rem; }
.setor-nome { font-size: 1.05rem; font-weight: 700; color: #fff; }
.setor-tag {
  background: rgba(244, 157, 37, 0.12);
  color: #F49D25;
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.2rem 0.55rem;
  border-radius: 0.4rem;
}
.input-edit-nome {
  background: #131110;
  border: 1px solid #F49D25;
  color: #fff;
  padding: 0.5rem 0.7rem;
  border-radius: 0.4rem;
  font-size: 0.95rem;
  outline: none;
}

.setor-acoes { display: flex; gap: 0.5rem; flex-wrap: wrap; }

.setor-painel {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #2a241e;
}

.tabela-epis {
  width: 100%;
  border-collapse: collapse;
}
.tabela-epis th, .tabela-epis td {
  text-align: left;
  padding: 0.6rem 0.7rem;
  border-bottom: 1px solid #2a241e;
  font-size: 0.88rem;
}
.tabela-epis th {
  color: #8b8680;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}
.col-check { width: 40px; }
.col-qtd   { width: 140px; }

.input-qtd {
  background: #131110;
  border: 1px solid #2a241e;
  color: #fff;
  padding: 0.4rem 0.55rem;
  border-radius: 0.4rem;
  width: 100%;
  outline: none;
  font-size: 0.85rem;
}
.input-qtd:focus { border-color: #F49D25; }
.input-qtd:disabled { opacity: 0.4; }

.painel-acoes {
  display: flex;
  justify-content: flex-end;
  margin-top: 0.9rem;
}

.vazio { color: #8b8680; padding: 1rem; text-align: center; }

.toast {
  position: fixed;
  top: 1.5rem;
  right: 1.5rem;
  padding: 0.85rem 1.3rem;
  border-radius: 0.6rem;
  font-weight: 600;
  z-index: 999;
}
.toast-sucesso { background: rgba(34,197,94,0.15); border: 1px solid rgba(34,197,94,0.4); color: #4ade80; }
.toast-erro    { background: rgba(248,113,113,0.15); border: 1px solid rgba(248,113,113,0.4); color: #f87171; }
</style>
</content>
</invoke>