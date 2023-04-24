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

router.beforeEach((to,from,next)=>{
  console.log(from)
  if (!from.name && to.name!="home") {
    next({ name: 'home'});
  } else {
    next();
  }
})

export default router;
