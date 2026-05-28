<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { store } from './store/useStore';
import ProfileForm from './components/ProfileForm.vue';
import ProfileList from './components/ProfileList.vue';
import AstrolabeView from './components/AstrolabeView.vue';
import ChatPanel from './components/ChatPanel.vue';
import SettingsModal from './components/SettingsModal.vue';
import { Settings, Compass, Sparkles, AlertCircle } from 'lucide-vue-next';

const isSettingsOpen = ref(false);

onMounted(async () => {
  await store.init();
  
  // If there are profiles available and no active profile is selected, automatically select the first one
  if (store.profiles.length > 0 && !store.activeProfile) {
    store.selectProfile(store.profiles[0]);
  }
});
</script>

<template>
  <div class="min-h-screen text-slate-100 flex flex-col font-sans">
    <!-- Navigation / Header -->
    <header class="border-b border-white/5 bg-space-950/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4 shadow-sm">
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
    <main class="flex-1 max-w-[1600px] w-full mx-auto p-4 md:p-6 grid grid-cols-12 gap-6 items-start">
      <!-- Left Column: Input Form & Profiles Archive -->
      <section class="col-span-12 lg:col-span-3 xl:col-span-2 space-y-6">
        <ProfileForm />
        <ProfileList />
      </section>

      <!-- Center Column: 12-Palace Astrolabe Chart Visualizer -->
      <section class="col-span-12 lg:col-span-6 xl:col-span-7 bg-space-900/40 border border-white/5 rounded-3xl p-5 shadow-lg backdrop-blur-md">
        <div class="flex items-center justify-between mb-4 border-b border-white/5 pb-2">
          <h2 class="font-bold text-white tracking-wide text-md">{{ store.t('astrolabeChart') }}</h2>
          <span class="text-3xs text-white/40 uppercase">{{ store.t('interactiveGrid') }}</span>
        </div>
        <AstrolabeView />
      </section>

      <!-- Right Column: AI Oracle Chat Panel -->
      <section class="col-span-12 lg:col-span-3 xl:col-span-3 space-y-6">
        <div v-if="!store.settings.apiKey" class="rounded-2xl bg-amber-950/20 border border-amber-500/20 p-4 text-xs text-amber-300 flex items-start gap-3">
          <AlertCircle class="h-5 w-5 shrink-0 mt-0.5" />
          <div class="space-y-1">
            <span class="font-semibold">{{ store.lang === 'zh' ? 'AI 解析功能未解锁' : 'AI Features Locked' }}</span>
            <p class="text-white/60 leading-relaxed">
              {{ store.lang === 'zh' ? '请先在“设置”面板中配置您的 OpenRouter API 密钥，以启用 AI 命盘解析引擎。' : 'Please enter your OpenRouter API Key in the Settings panel to enable the AI interpretation engine.' }}
            </p>
          </div>
        </div>
        
        <ChatPanel />
      </section>
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