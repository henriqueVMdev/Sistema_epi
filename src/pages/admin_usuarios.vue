<script setup>
import { ref, onMounted } from 'vue';
import { useSupabase } from '@/composables/useSupabase';

const { supabase } = useSupabase();
const usuarios = ref([]);
const setores = ref([]);
const carregando = ref(true);
const mensagem = ref(null);
const salvandoId = ref(null);

const ROLES = ['admin', 'almoxarife', 'professor', 'aluno'];

const mostrarMensagem = (tipo, texto) => {
  mensagem.value = { tipo, texto };
  setTimeout(() => { mensagem.value = null; }, 3500);
};

const carregar = async () => {
  carregando.value = true;
  const [{ data: us, error: eU }, { data: st, error: eS }] = await Promise.all([
    supabase
      .from('funcionarios')
      .select('id, nome, email, cpf, role, setor_id, criado_em, setor:setores(id, nome)')
      .order('nome'),
    supabase.from('setores').select('id, nome').order('nome'),
  ]);
  if (eU) console.error(eU);
  if (eS) console.error(eS);
  usuarios.value = us || [];
  setores.value = st || [];
  carregando.value = false;
};

const salvar = async (u) => {
  salvandoId.value = u.id;
  const { error } = await supabase
    .from('funcionarios')
    .update({ role: u.role, setor_id: u.setor_id })
    .eq('id', u.id);
  salvandoId.value = null;
  if (error) {
    console.error(error);
    mostrarMensagem('erro', 'Erro ao salvar alterações.');
    return;
  }
  mostrarMensagem('sucesso', `${u.nome} atualizado.`);
};

onMounted(carregar);
</script>

<template>
  <div class="pagina">
    <header class="cabecalho">
      <div>
        <p class="caminho">Admin <span class="separador">›</span> <span class="atual">Usuários</span></p>
        <h1 class="titulo">Gerenciar <span class="destaque">Usuários</span></h1>
        <p class="subtitulo">Atribua roles e setores. Total: {{ usuarios.length }}.</p>
      </div>
    </header>

    <div v-if="mensagem" :class="['toast', 'toast-' + mensagem.tipo]">{{ mensagem.texto }}</div>

    <section class="cartao">
      <div v-if="carregando" class="vazio">Carregando…</div>
      <table v-else class="tabela">
        <thead>
          <tr>
            <th>Nome</th>
            <th>Email</th>
            <th>CPF</th>
            <th>Role</th>
            <th>Setor</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="u in usuarios" :key="u.id">
            <td>{{ u.nome }}</td>
            <td class="muted">{{ u.email }}</td>
            <td class="muted">{{ u.cpf }}</td>
            <td>
              <select v-model="u.role">
                <option v-for="r in ROLES" :key="r" :value="r">{{ r }}</option>
              </select>
            </td>
            <td>
              <select v-model="u.setor_id">
                <option :value="null">—</option>
                <option v-for="s in setores" :key="s.id" :value="s.id">{{ s.nome }}</option>
              </select>
            </td>
            <td>
              <button class="btn-salvar" :disabled="salvandoId === u.id" @click="salvar(u)">
                {{ salvandoId === u.id ? 'Salvando…' : 'Salvar' }}
              </button>
            </td>
          </tr>
          <tr v-if="usuarios.length === 0">
            <td colspan="6" class="vazio">Nenhum usuário cadastrado.</td>
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
.subtitulo { color: #8b8680; font-size: 0.9rem; }

.cartao {
  background: #221E18;
  border: 1px solid rgba(255,255,255,0.04);
  border-radius: 1rem;
  padding: 1.2rem;
}

.tabela {
  width: 100%;
  border-collapse: collapse;
}
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
.muted { color: #8b8680; }

.tabela select {
  background: #131110;
  border: 1px solid #2a241e;
  color: #fff;
  padding: 0.45rem 0.6rem;
  border-radius: 0.4rem;
  font-size: 0.85rem;
  outline: none;
}
.tabela select:focus { border-color: #F49D25; }

.btn-salvar {
  background: #F49D25;
  color: #1a1410;
  border: none;
  padding: 0.5rem 0.9rem;
  border-radius: 0.45rem;
  font-weight: 600;
  font-size: 0.82rem;
  cursor: pointer;
}
.btn-salvar:hover { background: #e08c18; }
.btn-salvar:disabled { opacity: 0.6; cursor: not-allowed; }

.vazio {
  text-align: center;
  color: #8b8680;
  padding: 2rem;
}

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
</style>
