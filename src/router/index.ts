import { createRouter, createWebHistory } from "vue-router";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: "/",
      redirect: { name: "home" },
    },
    {
      path: "/yourChatGPT/",
      name: "home",
      components: {
        home: () => import("@/views/home.vue"),
        chat: () => import("@/views/chat.vue"),
        settings: () => import("@/views/settings.vue"),
        createOneImage: () => import("@/views/createOneImage.vue"),
        translation: () => import("@/views/translation.vue"),
        transcription: () => import("@/views/transcription.vue"),
      },
    },
  ],
});

const history = window.history;
const hasPushState = typeof history.pushState === "function";

if (hasPushState) {
  const replaceState = history.replaceState.bind(history);

  history.replaceState = function (state) {
    try {
      replaceState.apply(this, arguments as any);
    } catch (e) {
      window.location.href = "/";
    }
  };
}

export default router;
