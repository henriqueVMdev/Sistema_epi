<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { useSupabase } from '@/composables/useSupabase';

const { supabase } = useSupabase();
const permissoes = ref([]);
const epis = ref([]);
const setores = ref([]);
const carregando = ref(true);
const salvandoId = ref(null);
const mensagem = ref(null);

const ROLES_PERMITIDAS = ['professor', 'aluno'];

const novo = reactive({
  epi_id: null,
  role: 'aluno',
  setor_id: null,
  limite: 1,
});

const novoSetorNome = ref('');
const editandoSetorId = ref(null);
const editandoSetorNome = ref('');

const mostrarMensagem = (tipo, texto) => {
  mensagem.value = { tipo, texto };
  setTimeout(() => { mensagem.value = null; }, 3500);
};

const carregar = async () => {
  carregando.value = true;
  const [pr, ep, st] = await Promise.all([
    supabase
      .from('epi_permissoes')
      .select('id, role, limite, setor:setores(id, nome), epi:epis(id, nome)')
      .order('id', { ascending: false }),
    supabase.from('epis').select('id, nome, setor').order('nome'),
    supabase.from('setores').select('id, nome').order('nome'),
  ]);
  if (pr.error) console.error(pr.error);
  if (ep.error) console.error(ep.error);
  if (st.error) console.error(st.error);
  permissoes.value = pr.data || [];
  epis.value = ep.data || [];
  setores.value = st.data || [];
  carregando.value = false;
};

const adicionar = async () => {
  if (!novo.epi_id || !novo.setor_id || !novo.role) {
    mostrarMensagem('erro', 'Preencha EPI, setor e role.');
    return;
  }
  const { error } = await supabase.from('epi_permissoes').insert({
    epi_id: novo.epi_id,
    role: novo.role,
    setor_id: novo.setor_id,
    limite: Number(novo.limite) || 0,
  });
  if (error) {
    console.error(error);
    if (error.code === '23505') {
      mostrarMensagem('erro', 'Já existe uma permissão para esse EPI + role + setor.');
    } else {
      mostrarMensagem('erro', 'Erro ao adicionar permissão.');
    }
    return;
  }
  mostrarMensagem('sucesso', 'Permissão criada.');
  Object.assign(novo, { epi_id: null, role: 'aluno', setor_id: null, limite: 1 });
  carregar();
};

const salvarLimite = async (p) => {
  salvandoId.value = p.id;
  const { error } = await supabase
    .from('epi_permissoes')
    .update({ limite: Number(p.limite) || 0 })
    .eq('id', p.id);
  salvandoId.value = null;
  if (error) {
    console.error(error);
    mostrarMensagem('erro', 'Erro ao salvar limite.');
    return;
  }
  mostrarMensagem('sucesso', 'Limite atualizado.');
};

const remover = async (p) => {
  if (!confirm(`Remover permissão de ${p.role} do setor ${p.setor?.nome} para o EPI ${p.epi?.nome}?`)) return;
  const { error } = await supabase.from('epi_permissoes').delete().eq('id', p.id);
  if (error) {
    console.error(error);
    mostrarMensagem('erro', 'Erro ao remover.');
    return;
  }
  mostrarMensagem('sucesso', 'Permissão removida.');
  carregar();
};

const epiCountPorSetor = (setorNome) => {
  const alvo = String(setorNome || '').trim().toLowerCase();
  if (!alvo) return 0;
  return epis.value.filter(e =>
    String(e.setor || '')
      .split(',')
      .map(s => s.trim().toLowerCase())
      .includes(alvo)
  ).length;
};

const criarSetor = async () => {
  if (!novoSetorNome.value.trim()) return;
  const { error } = await supabase.from('setores').insert({ nome: novoSetorNome.value.trim() });
  if (error) {
    console.error(error);
    return mostrarMensagem('erro', 'Erro ao criar setor: ' + error.message);
  }
  novoSetorNome.value = '';
  mostrarMensagem('sucesso', 'Setor criado.');
  carregar();
};

