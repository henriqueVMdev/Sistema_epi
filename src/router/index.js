import { createRouter, createWebHistory } from "vue-router";
import home from "../pages/home.vue";
import login from "../pages/login.vue";
import cadastro_epi from "../pages/cadastro_epi.vue";
import cadastro_user from "../pages/cadastro_user.vue";

const routes = [
  { path: "/", component: home },
  { path: "/login", component: login },
  { path: "/cadastro_epi", component: cadastro_epi },
  { path: "/cadastro_user", component: cadastro_user },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});
export default router;
