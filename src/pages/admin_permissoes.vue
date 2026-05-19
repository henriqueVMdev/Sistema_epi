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

const ROLES_PERMITIDAS = ['professor', 'aluno']; // admin/almoxarife veem tudo

const novo = reactive({
  epi_id: null,
  role: 'aluno',
  setor_id: null,
  limite: 1,
});

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
    supabase.from('epis').select('id, nome').order('nome'),
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

onMounted(carregar);
</script>

<template>
  <div class="pagina">
    <header class="cabecalho">
      <div>
        <p class="caminho">Admin <span class="separador">›</span> <span class="atual">Permissões de EPI</span></p>
        <h1 class="titulo">Permissões de <span class="destaque">EPIs</span></h1>
        <p class="subtitulo">
          Defina quais EPIs cada combinação de role + setor pode retirar e o limite por pedido.
          Acima do limite, o usuário precisa justificar e o almoxarife aprova.
        </p>
      </div>
    </header>

    <div v-if="mensagem" :class="['toast', 'toast-' + mensagem.tipo]">{{ mensagem.texto }}</div>

    <!-- Form pra nova permissão -->
    <section class="cartao">
      <h2 class="cartao-titulo">Nova permissão</h2>
      <div class="grade-form">
        <div class="campo">
          <label>EPI</label>
          <select v-model="novo.epi_id">
            <option :value="null" disabled>Selecione um EPI</option>
            <option v-for="e in epis" :key="e.id" :value="e.id">{{ e.nome }}</option>
          </select>
        </div>
        <div class="campo">
          <label>Role</label>
          <select v-model="novo.role">
            <option v-for="r in ROLES_PERMITIDAS" :key="r" :value="r">{{ r }}</option>
          </select>
        </div>
        <div class="campo">
          <label>Setor</label>
          <select v-model="novo.setor_id">
            <option :value="null" disabled>Selecione um setor</option>
            <option v-for="s in setores" :key="s.id" :value="s.id">{{ s.nome }}</option>
          </select>
        </div>
        <div class="campo">
          <label>Limite por pedido</label>
          <input v-model.number="novo.limite" type="number" min="0" />
        </div>
        <div class="campo-acao">
          <button class="btn-add" @click="adicionar">+ Adicionar</button>
        </div>
      </div>
    </section>

    <!-- Lista de permissões -->
    <section class="cartao">
      <h2 class="cartao-titulo">Permissões cadastradas ({{ permissoes.length }})</h2>
      <div v-if="carregando" class="vazio">Carregando…</div>
      <table v-else class="tabela">
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
              <button class="btn-salvar" :disabled="salvandoId === p.id" @click="salvarLimite(p)">
                {{ salvandoId === p.id ? '…' : 'Salvar' }}
              </button>
              <button class="btn-del" @click="remover(p)">Remover</button>
            </td>
          </tr>
          <tr v-if="permissoes.length === 0">
            <td colspan="5" class="vazio">Nenhuma permissão cadastrada.</td>
          </tr>
        </tbody>
      </table>
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
.subtitulo { color: #8b8680; font-size: 0.9rem; max-width: 70ch; }

.cartao {
  background: #221E18;
  border: 1px solid rgba(255,255,255,0.04);
  border-radius: 1rem;
  padding: 1.4rem 1.5rem;
  margin-bottom: 1.5rem;
}
.cartao-titulo {
  color: #fff;
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
.campo label { color: #c5bfb5; font-size: 0.82rem; }
.campo input, .campo select {
  background: #131110;
  border: 1px solid #2a241e;
  color: #fff;
  padding: 0.6rem 0.7rem;
  border-radius: 0.45rem;
  font-size: 0.88rem;
  outline: none;
}
.campo input:focus, .campo select:focus { border-color: #F49D25; }

.campo-acao { display: flex; }
.btn-add {
  background: #F49D25;
  color: #1a1410;
  border: none;
  padding: 0.65rem 1.2rem;
  border-radius: 0.5rem;
  font-weight: 700;
  cursor: pointer;
  white-space: nowrap;
}
.btn-add:hover { background: #e08c18; }

.tabela { width: 100%; border-collapse: collapse; }
.tabela th, .tabela td {
  text-align: left;
  padding: 0.85rem 0.9rem;
  border-bottom: 1px solid #2a241e;
  font-size: 0.9rem;
}
.tabela th {
  color: #8b8680;
  font-weight: 600;
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.role-tag {
  background: rgba(244, 157, 37, 0.15);
  color: #F49D25;
  padding: 0.2rem 0.55rem;
  border-radius: 0.3rem;
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.input-limite {
  width: 80px;
  background: #131110;
  border: 1px solid #2a241e;
  color: #fff;
  padding: 0.4rem 0.55rem;
  border-radius: 0.4rem;
  font-size: 0.88rem;
  outline: none;
}
.input-limite:focus { border-color: #F49D25; }

.acoes { display: flex; gap: 0.5rem; }
.btn-salvar {
  background: #F49D25;
  color: #1a1410;
  border: none;
  padding: 0.45rem 0.85rem;
  border-radius: 0.4rem;
  font-weight: 700;
  font-size: 0.82rem;
  cursor: pointer;
}
.btn-salvar:hover { background: #e08c18; }
.btn-salvar:disabled { opacity: 0.6; cursor: not-allowed; }

.btn-del {
  background: rgba(248,113,113,0.12);
  color: #f87171;
  border: 1px solid rgba(248,113,113,0.3);
  padding: 0.45rem 0.85rem;
  border-radius: 0.4rem;
  font-weight: 600;
  font-size: 0.82rem;
  cursor: pointer;
}
.btn-del:hover { background: rgba(248,113,113,0.2); }

.vazio { text-align: center; color: #8b8680; padding: 2rem; }

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
.toast-erro { background: rgba(248,113,113,0.15); border: 1px solid rgba(248,113,113,0.4); color: #f87171; }

@media (max-width: 900px) {
  .grade-form { grid-template-columns: 1fr 1fr; }
}
</style>
