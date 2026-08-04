import { createRouter, createWebHistory } from "vue-router";
import { watch } from "vue";

// Só a home entra no bundle inicial; o resto é carregado sob demanda.
// Antes as 13 páginas eram importadas de uma vez, então quem só abria a landing
// baixava o dashboard, o editor de permissões e todos os formulários junto.
// O login também ficou sob demanda porque ele puxa o cliente Supabase (~204 kB)
// e a landing pública não tem o que fazer com ele.
import home from "../pages/home.vue";

const Sidebar = () => import("../components/sidebar.vue");

const routes = [
  { path: "/", component: home, meta: { publica: true } },
  { path: "/login", component: () => import("../pages/login.vue"), meta: { publica: true } },
  { path: "/cadastro_user", component: () => import("../pages/cadastro_user.vue"), meta: { publica: true } },

  {
    path: "/",
    component: Sidebar,
    children: [
      { path: "cadastro_epi", component: () => import("../pages/cadastro_epi.vue"), meta: { roles: ['admin', 'almoxarife'] } },
      { path: "retirada_epi", component: () => import("../pages/retirada_epi.vue") },
      { path: "meus_epis", component: () => import("../pages/meus_epis.vue") },
      { path: "perfil", component: () => import("../pages/perfil.vue") },
      { path: "dashboard", component: () => import("../pages/dashboard.vue"), meta: { roles: ['admin', 'almoxarife'] } },
      { path: "estoque", component: () => import("../pages/estoque.vue") },
      { path: "epi/:id", component: () => import("../pages/detalhes_epi.vue"), meta: { roles: ['admin', 'almoxarife'] } },
      { path: "admin/usuarios", component: () => import("../pages/admin_usuarios.vue"), meta: { roles: ['admin'] } },
      { path: "admin/permissoes", component: () => import("../pages/admin_permissoes.vue"), meta: { roles: ['admin'] } },
      { path: "aprovacoes", component: () => import("../pages/aprovacoes.vue"), meta: { roles: ['admin', 'almoxarife'] } },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: (to, _from, savedPosition) =>
    savedPosition || (to.hash ? { el: to.hash, behavior: 'smooth' } : { top: 0 }),
});

// Import dinâmico: o cliente Supabase são ~240 KB e a landing pública não
// precisa dele. Só é baixado na primeira rota protegida (ou no /login, que
// importa o composable por conta própria).
async function aguardarPerfil() {
  const { useSupabase } = await import("../composables/useSupabase");
  const { session, perfil, loadingSession } = useSupabase();
  return new Promise((resolve) => {
    if (!loadingSession.value) return resolve({ session: session.value, perfil: perfil.value });
    const stop = watch(loadingSession, (v) => {
      if (!v) {
        stop();
        resolve({ session: session.value, perfil: perfil.value });
      }
    });
  });
}

router.beforeEach(async (to) => {
  if (to.meta.publica) return true;

  const { session, perfil } = await aguardarPerfil();

  if (!session) return { path: '/login' };

  const rolesPermitidos = to.meta.roles;
  if (rolesPermitidos && (!perfil || !rolesPermitidos.includes(perfil.role))) {
    return { path: '/estoque' };
  }
  return true;
});

export default router;
