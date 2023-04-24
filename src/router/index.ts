import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      name: "home",
      component: () => import("@/views/home.vue"),
    },
    {
      path: "/chat/:sendLogName",
      name: "chat",
      component: () => import("@/views/chat.vue"),
      props: true
    },
    {
      path: "/settings",
      name: "settings",
      component: () => import("@/views/settings.vue"),
    },
  ]
});

const history = window.history;
const hasPushState = typeof history.pushState === 'function';

if (hasPushState) {
  const replaceState = history.replaceState.bind(history);

  history.replaceState = function(state) {
    try {
      replaceState.apply(this, (arguments as any));
    } catch (e) {
      window.location.href = "/";
    }
  }
}

export default router;