const iniciarEdicaoSetor = (s) => {
  editandoSetorId.value = s.id;
  editandoSetorNome.value = s.nome;
};

const salvarSetor = async (s) => {
  if (!editandoSetorNome.value.trim()) return;
  const { error } = await supabase
    .from('setores')
    .update({ nome: editandoSetorNome.value.trim() })
    .eq('id', s.id);
  if (error) {
    console.error(error);
    return mostrarMensagem('erro', 'Erro ao salvar setor.');
  }
  editandoSetorId.value = null;
  mostrarMensagem('sucesso', 'Setor atualizado.');
  carregar();
};

const removerSetor = async (s) => {
  if (!confirm(`Excluir o setor "${s.nome}"? Isso pode quebrar permissões existentes.`)) return;
  const { error } = await supabase.from('setores').delete().eq('id', s.id);
  if (error) {
    console.error(error);
    return mostrarMensagem('erro', 'Erro ao remover: ' + error.message);
  }
  mostrarMensagem('sucesso', 'Setor removido.');
  carregar();
};

onMounted(carregar);
</script>

<template>
  <div class="pagina">
    <header class="cabecalho">
      <div>
        <p class="caminho">Administração <span class="separador">›</span> <span class="atual">Permissões de EPI</span></p>
        <h1 class="titulo">Permissões de <span class="destaque">EPIs</span></h1>
        <p class="subtitulo">
          Defina quais EPIs cada combinação de role + setor pode retirar e o limite por pedido.
          Acima do limite, o usuário precisa justificar e o almoxarife aprova.
        </p>
      </div>
    </header>

    <div v-if="mensagem" :class="['toast', 'toast-' + mensagem.tipo]">{{ mensagem.texto }}</div>

    <section class="cartao">
      <h2 class="cartao-titulo">Setores ({{ setores.length }})</h2>

      <form class="form-novo-setor" @submit.prevent="criarSetor">
        <input v-model="novoSetorNome" type="text" placeholder="Nome do novo setor (ex: Mecatronica)" />
        <button type="submit" class="btn-add" :disabled="!novoSetorNome.trim()">+ Adicionar setor</button>
      </form>

      <div v-if="setores.length === 0" class="vazio">Nenhum setor cadastrado.</div>
      <ul v-else class="lista-setores">
        <li v-for="s in setores" :key="s.id" class="item-setor">
          <template v-if="editandoSetorId === s.id">
            <input
              v-model="editandoSetorNome"
              class="input-edit"
              @keyup.enter="salvarSetor(s)"
            />
            <div class="setor-acoes">
              <button type="button" class="btn-salvar" @click="salvarSetor(s)">Salvar</button>
              <button type="button" class="btn-del" @click="editandoSetorId = null">Cancelar</button>
            </div>
          </template>
          <template v-else>
            <div class="setor-info">
              <strong>{{ s.nome }}</strong>
              <span class="setor-tag">{{ epiCountPorSetor(s.nome) }} EPI(s) vinculado(s)</span>
            </div>
            <div class="setor-acoes">
              <button type="button" class="btn-salvar" @click="iniciarEdicaoSetor(s)">Renomear</button>
              <button type="button" class="btn-del" @click="removerSetor(s)">Excluir</button>
            </div>
          </template>
        </li>
      </ul>

      <p class="dica">
        Pra vincular um EPI a um setor com quantidade-limite por role, use o formulário <strong>"Nova permissão"</strong> abaixo.
      </p>
    </section>

    <section class="cartao">
      <h2 class="cartao-titulo">Nova permissão</h2>
      <div class="grade-form">
        <div class="campo">
          <label for="perm-epi">EPI</label>
          <select id="perm-epi" v-model="novo.epi_id">
            <option :value="null" disabled>Selecione um EPI</option>
            <option v-for="e in epis" :key="e.id" :value="e.id">{{ e.nome }}</option>
          </select>
        </div>
        <div class="campo">
          <label for="perm-role">Role</label>
          <select id="perm-role" v-model="novo.role">
            <option v-for="r in ROLES_PERMITIDAS" :key="r" :value="r">{{ r }}</option>
          </select>
        </div>
        <div class="campo">
          <label for="perm-setor">Setor</label>
          <select id="perm-setor" v-model="novo.setor_id">
            <option :value="null" disabled>Selecione um setor</option>
            <option v-for="s in setores" :key="s.id" :value="s.id">{{ s.nome }}</option>
          </select>
        </div>
        <div class="campo">
          <label for="perm-limite">Limite por pedido</label>
          <input id="perm-limite" v-model.number="novo.limite" type="number" min="0" />
        </div>
        <div class="campo-acao">
          <button type="button" class="btn-add" @click="adicionar">+ Adicionar</button>
        </div>
      </div>
    </section>

    <section class="cartao">
      <h2 class="cartao-titulo">Permissões cadastradas ({{ permissoes.length }})</h2>
      <div v-if="carregando" class="vazio">Carregando…</div>
      <div v-else class="tabela-rolagem">
        <table class="tabela">
        <thead>
          <tr>
            <th>EPI</th>
            <th>Role</th>
            <th>Setor</th>
            <th>Limite</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="p in permissoes" :key="p.id">
            <td>{{ p.epi?.nome || '—' }}</td>
            <td><span class="role-tag">{{ p.role }}</span></td>
            <td>{{ p.setor?.nome || '—' }}</td>
            <td>
              <input class="input-limite" v-model.number="p.limite" type="number" min="0" />
            </td>
            <td class="acoes">
              <button type="button" class="btn-salvar" :disabled="salvandoId === p.id" @click="salvarLimite(p)">
                {{ salvandoId === p.id ? '…' : 'Salvar' }}
              </button>
              <button type="button" class="btn-del" @click="remover(p)">Remover</button>
            </td>
          </tr>
          <tr v-if="permissoes.length === 0">
            <td colspan="5" class="vazio">Nenhuma permissão cadastrada.</td>
          </tr>
        </tbody>
      </table>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* tabela larga não pode empurrar a página no celular */
