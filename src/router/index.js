import { createRouter, createWebHistory } from "vue-router";
import { watch } from "vue";
import Sidebar from "../components/sidebar.vue";
import home from "../pages/home.vue";
import login from "../pages/login.vue";
import cadastro_epi from "../pages/cadastro_epi.vue";
import cadastro_user from "../pages/cadastro_user.vue";
import retirada_epi from "../pages/retirada_epi.vue";
import dashboard from "../pages/dashboard.vue";
import estoque from "../pages/estoque.vue";
import detalhes_epi from "../pages/detalhes_epi.vue";
import admin_usuarios from "../pages/admin_usuarios.vue";
import admin_permissoes from "../pages/admin_permissoes.vue";
import aprovacoes from "../pages/aprovacoes.vue";
import { useSupabase } from "../composables/useSupabase";

// roles permitidas por rota (meta.roles). Se omitido, libera para qualquer logado.
const routes = [
  { path: "/", component: home, meta: { publica: true } },
  { path: "/login", component: login, meta: { publica: true } },
  { path: "/cadastro_user", component: cadastro_user, meta: { publica: true } },

  {
    path: "/",
    component: Sidebar,
    children: [
      { path: "cadastro_epi", component: cadastro_epi, meta: { roles: ['admin', 'almoxarife'] } },
      { path: "retirada_epi", component: retirada_epi },
      { path: "dashboard", component: dashboard, meta: { roles: ['admin', 'almoxarife'] } },
      { path: "estoque", component: estoque },
      { path: "epi/:id", component: detalhes_epi, meta: { roles: ['admin', 'almoxarife'] } },
      { path: "admin/usuarios", component: admin_usuarios, meta: { roles: ['admin'] } },
      { path: "admin/permissoes", component: admin_permissoes, meta: { roles: ['admin'] } },
      { path: "aprovacoes", component: aprovacoes, meta: { roles: ['admin', 'almoxarife'] } },
    ],
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Espera o perfil carregar antes de decidir o guard
function aguardarPerfil() {
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
    // sem permissão -> manda pra estoque (página segura para todos)
    return { path: '/estoque' };
  }
  return true;
});

export default router;
