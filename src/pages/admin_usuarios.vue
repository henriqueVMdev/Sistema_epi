<script setup>
import { ref, onMounted } from 'vue';
import { useSupabase } from '@/composables/useSupabase';

const { supabase } = useSupabase();
const usuarios = ref([]);
const setores = ref([]);
const carregando = ref(true);
const mensagem = ref(null);
const salvandoId = ref(null);
const excluindoId = ref(null);

const ROLES = ['admin', 'almoxarife', 'professor', 'aluno'];

const mostrarMensagem = (tipo, texto) => {
  mensagem.value = { tipo, texto };
  setTimeout(() => { mensagem.value = null; }, 3500);
};

const carregar = async () => {
  carregando.value = true;
  const [{ data: us, error: eU }, { data: st, error: eS }, { data: fs }] = await Promise.all([
    supabase
      .from('funcionarios')
      .select('id, nome, email, cpf, role, setor_id, criado_em, setor:setores!funcionarios_setor_id_fkey(id, nome)')
      .order('nome'),
    supabase.from('setores').select('id, nome').order('nome'),
    supabase.from('funcionario_setores').select('funcionario_id, setor_id'),
  ]);
  if (eU) console.error(eU);
  if (eS) console.error(eS);

  // anexa lista de setor_ids extras (de junction) em cada professor
  const extras = new Map();
  for (const r of (fs || [])) {
    if (!extras.has(r.funcionario_id)) extras.set(r.funcionario_id, []);
    extras.get(r.funcionario_id).push(r.setor_id);
  }
  usuarios.value = (us || []).map(u => ({
    ...u,
    setores_extra: extras.get(u.id) || [],
    setorMenuAberto: false,
  }));
  setores.value = st || [];
  carregando.value = false;
};

const toggleSetorExtra = (u, setorId) => {
  const idx = u.setores_extra.indexOf(setorId);
  if (idx >= 0) u.setores_extra.splice(idx, 1);
  else u.setores_extra.push(setorId);
};

const salvar = async (u) => {
  salvandoId.value = u.id;
  // 1) atualiza role + setor principal
  const { error } = await supabase
    .from('funcionarios')
    .update({ role: u.role, setor_id: u.setor_id })
    .eq('id', u.id);
  if (error) {
    salvandoId.value = null;
    console.error(error);
    mostrarMensagem('erro', 'Erro ao salvar alterações.');
    return;
  }
  // 2) atualiza setores extras (apenas para professor)
  await supabase.from('funcionario_setores').delete().eq('funcionario_id', u.id);
  if (u.role === 'professor' && u.setores_extra.length > 0) {
    const rows = u.setores_extra
      .filter(id => id !== u.setor_id) // não duplicar o principal
      .map(setor_id => ({ funcionario_id: u.id, setor_id }));
    if (rows.length) await supabase.from('funcionario_setores').insert(rows);
  }
  salvandoId.value = null;
  mostrarMensagem('sucesso', `${u.nome} atualizado.`);
};

const excluir = async (u) => {
  if (!confirm(`Excluir ${u.nome}? Isso remove o cadastro da tabela funcionarios.`)) return;
  excluindoId.value = u.id;
  const { error } = await supabase.from('funcionarios').delete().eq('id', u.id);
  excluindoId.value = null;
  if (error) {
    console.error(error);
    mostrarMensagem('erro', 'Erro ao excluir: ' + error.message);
    return;
  }
  mostrarMensagem('sucesso', `${u.nome} excluído.`);
  carregar();
};

onMounted(carregar);
</script>

<template>
  <div class="pagina">
    <header class="cabecalho">
      <div>
        <p class="caminho">Administração <span class="separador">›</span> <span class="atual">Gerenciar Usuários</span></p>
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
              <div class="setor-cell">
                <select v-model="u.setor_id">
                  <option :value="null">—</option>
                  <option v-for="s in setores" :key="s.id" :value="s.id">{{ s.nome }}</option>
                </select>
                <div v-if="u.role === 'professor'" class="multi-setor">
                  <button type="button" class="btn-mais-setor" @click="u.setorMenuAberto = !u.setorMenuAberto">
                    + {{ u.setores_extra.filter(id => id !== u.setor_id).length }} setor(es)
                  </button>
                  <div v-if="u.setorMenuAberto" class="multi-menu">
                    <label v-for="s in setores" :key="s.id" class="multi-opcao">
                      <input
                        type="checkbox"
                        :checked="u.setores_extra.includes(s.id)"
                        :disabled="s.id === u.setor_id"
                        @change="toggleSetorExtra(u, s.id)"
                      />
                      <span>{{ s.nome }}</span>
                    </label>
                  </div>
                </div>
              </div>
            </td>
            <td class="acoes">
              <button class="btn-salvar" :disabled="salvandoId === u.id" @click="salvar(u)">
                {{ salvandoId === u.id ? 'Salvando…' : 'Salvar' }}
              </button>
              <button class="btn-excluir" :disabled="excluindoId === u.id" @click="excluir(u)">
                {{ excluindoId === u.id ? 'Excluindo…' : 'Excluir' }}
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

.acoes { display: flex; gap: 0.45rem; }
.btn-excluir {
  background: rgba(248, 113, 113, 0.12);
  color: #f87171;
  border: 1px solid rgba(248, 113, 113, 0.3);
  padding: 0.5rem 0.85rem;
  border-radius: 0.45rem;
  font-weight: 600;
  font-size: 0.82rem;
  cursor: pointer;
}
.btn-excluir:hover { background: rgba(248, 113, 113, 0.22); }
.btn-excluir:disabled { opacity: 0.6; cursor: not-allowed; }

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

.setor-cell { display: flex; align-items: center; gap: 0.4rem; position: relative; }
.btn-mais-setor {
  background: rgba(244,157,37,0.12);
  color: #F49D25;
  border: 1px solid rgba(244,157,37,0.3);
  padding: 0.35rem 0.6rem;
  border-radius: 0.4rem;
  font-size: 0.75rem;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}
.btn-mais-setor:hover { background: rgba(244,157,37,0.22); }
.multi-menu {
  position: absolute;
  top: calc(100% + 0.3rem);
  right: 0;
  background: #1c1814;
  border: 1px solid #2a241e;
  border-radius: 0.45rem;
  padding: 0.4rem;
  min-width: 180px;
  z-index: 100;
  box-shadow: 0 8px 20px rgba(0,0,0,0.4);
  max-height: 220px;
  overflow-y: auto;
}
.multi-opcao {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.5rem;
  border-radius: 0.3rem;
  cursor: pointer;
  color: #ebe8e4;
  font-size: 0.82rem;
}
.multi-opcao:hover { background: rgba(244,157,37,0.08); }
.multi-opcao input[type="checkbox"] {
  appearance: none;
  width: 0.95rem;
  height: 0.95rem;
  border: 1.5px solid #5c554d;
  border-radius: 0.2rem;
  cursor: pointer;
  margin: 0;
}
.multi-opcao input[type="checkbox"]:checked {
  background: #F49D25;
  border-color: #F49D25;
}
.multi-opcao input[type="checkbox"]:disabled { opacity: 0.4; cursor: not-allowed; }
</style>
