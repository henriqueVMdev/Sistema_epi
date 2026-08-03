<template>
  <div class="shell">
    <aside class="sidebar">
      <header class="sidebar-header">
        <img src="@/assets/Logo_branco.svg" alt="OmniSeg" class="logo-img" />
        <div class="logo-texto">
          <span class="logo-nome">Omni<span class="logo-destaque">Seg</span></span>
          <span class="logo-sub">{{ rotuloPainel }}</span>
        </div>
      </header>

      <nav class="menu">
        <div v-for="grupo in gruposVisiveis" :key="grupo.titulo" class="grupo">
          <p class="grupo-titulo">{{ grupo.titulo }}</p>
          <RouterLink
            v-for="item in grupo.itens"
            :key="item.to"
            :to="item.to"
            class="menu-item"
            active-class="active"
          >
            <i :class="item.icone"></i>
            <span>{{ item.label }}</span>
          </RouterLink>
        </div>
      </nav>

      <div class="base">
        <RouterLink v-if="perfil" to="/perfil" class="perfil-card" active-class="perfil-card-ativo">
          <div class="perfil-avatar">
            <img loading="lazy" decoding="async" v-if="perfil.avatar_url" :src="perfil.avatar_url" :alt="perfil.nome" />
            <span v-else class="perfil-iniciais">{{ iniciais(perfil.nome) }}</span>
          </div>
          <div class="perfil-texto">
            <span class="perfil-nome">{{ perfil.nome }}</span>
            <span class="perfil-role">{{ perfil.role }}</span>
          </div>
        </RouterLink>

        <button type="button" @click="sair" class="botao-sair">
          <i class="fas fa-sign-out-alt"></i>
          <span>Sair</span>
        </button>
      </div>
    </aside>

    <main class="conteudo">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { useSupabase } from '@/composables/useSupabase'
import { useRouter, RouterLink, RouterView } from 'vue-router'
import { computed } from 'vue'

const { supabase, perfil } = useSupabase()

const GRUPOS = [
  {
    titulo: 'Estoque & EPIs',
    itens: [
      { to: '/estoque',      label: 'Estoque',         icone: 'fas fa-boxes',        roles: ['admin','almoxarife','professor','aluno'] },
      { to: '/cadastro_epi', label: 'Cadastro de EPI', icone: 'fas fa-plus-circle',  roles: ['admin','almoxarife'] },
    ],
  },
  {
    titulo: 'Operações',
    itens: [
      { to: '/retirada_epi', label: 'Retirada de EPIs', icone: 'fas fa-hand-holding',     roles: ['admin','almoxarife','professor','aluno'] },
      { to: '/meus_epis',    label: 'Meus EPIs',        icone: 'fas fa-hard-hat',         roles: ['admin','almoxarife','professor','aluno'] },
      { to: '/aprovacoes',   label: 'Aprovações',       icone: 'fas fa-clipboard-check',  roles: ['admin','almoxarife'] },
    ],
  },
  {
    titulo: 'Análise',
    itens: [
      { to: '/dashboard', label: 'Dashboard', icone: 'fas fa-chart-line', roles: ['admin','almoxarife'] },
    ],
  },
  {
    titulo: 'Administração',
    itens: [
      { to: '/admin/usuarios',   label: 'Gerenciar Usuários', icone: 'fas fa-user-shield', roles: ['admin'] },
      { to: '/admin/permissoes', label: 'Permissões de EPI',  icone: 'fas fa-lock',        roles: ['admin'] },
    ],
  },
]

const gruposVisiveis = computed(() => {
  const role = perfil.value?.role
  if (!role) return []
  return GRUPOS
    .map(g => ({ ...g, itens: g.itens.filter(i => i.roles.includes(role)) }))
    .filter(g => g.itens.length > 0)
})

const rotuloPainel = computed(() => {
  const r = perfil.value?.role
  if (r === 'admin') return 'Admin Panel'
  if (r === 'almoxarife') return 'Almoxarifado'
  if (r === 'professor') return 'Professor'
  if (r === 'aluno') return 'Aluno'
  return 'Sistema EPI'
})

const iniciais = (nome) =>
  (nome || '?').trim().split(/\s+/).slice(0, 2).map(p => p[0]?.toUpperCase()).join('')

const router = useRouter()

async function sair() {
  try {
    await supabase.auth.signOut()
    router.push('/login')
  } catch (err) {
    console.error('Erro ao fazer logout:', err)
  }
}
</script>

<style scoped>
* { margin: 0; padding: 0; box-sizing: border-box; }

.shell {
  display: grid;
  grid-template-columns: 260px 1fr;
  min-height: 100vh;
  width: 100%;
}

