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
            <img v-if="perfil.avatar_url" :src="perfil.avatar_url" :alt="perfil.nome" />
            <span v-else class="perfil-iniciais">{{ iniciais(perfil.nome) }}</span>
          </div>
          <div class="perfil-texto">
            <span class="perfil-nome">{{ perfil.nome }}</span>
            <span class="perfil-role">{{ perfil.role }}</span>
          </div>
        </RouterLink>

        <button @click="sair" class="botao-sair">
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
  background: #221E18;
  border-right: 1px solid rgba(255,255,255,0.04);
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
  border-bottom: 1px solid rgba(255,255,255,0.04);
  margin-bottom: 1.2rem;
}
.logo-img {
  width: 2.4rem;
  height: 2.4rem;
  object-fit: contain;
  flex-shrink: 0;
}
.logo-texto { display: flex; flex-direction: column; line-height: 1.2; }
.logo-nome { color: #fff; font-size: 1.05rem; font-weight: 800; letter-spacing: -0.01em; }
.logo-destaque { color: #F49D25; }
.logo-sub { color: #8b8680; font-size: 0.72rem; font-weight: 500; margin-top: 0.1rem; }

.menu {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  gap: 1.1rem;
  overflow-y: auto;
}
.grupo { display: flex; flex-direction: column; gap: 0.25rem; }
.grupo-titulo {
  color: #6b6359;
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
  color: #c5bfb5;
  text-decoration: none;
  border-radius: 0.5rem;
  font-size: 0.88rem;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
}
.menu-item:hover { background: rgba(255,255,255,0.04); color: #fff; }
.menu-item i { font-size: 0.95rem; width: 1.1rem; text-align: center; color: #8b8680; transition: color 0.15s; }
.menu-item:hover i { color: #F49D25; }

.menu-item.active {
  background: rgba(244, 157, 37, 0.12);
  color: #F49D25;
  font-weight: 600;
}
.menu-item.active i { color: #F49D25; }

.base {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(255,255,255,0.04);
  margin-top: 1rem;
}

.perfil-card {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  text-decoration: none;
  background: rgba(255,255,255,0.03);
  border: 1px solid rgba(255,255,255,0.05);
  border-radius: 0.6rem;
  padding: 0.6rem 0.7rem;
  transition: background 0.2s, border-color 0.2s;
}
.perfil-card:hover { background: rgba(244,157,37,0.08); border-color: rgba(244,157,37,0.3); }
.perfil-card-ativo { border-color: #F49D25; background: rgba(244,157,37,0.12); }

.perfil-avatar {
  flex: 0 0 36px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  overflow: hidden;
  background: #3a332b;
  display: flex;
  align-items: center;
  justify-content: center;
}
.perfil-avatar img { width: 100%; height: 100%; object-fit: cover; }
.perfil-iniciais { color: #F49D25; font-weight: 800; font-size: 0.85rem; }

.perfil-texto { flex: 1; min-width: 0; display: flex; flex-direction: column; line-height: 1.2; }
.perfil-nome {
  color: #fff;
  font-size: 0.82rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.perfil-role {
  color: #8b8680;
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
  color: #8b8680;
  border: 1px solid rgba(255,255,255,0.05);
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
  background: rgba(248,113,113,0.08);
  color: #f87171;
  border-color: rgba(248,113,113,0.3);
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
