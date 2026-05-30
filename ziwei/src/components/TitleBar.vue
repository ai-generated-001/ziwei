<script setup lang="ts">
import { getCurrentWindow } from '@tauri-apps/api/window';
import { ref, onMounted } from 'vue';
import { Minus, Square, Copy, X } from 'lucide-vue-next';

const appWindow = getCurrentWindow();
const isMaximized = ref(true);

async function syncMaximized() {
  isMaximized.value = await appWindow.isMaximized();
}

async function handleToggleMaximize() {
  await appWindow.toggleMaximize();
  // Small delay to let the OS settle
  setTimeout(syncMaximized, 50);
}

onMounted(() => {
  syncMaximized();
  appWindow.onResized(syncMaximized);
});
</script>

<template>
  <div
    data-tauri-drag-region
    class="titlebar"
  >
    <!-- App identity -->
    <div data-tauri-drag-region class="titlebar__identity">
      <span class="titlebar__icon">✨</span>
      <span class="titlebar__text">紫微斗数分析</span>
    </div>

    <!-- Window controls -->
    <div class="titlebar__controls">
      <button
        @click="appWindow.minimize()"
        class="titlebar__btn"
        aria-label="Minimize"
      >
        <Minus class="titlebar__btn-icon" />
      </button>

      <button
        @click="handleToggleMaximize()"
        class="titlebar__btn"
        aria-label="Toggle Maximize"
      >
        <Copy v-if="isMaximized" class="titlebar__btn-icon titlebar__btn-icon--restore" />
        <Square v-else class="titlebar__btn-icon titlebar__btn-icon--square" />
      </button>

      <button
        @click="appWindow.close()"
        class="titlebar__btn titlebar__btn--close"
        aria-label="Close"
      >
        <X class="titlebar__btn-icon" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.titlebar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 36px;
  padding: 0 4px 0 14px;
  background: linear-gradient(to right, rgba(11, 15, 25, 0.97), rgba(15, 19, 30, 0.97));
  border-bottom: 1px solid rgba(255, 255, 255, 0.04);
  user-select: none;
  flex-shrink: 0;
  z-index: 9999;
  position: relative;
}

/* Subtle bottom glow line */
.titlebar::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(212, 175, 55, 0.15) 30%,
    rgba(212, 175, 55, 0.25) 50%,
    rgba(212, 175, 55, 0.15) 70%,
    transparent 100%
  );
}

.titlebar__identity {
  display: flex;
  align-items: center;
  gap: 7px;
  pointer-events: none;
}

.titlebar__icon {
  font-size: 11px;
  line-height: 1;
}

.titlebar__text {
  font-size: 11.5px;
  font-weight: 500;
  letter-spacing: 0.5px;
  color: rgba(255, 255, 255, 0.35);
}

.titlebar__controls {
  display: flex;
  align-items: center;
  gap: 1px;
  height: 100%;
}

.titlebar__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 46px;
  height: 100%;
  border: none;
  background: transparent;
  color: rgba(255, 255, 255, 0.35);
  cursor: pointer;
  transition: background-color 0.15s ease, color 0.15s ease;
  outline: none;
}

.titlebar__btn:hover {
  background-color: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.9);
}

.titlebar__btn:active {
  background-color: rgba(255, 255, 255, 0.12);
}

.titlebar__btn--close:hover {
  background-color: #e81123;
  color: white;
}

.titlebar__btn--close:active {
  background-color: #bf0f1d;
}

.titlebar__btn-icon {
  width: 16px;
  height: 16px;
}

.titlebar__btn-icon--square {
  width: 13px;
  height: 13px;
}

.titlebar__btn-icon--restore {
  width: 14px;
  height: 14px;
}
</style>