.sidebar {
  background: var(--superficie-elevada);
  border-right: 1px solid color-mix(in srgb, var(--texto-forte) 4%, transparent);
  padding: 1.5rem 1rem 1.2rem;
  display: flex;
  flex-direction: column;
  position: sticky;
  top: 0;
  height: 100vh;
  z-index: 1000;
  overflow-y: auto;
  align-self: start;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.sidebar-header {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.4rem 0.5rem 1.4rem;
  border-bottom: 1px solid color-mix(in srgb, var(--texto-forte) 4%, transparent);
  margin-bottom: 1.2rem;
}
.logo-img {
  width: 2.4rem;
  height: 2.4rem;
  object-fit: contain;
  flex-shrink: 0;
}
.logo-texto { display: flex; flex-direction: column; line-height: 1.2; }
.logo-nome { color: var(--texto-forte); font-size: 1.05rem; font-weight: 800; letter-spacing: -0.01em; }
.logo-destaque { color: var(--marca); }
.logo-sub { color: var(--texto-suave); font-size: 0.72rem; font-weight: 500; margin-top: 0.1rem; }

.menu {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
  overflow-y: auto;
}
.grupo { display: flex; flex-direction: column; gap: 0.25rem; }
.grupo-titulo {
  color: var(--texto-fraco);
  font-size: 0.65rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  padding: 0 0.6rem 0.4rem;
}

.menu-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.65rem 0.8rem;
  color: var(--texto);
  text-decoration: none;
  border-radius: 0.5rem;
  font-size: 0.88rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.menu-item:hover { background: color-mix(in srgb, var(--texto-forte) 4%, transparent); color: var(--texto-forte); }
.menu-item i { font-size: 0.95rem; width: 1.1rem; text-align: center; color: var(--texto-suave); transition: color 0.15s; }
.menu-item:hover i { color: var(--marca); }

.menu-item.active {
  background: color-mix(in srgb, var(--marca) 12%, transparent);
  color: var(--marca);
  font-weight: 600;
}
.menu-item.active i { color: var(--marca); }

.base {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  padding-top: 1rem;
  border-top: 1px solid color-mix(in srgb, var(--texto-forte) 4%, transparent);
  margin-top: 1rem;
}

.perfil-card {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  text-decoration: none;
  background: color-mix(in srgb, var(--texto-forte) 3%, transparent);
  border: 1px solid color-mix(in srgb, var(--texto-forte) 5%, transparent);
  border-radius: 0.6rem;
  padding: 0.6rem 0.7rem;
  transition: background 0.2s, border-color 0.2s;
}
.perfil-card:hover { background: color-mix(in srgb, var(--marca) 8%, transparent); border-color: color-mix(in srgb, var(--marca) 30%, transparent); }
.perfil-card-ativo { border-color: var(--marca); background: color-mix(in srgb, var(--marca) 12%, transparent); }

.perfil-avatar {
  flex: 0 0 36px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  background: var(--borda-forte);
  display: flex;
  align-items: center;
  justify-content: center;
}
.perfil-avatar img { width: 100%; height: 100%; object-fit: cover; }
.perfil-iniciais { color: var(--marca); font-weight: 800; font-size: 0.85rem; }

.perfil-texto { flex: 1; min-width: 0; display: flex; flex-direction: column; line-height: 1.2; }
.perfil-nome {
  color: var(--texto-forte);
  font-size: 0.82rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.perfil-role {
  color: var(--texto-suave);
  font-size: 0.68rem;
  font-weight: 500;
  text-transform: capitalize;
  margin-top: 0.1rem;
}

.botao-sair {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.55rem;
  background: transparent;
  color: var(--texto-suave);
  border: 1px solid color-mix(in srgb, var(--texto-forte) 5%, transparent);
  padding: 0.6rem 0.8rem;
  border-radius: 0.5rem;
  cursor: pointer;
  font-size: 0.82rem;
  font-weight: 600;
  font-family: inherit;
  transition: background 0.2s, color 0.2s, border-color 0.2s;
  width: 100%;
}
.botao-sair:hover {
  background: color-mix(in srgb, var(--perigo) 8%, transparent);
  color: var(--perigo);
  border-color: color-mix(in srgb, var(--perigo) 30%, transparent);
}
.botao-sair i { font-size: 0.85rem; }

.conteudo {
  min-width: 0;
  min-height: 100vh;
  overflow-x: hidden;
}

@media (max-width: 768px) {
  .shell { grid-template-columns: 220px 1fr; }
  .menu-item { padding: 0.55rem 0.7rem; font-size: 0.82rem; }
}
@media (max-width: 480px) {
  .shell { grid-template-columns: 1fr; }
  .sidebar { position: static; height: auto; width: 100%; }
}
</style>
