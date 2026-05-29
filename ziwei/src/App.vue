<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { store } from './store/useStore';
import ProfileForm from './components/ProfileForm.vue';
import ProfileList from './components/ProfileList.vue';
import AstrolabeView from './components/AstrolabeView.vue';
import ChatPanel from './components/ChatPanel.vue';
import SettingsModal from './components/SettingsModal.vue';
import { Settings, Compass, Sparkles, AlertCircle, MessageSquare } from 'lucide-vue-next';
import { Splitpanes, Pane } from 'splitpanes';
import 'splitpanes/dist/splitpanes.css';

const isSettingsOpen = ref(false);
const isMobileChatOpen = ref(false);

function handleOpenMobileChat() {
  isMobileChatOpen.value = true;
}

onMounted(async () => {
  window.addEventListener('open-mobile-chat', handleOpenMobileChat);
  await store.init();
  
  if (store.profiles.length > 0 && !store.activeProfile) {
    store.selectProfile(store.profiles[0]);
  }
});

onUnmounted(() => {
  window.removeEventListener('open-mobile-chat', handleOpenMobileChat);
});
</script>

<template>
  <div class="h-screen w-screen overflow-hidden bg-[#0B0F19] text-zinc-50 flex flex-col font-sans">
    <!-- Navigation / Header -->
    <header class="border-b border-zinc-800 bg-[#0B0F19]/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4 shadow-sm shrink-0">
      <div class="max-w-[1600px] w-full mx-auto flex items-center justify-between">
        <!-- Logo -->
        <div class="flex items-center gap-2.5">
          <div class="rounded-xl bg-gradient-to-tr from-gold to-yellow-500 p-2 text-space-950 shadow-lg shadow-gold/20">
            <Compass class="h-6 w-6 animate-spin-slow" />
          </div>
          <div>
            <h1 class="text-lg font-bold tracking-wider bg-gradient-to-r from-white via-white to-gold bg-clip-text text-transparent">
              {{ store.t('title') }}
            </h1>
            <p class="text-3xs text-white/40 tracking-widest uppercase">{{ store.t('subtitle') }}</p>
          </div>
        </div>

        <!-- Right Header controls -->
        <div class="flex items-center gap-4">
          <!-- Active profile display -->
          <div 
            v-if="store.activeProfile" 
            class="hidden md:flex items-center gap-2 rounded-full border border-gold/20 bg-gold/5 px-4 py-1.5 text-xs text-gold animate-fade-in"
          >
            <Sparkles class="h-3.5 w-3.5" />
            <span>{{ store.t('activeChart') }}: <strong>{{ store.activeProfile.name }}</strong></span>
          </div>

          <!-- Language Toggle -->
          <div class="flex items-center rounded-xl border border-white/10 bg-white/5 p-0.5 overflow-hidden">
            <button 
              @click="store.setLanguage('zh')"
              :class="store.lang === 'zh' ? 'bg-gold text-space-950 font-bold' : 'text-white/60 hover:text-white'"
              class="px-2.5 py-1 text-2xs rounded-lg transition"
            >
              中
            </button>
            <button 
              @click="store.setLanguage('en')"
              :class="store.lang === 'en' ? 'bg-gold text-space-950 font-bold' : 'text-white/60 hover:text-white'"
              class="px-2.5 py-1 text-2xs rounded-lg transition"
            >
              EN
            </button>
          </div>

          <!-- Settings Button -->
          <button 
            @click="isSettingsOpen = true"
            class="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2 text-xs font-semibold text-white transition active:scale-95"
          >
            <Settings class="h-4 w-4" />
            <span>{{ store.t('settings') }}</span>
          </button>
        </div>
      </div>
    </header>

    <!-- Main Layout Dashboard Grid -->
    <main class="flex-1 max-w-[1600px] w-full mx-auto p-4 md:p-6 h-full overflow-hidden relative">
      <!-- Desktop Layout (Splitpanes) -->
      <div class="hidden lg:block h-full">
        <Splitpanes class="default-theme h-full">
          <Pane min-size="15" size="18" max-size="30" class="pr-3 flex flex-col gap-6 overflow-y-auto custom-scrollbar h-full">
            <ProfileForm />
            <ProfileList />
          </Pane>

          <Pane min-size="30" size="55" class="px-3 h-full overflow-hidden">
            <section class="bg-transparent border-none rounded-3xl p-2 h-full flex flex-col">
              <div class="flex items-center justify-between mb-4 border-b border-white/5 pb-2 shrink-0">
                <h2 class="font-bold text-white tracking-wide text-md">{{ store.t('astrolabeChart') }}</h2>
                <span class="text-3xs text-white/40 uppercase">{{ store.t('interactiveGrid') }}</span>
              </div>
              <div class="flex-1 overflow-y-auto custom-scrollbar pr-2">
                <AstrolabeView />
              </div>
            </section>
          </Pane>

          <Pane min-size="20" size="27" max-size="70" class="pl-3 flex flex-col gap-6 h-full overflow-hidden">
            <div v-if="!store.settings.apiKey" class="rounded-2xl bg-amber-950/20 border border-amber-500/20 p-4 text-xs text-amber-300 flex items-start gap-3 shrink-0">
              <AlertCircle class="h-5 w-5 shrink-0 mt-0.5" />
              <div class="space-y-1">
                <span class="font-semibold">{{ store.lang === 'zh' ? 'AI 解析功能未解锁' : 'AI Features Locked' }}</span>
                <p class="text-white/60 leading-relaxed">
                  {{ store.lang === 'zh' ? '请先在“设置”面板中配置您的 OpenRouter API 密钥，以启用 AI 命盘解析引擎。' : 'Please enter your OpenRouter API Key in the Settings panel to enable the AI interpretation engine.' }}
                </p>
              </div>
            </div>
            
            <ChatPanel class="flex-1 min-h-0" />
          </Pane>
        </Splitpanes>
      </div>

      <!-- Mobile / Tablet Layout (Stacked) -->
      <div class="lg:hidden flex flex-col gap-6 pb-24 h-full overflow-y-auto custom-scrollbar">
        <ProfileForm />
        <ProfileList />
        <section class="bg-transparent border-none p-2">
          <div class="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
            <h2 class="font-bold text-white tracking-wide text-md">{{ store.t('astrolabeChart') }}</h2>
          </div>
          <AstrolabeView />
        </section>
      </div>

      <!-- Mobile Floating Chat Button -->
      <button 
        @click="isMobileChatOpen = true"
        class="lg:hidden fixed bottom-6 right-6 z-50 rounded-full bg-gold p-4 text-space-950 shadow-lg shadow-gold/30 hover:scale-105 transition-transform active:scale-95"
      >
        <MessageSquare class="h-6 w-6" />
      </button>

      <!-- Mobile Chat Drawer (Overlay) -->
      <div 
        v-if="isMobileChatOpen"
        class="lg:hidden fixed inset-0 z-50 flex flex-col justify-end bg-black/60 backdrop-blur-sm"
        @click.self="isMobileChatOpen = false"
      >
        <div class="bg-space-950 border-t border-white/10 rounded-t-3xl h-[85vh] w-full flex flex-col shadow-2xl animate-slide-up">
          <div class="flex items-center justify-between p-4 border-b border-white/5 shrink-0">
            <h3 class="font-bold text-white flex items-center gap-2">
              <Sparkles class="h-4 w-4 text-gold" />
              AI Oracle
            </h3>
            <button @click="isMobileChatOpen = false" class="text-white/50 hover:text-white p-2">
              <svg class="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
          <div class="flex-1 overflow-y-auto p-4">
            <ChatPanel class="h-full" />
          </div>
        </div>
      </div>
    </main>

    <!-- Settings Modal -->
    <SettingsModal 
      v-if="isSettingsOpen" 
      @close="isSettingsOpen = false" 
    />
  </div>
</template>

<style scoped>
.animate-spin-slow {
  animation: spin 12s linear infinite;
}
.text-3xs {
  font-size: 0.65rem;
}
</style>