import { createRouter, createWebHistory } from "vue-router";
import Sidebar from "../components/sidebar.vue"
import home from "../pages/home.vue";
import login from "../pages/login.vue";
import cadastro_epi from "../pages/cadastro_epi.vue";
import cadastro_user from "../pages/cadastro_user.vue";
import retirada_epi from "../pages/retirada_epi.vue";
import dashboard from "../pages/dashboard.vue";
import estoque from "../pages/estoque.vue";
import detalhes_epi from "../pages/detalhes_epi.vue";

const routes = [

  { path: "/", component: home },
  { path: "/login", component: login },
  { path: "/cadastro_user", component: cadastro_user },

  { path: "/",
     component: Sidebar,
    children: [
      {path: "cadastro_epi", component: cadastro_epi},
      {path: "retirada_epi", component: retirada_epi},
      {path: "dashboard", component: dashboard},
      {path: "estoque", component: estoque},
      {path: "epi/:id", component: detalhes_epi}
    ]
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});
export default router;
