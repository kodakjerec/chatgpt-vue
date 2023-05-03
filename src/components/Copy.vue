<template>
  <div class="flex items-center cursor-pointer" @click="copyToClipboard()" ref="copy">
    <copy v-show="btnStatus === 'copy'" :theme="btnConfig.theme" :size="btnConfig.size" :fill="btnConfig.fill" />
    <loading class="rotate" v-show="btnStatus === 'loading'" :theme="btnConfig.theme" :size="btnConfig.size"
      :fill="btnConfig.fill" />
    <check-one v-show="btnStatus === 'success'" :theme="btnConfig.theme" :size="btnConfig.size" :fill="btnConfig.fill" />
    <close-one v-show="btnStatus === 'error'" :theme="btnConfig.theme" :size="btnConfig.size" :fill="btnConfig.fill" />
    <span class="text-xs ml-0.5 text-gray-500 leading-none">{{
      btnTips[btnStatus]
    }}</span>
  </div>
</template>

<script lang="ts">
import { Copy, Loading, CheckOne, CloseOne } from "@icon-park/vue-next";
import type { Theme } from "@icon-park/vue-next/lib/runtime";

export default {
  name: "CopyContent",
  components: {
    Copy, Loading, CheckOne, CloseOne
  },
  props: {
    content: {
      type: String,
      default: ''
    }
  },
  data() {
    return {
      btnConfig: {
        size: 14,
        fill: "#999",
        theme: 'outline' as Theme,
      } as { [key: string]: any },
      btnTips: {
        copy: "Copy All!",
        loading: "",
        success: "Copy to clipboard！",
        error: "Copy failed！",
      } as { [key: string]: any },
      btnStatus: "copy" as string
    }
  },
  methods: {
    copyToClipboard(content: string = this.content) {
      this.btnStatus = "loading";
      (navigator as any).clipboard
        .writeText(content)
        .then(() => setTimeout(() => (this.btnStatus = "success"), 150))
        .catch(() => (this.btnStatus = "error"))
        .finally(() => setTimeout(() => (this.btnStatus = "copy"), 1500));
    }
  }
}
</script>

<style scoped>
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.rotate {
  animation: spin 2s linear infinite;
}
</style>
