import { createRouter, createWebHistory } from "vue-router";
import Sidebar from "../components/sidebar.vue" 
import home from "../pages/home.vue";
import login from "../pages/login.vue";
import cadastro_epi from "../pages/cadastro_epi.vue";
import cadastro_user from "../pages/cadastro_user.vue";
import Controle_EPI from "../pages/controle_EPI.vue";

const routes = [
  
  { path: "/", component: home },
  { path: "/login", component: login },
  { path: "/cadastro_user", component: cadastro_user },

  { path: "/",
     component: Sidebar,
    children: [
      {path: "cadastro_epi", component: cadastro_epi},
      {path: "controle_EPI", component: Controle_EPI},
    ]
  }, 
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});
export default router;
