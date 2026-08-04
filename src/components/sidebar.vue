<template>
  <div class="shell">
    <a class="pular-para-conteudo" href="#conteudo">Pular para o conteúdo</a>

    <!-- Barra mobile: abaixo de 900px a lateral vira gaveta. Antes ela só virava
         estática e empilhava o menu inteiro em cima de toda página. -->
    <header class="barra-mobile">
      <button
        type="button"
        class="btn-menu"
        :aria-expanded="menuAberto"
        aria-controls="menu-lateral"
        :aria-label="menuAberto ? 'Fechar menu' : 'Abrir menu'"
        @click="menuAberto = !menuAberto"
      >
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true">
          <template v-if="menuAberto">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </template>
          <template v-else>
            <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
          </template>
        </svg>
      </button>
      <span class="logo-nome">Omni<span class="logo-destaque">Seg</span></span>
      <RouterLink v-if="perfil" to="/perfil" class="avatar-mobile" :aria-label="`Perfil de ${perfil.nome}`">
        <img v-if="perfil.avatar_url" loading="lazy" decoding="async" :src="perfil.avatar_url" alt="" />
        <span v-else>{{ iniciais(perfil.nome) }}</span>
      </RouterLink>
    </header>

    <div v-if="menuAberto" class="veu" @click="menuAberto = false"></div>

    <aside id="menu-lateral" class="sidebar" :class="{ aberta: menuAberto }">
      <header class="sidebar-header">
        <img src="@/assets/Logo_branco.svg" alt="" class="logo-img" />
        <div class="logo-texto">
          <span class="logo-nome">Omni<span class="logo-destaque">Seg</span></span>
          <span class="logo-sub">{{ rotuloPainel }}</span>
        </div>
      </header>

      <nav class="menu" aria-label="Navegação principal">
        <div v-for="grupo in gruposVisiveis" :key="grupo.titulo" class="grupo">
          <p :id="`grupo-${slug(grupo.titulo)}`" class="grupo-titulo">{{ grupo.titulo }}</p>
          <ul class="grupo-itens" :aria-labelledby="`grupo-${slug(grupo.titulo)}`">
            <li v-for="item in grupo.itens" :key="item.to">
              <RouterLink :to="item.to" class="menu-item" active-class="active">
                <Icone :nome="item.icone" :tamanho="18" />
                <span>{{ item.label }}</span>
              </RouterLink>
            </li>
          </ul>
        </div>
      </nav>

      <div class="base">
        <RouterLink v-if="perfil" to="/perfil" class="perfil-card" active-class="perfil-card-ativo">
          <div class="perfil-avatar">
            <img loading="lazy" decoding="async" v-if="perfil.avatar_url" :src="perfil.avatar_url" alt="" />
            <span v-else class="perfil-iniciais">{{ iniciais(perfil.nome) }}</span>
          </div>
          <div class="perfil-texto">
            <span class="perfil-nome">{{ perfil.nome }}</span>
            <span class="perfil-role">{{ perfil.role }}</span>
          </div>
        </RouterLink>

        <button type="button" class="botao-sair" @click="sair">
          <Icone nome="sair" :tamanho="16" />
          <span>Sair</span>
        </button>
      </div>
    </aside>

    <main id="conteudo" class="conteudo" tabindex="-1">
      <RouterView />
    </main>
  </div>
</template>

<script setup>
import { useSupabase } from '@/composables/useSupabase'
import { useRouter, useRoute, RouterLink, RouterView } from 'vue-router'
import { computed, ref, watch } from 'vue'
import Icone from '@/components/Icone.vue'

const { supabase, perfil } = useSupabase()