.tabela-rolagem { overflow-x: auto; }
.tabela-rolagem table { min-width: 640px; }

.pagina {
  background: var(--superficie-alta);
  min-height: 100vh;
  color: var(--texto-forte);
  padding: 2rem 3rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.cabecalho { margin-bottom: 2rem; }
.caminho { color: var(--texto-suave); font-size: 0.85rem; margin-bottom: 0.5rem; }
.caminho .separador { margin: 0 0.4rem; }
.atual { color: var(--texto-forte); }
.titulo { font-size: 2.2rem; font-weight: 800; margin-bottom: 0.3rem; }
.destaque { color: var(--marca); }
.subtitulo { color: var(--texto-suave); font-size: 0.9rem; max-width: 70ch; }

.cartao {
  background: var(--superficie-elevada);
  border: 1px solid color-mix(in srgb, var(--texto-forte) 4%, transparent);
  border-radius: 1rem;
  padding: 1.4rem 1.5rem;
  margin-bottom: 1.5rem;
}
.cartao-titulo {
  color: var(--texto-forte);
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: 1.2rem;
}

.grade-form {
  display: grid;
  grid-template-columns: 2fr 1fr 1.5fr 1fr auto;
  gap: 1rem;
  align-items: end;
}
.campo { display: flex; flex-direction: column; gap: 0.4rem; }
.campo label { color: var(--texto); font-size: 0.82rem; }
.campo input, .campo select {
  background: var(--superficie);
  border: 1px solid var(--borda);
  color: var(--texto-forte);
  padding: 0.6rem 0.7rem;
  border-radius: 0.45rem;
  font-size: 0.88rem;
  outline: none;
}
.campo input:focus, .campo select:focus { border-color: var(--marca); }

.campo-acao { display: flex; }
.btn-add {
  background: var(--marca);
  color: var(--marca-texto);
  border: none;
  padding: 0.65rem 1.2rem;
  border-radius: 0.5rem;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
}
.btn-add:hover { background: var(--marca-escura); }

.tabela { width: 100%; border-collapse: collapse; }
.tabela th, .tabela td {
  text-align: left;
  padding: 0.85rem 0.9rem;
  border-bottom: 1px solid var(--borda);
  font-size: 0.9rem;
}
.tabela th {
  color: var(--texto-suave);
  font-weight: 600;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.role-tag {
  background: color-mix(in srgb, var(--marca) 15%, transparent);
  color: var(--marca);
  padding: 0.2rem 0.55rem;
  border-radius: 0.3rem;
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.input-limite {
  width: 80px;
  background: var(--superficie);
  border: 1px solid var(--borda);
  color: var(--texto-forte);
  padding: 0.4rem 0.55rem;
  border-radius: 0.4rem;
  font-size: 0.88rem;
  outline: none;
}
.input-limite:focus { border-color: var(--marca); }

.acoes { display: flex; gap: 0.5rem; }
.btn-salvar {
  background: var(--marca);
  color: var(--marca-texto);
  border: none;
  padding: 0.45rem 0.85rem;
  border-radius: 0.4rem;
  font-weight: 700;
  font-size: 0.82rem;
  cursor: pointer;
}
.btn-salvar:hover { background: var(--marca-escura); }
.btn-salvar:disabled { opacity: 0.6; cursor: not-allowed; }

.btn-del {
  background: color-mix(in srgb, var(--perigo) 12%, transparent);
  color: var(--perigo);
  border: 1px solid color-mix(in srgb, var(--perigo) 30%, transparent);
  padding: 0.45rem 0.85rem;
  border-radius: 0.4rem;
  font-weight: 600;
  font-size: 0.82rem;
  cursor: pointer;
}
.btn-del:hover { background: color-mix(in srgb, var(--perigo) 20%, transparent); }

.vazio { text-align: center; color: var(--texto-suave); padding: 2rem; }

.toast {
  position: fixed;
  top: 1.5rem;
  right: 1.5rem;
  padding: 0.85rem 1.3rem;
  border-radius: 0.6rem;
  font-weight: 600;
  z-index: 999;
}
.toast-sucesso { background: color-mix(in srgb, var(--ok) 15%, transparent); border: 1px solid color-mix(in srgb, var(--ok) 40%, transparent); color: var(--ok); }
.toast-erro { background: color-mix(in srgb, var(--perigo) 15%, transparent); border: 1px solid color-mix(in srgb, var(--perigo) 40%, transparent); color: var(--perigo); }

@media (max-width: 900px) {
  .grade-form { grid-template-columns: 1fr 1fr; }
}

.form-novo-setor {
  display: flex;
  gap: 0.6rem;
  margin-bottom: 1.2rem;
}
.form-novo-setor input {
  flex: 1;
  background: var(--superficie);
  border: 1px solid var(--borda);
  color: var(--texto-forte);
  padding: 0.6rem 0.8rem;
  border-radius: 0.45rem;
  font-size: 0.88rem;
  outline: none;
}
.form-novo-setor input:focus { border-color: var(--marca); }

.lista-setores {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
}
.item-setor {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.8rem;
  background: var(--superficie-alta);
  border: 1px solid var(--borda);
  border-radius: 0.55rem;
  padding: 0.7rem 0.9rem;
}
.setor-info {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  color: var(--texto-forte);
  font-size: 0.92rem;
}
.setor-tag {
  background: color-mix(in srgb, var(--marca) 12%, transparent);
  color: var(--marca);
  font-size: 0.72rem;
  font-weight: 700;
  padding: 0.18rem 0.5rem;
  border-radius: 0.35rem;
}
.setor-acoes { display: flex; gap: 0.45rem; }

.input-edit {
  flex: 1;
  background: var(--superficie);
  border: 1px solid var(--marca);
  color: var(--texto-forte);
  padding: 0.45rem 0.6rem;
  border-radius: 0.4rem;
  font-size: 0.9rem;
  outline: none;
}

.dica {
  color: var(--texto-suave);
  font-size: 0.82rem;
  margin-top: 1rem;
}
.dica strong { color: var(--marca); }

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
</style>