const GRUPOS = [
  {
    titulo: 'Estoque & EPIs',
    itens: [
      { to: '/estoque',      label: 'Estoque',         icone: 'estoque',    roles: ['admin','almoxarife','professor','aluno'] },
      { to: '/cadastro_epi', label: 'Cadastro de EPI', icone: 'adicionar',  roles: ['admin','almoxarife'] },
    ],
  },
  {
    titulo: 'Operações',
    itens: [
      { to: '/retirada_epi', label: 'Retirada de EPIs', icone: 'retirada',   roles: ['admin','almoxarife','professor','aluno'] },
      { to: '/meus_epis',    label: 'Meus EPIs',        icone: 'capacete',   roles: ['admin','almoxarife','professor','aluno'] },
      { to: '/aprovacoes',   label: 'Aprovações',       icone: 'aprovacoes', roles: ['admin','almoxarife'] },
    ],
  },
  {
    titulo: 'Análise',
    itens: [
      { to: '/dashboard', label: 'Dashboard', icone: 'grafico', roles: ['admin','almoxarife'] },
    ],
  },
  {
    titulo: 'Administração',
    itens: [
      { to: '/admin/usuarios',   label: 'Gerenciar Usuários', icone: 'usuarios', roles: ['admin'] },
      { to: '/admin/permissoes', label: 'Permissões de EPI',  icone: 'cadeado',  roles: ['admin'] },
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

const rotuloPainel = computed(() => ({
  admin: 'Admin Panel',
  almoxarife: 'Almoxarifado',
  professor: 'Professor',
  aluno: 'Aluno',
}[perfil.value?.role] || 'Sistema EPI'))

const iniciais = (nome) =>
  (nome || '?').trim().split(/\s+/).slice(0, 2).map(p => p[0]?.toUpperCase()).join('')

const slug = (t) => t.toLowerCase().replace(/[^a-z]+/g, '-')

const menuAberto = ref(false)
const route = useRoute()
watch(() => route.fullPath, () => { menuAberto.value = false })

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
.shell {
  display: grid;
  grid-template-columns: 260px 1fr;
  min-height: 100vh;
  min-height: 100dvh;
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
  height: 100dvh;
  z-index: 1000;
  overflow-y: auto;
  align-self: start;
}

.sidebar-header {
  display: flex;
  align-items: center;
  gap: 0.7rem;
  padding: 0.4rem 0.5rem 1.4rem;
  border-bottom: 1px solid color-mix(in srgb, var(--texto-forte) 4%, transparent);
  margin-bottom: 1.2rem;
}
.logo-img { width: 2.4rem; height: 2.4rem; object-fit: contain; flex-shrink: 0; }
.logo-texto { display: flex; flex-direction: column; line-height: 1.2; }
.logo-nome { color: var(--texto-forte); font-size: 1.05rem; font-weight: 800; letter-spacing: -0.01em; }
.logo-destaque { color: var(--marca); }
.logo-sub { color: var(--texto-suave); font-size: 0.72rem; font-weight: 500; margin-top: 0.1rem; }

.menu { flex-grow: 1; display: flex; flex-direction: column; gap: 1.1rem; }
.grupo { display: flex; flex-direction: column; gap: 0.25rem; }
.grupo-itens { list-style: none; display: flex; flex-direction: column; gap: 0.15rem; }
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
  min-height: 2.75rem;
  padding: 0.6rem 0.8rem;
  color: var(--texto);
  text-decoration: none;
  border-radius: var(--raio-sm);
  font-size: 0.88rem;
  font-weight: 500;
  transition: background 0.15s, color 0.15s;
}
.menu-item:hover { background: color-mix(in srgb, var(--texto-forte) 4%, transparent); color: var(--texto-forte); }
.menu-item :deep(.icone) { color: var(--texto-suave); transition: color 0.15s; }
.menu-item:hover :deep(.icone) { color: var(--marca); }

.menu-item.active {
  background: color-mix(in srgb, var(--marca) 12%, transparent);
  color: var(--marca);
  font-weight: 600;
}
.menu-item.active :deep(.icone) { color: var(--marca); }

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
  border-radius: var(--raio-sm);
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
  min-height: 2.75rem;
  background: transparent;
  color: var(--texto-suave);
  border: 1px solid color-mix(in srgb, var(--texto-forte) 5%, transparent);
  padding: 0.6rem 0.8rem;
  border-radius: var(--raio-sm);
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

.conteudo { min-width: 0; overflow-x: hidden; }
.conteudo:focus { outline: none; }

/* --- Mobile --- */
.barra-mobile { display: none; }
.veu { display: none; }

@media (max-width: 900px) {
  .shell { grid-template-columns: 1fr; }

  .barra-mobile {
    position: sticky;
    top: 0;
    z-index: 1001;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.6rem 0.9rem;
    background: var(--superficie-elevada);
    border-bottom: 1px solid var(--borda);
  }
  .barra-mobile .logo-nome { flex: 1; font-size: 1.1rem; }

  .btn-menu {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.75rem;
    height: 2.75rem;
    background: transparent;
    border: 1px solid var(--borda);
    border-radius: var(--raio-sm);
    color: var(--texto-forte);
    cursor: pointer;
  }

  .avatar-mobile {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 2.4rem;
    height: 2.4rem;
    border-radius: 50%;
    overflow: hidden;
    background: var(--borda-forte);
    color: var(--marca);
    font-weight: 800;
    font-size: 0.8rem;
    text-decoration: none;
    flex-shrink: 0;
  }
  .avatar-mobile img { width: 100%; height: 100%; object-fit: cover; }

  .veu {
    display: block;
    position: fixed;
    inset: 0;
    background: rgb(0 0 0 / 0.55);
    z-index: 1002;
  }

  .sidebar {
    position: fixed;
    top: 0;
    bottom: 0;
    left: 0;
    width: min(19rem, 84vw);
    height: auto;
    z-index: 1003;
    transform: translateX(-100%);
    /* visibility tira a gaveta fechada da ordem de tabulação — só o transform
       deixaria 10 links focáveis fora da tela. */
    visibility: hidden;
    transition: transform 0.22s ease, visibility 0.22s;
    border-right: 1px solid var(--borda);
  }
  .sidebar.aberta { transform: none; visibility: visible; }
}
</style>
