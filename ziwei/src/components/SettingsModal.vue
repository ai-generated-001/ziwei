<script setup lang="ts">
import { ref } from 'vue';
import { store } from '../store/useStore';
import { X, Key, AlertCircle } from 'lucide-vue-next';

const emit = defineEmits(['close']);

const apiKey = ref(store.settings.apiKey);
const model = ref(store.settings.model);
const errorMsg = ref('');
const successMsg = ref('');
const isSubmitting = ref(false);

const models = [
  { id: 'google/gemini-2.5-flash', name: 'Gemini 2.5 Flash (Recommended)' },
  { id: 'google/gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
  { id: 'meta-llama/llama-3.3-70b-instruct', name: 'Llama 3.3 70B' },
  { id: 'deepseek/deepseek-chat', name: 'DeepSeek Chat (V3)' },
];

async function handleSave() {
  errorMsg.value = '';
  successMsg.value = '';
  isSubmitting.value = ref(true).value;
  try {
    await store.saveSettings(apiKey.value, model.value);
    successMsg.value = store.t('settingsSaved');
    setTimeout(() => {
      emit('close');
    }, 1200);
  } catch (e: any) {
    errorMsg.value = e.toString() || (store.lang === 'zh' ? '保存设置失败。' : 'Failed to save settings.');
  } finally {
    isSubmitting.value = false;
  }
}
</script>

<template>
  <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
    <div class="w-full max-w-md overflow-hidden rounded-2xl border border-white/10 bg-space-900/90 text-white shadow-2xl backdrop-blur-xl animate-scale-in">
      <!-- Header -->
      <div class="flex items-center justify-between border-b border-white/5 px-6 py-4">
        <div class="flex items-center gap-2">
          <Key class="h-5 w-5 text-gold" />
          <h3 class="text-lg font-semibold tracking-wide">{{ store.t('settingsTitle') }}</h3>
        </div>
        <button @click="$emit('close')" class="rounded-lg p-1 text-white/60 transition hover:bg-white/10 hover:text-white">
          <X class="h-5 w-5" />
        </button>
      </div>

      <!-- Form -->
      <div class="p-6 space-y-5">
        <!-- API Key Input -->
        <div class="space-y-2">
          <label class="text-sm font-medium text-white/80 block">{{ store.t('apiKey') }}</label>
          <div class="relative">
            <input 
              type="password" 
              v-model="apiKey"
              placeholder="sk-or-v1-..."
              class="w-full rounded-lg border border-white/10 bg-space-850 px-4 py-2 text-white placeholder-white/40 focus:border-gold/50 focus:ring-1 focus:ring-gold/50 outline-none transition"
            />
          </div>
          <p class="text-xs text-white/40 leading-relaxed">
            {{ store.t('apiKeyDesc') }}
          </p>
        </div>

        <!-- Model ID Selection -->
        <div class="space-y-2">
          <label class="text-sm font-medium text-white/80 block">{{ store.t('aiModel') }}</label>
          <select 
            v-model="model"
            class="w-full rounded-lg border border-white/10 bg-space-800 px-4 py-2 text-white outline-none focus:border-gold/50 transition cursor-pointer"
          >
            <option v-for="m in models" :key="m.id" :value="m.id" class="bg-space-900">
              {{ m.name }}
            </option>
          </select>
        </div>

        <!-- Feedback Alert Messages -->
        <div v-if="errorMsg" class="flex items-center gap-2 rounded-lg bg-red-950/50 border border-red-500/20 p-3 text-sm text-red-300">
          <AlertCircle class="h-4 w-4 shrink-0" />
          <span>{{ errorMsg }}</span>
        </div>

        <div v-if="successMsg" class="flex items-center gap-2 rounded-lg bg-emerald-950/50 border border-emerald-500/20 p-3 text-sm text-emerald-300">
          <AlertCircle class="h-4 w-4 shrink-0" />
          <span>{{ successMsg }}</span>
        </div>

        <!-- Action Button -->
        <button 
          @click="handleSave"
          :disabled="isSubmitting"
          class="w-full flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-gold/80 to-gold hover:from-gold hover:to-gold-dark text-space-950 font-semibold py-2.5 transition active:scale-95 disabled:opacity-50"
        >
          {{ isSubmitting ? store.t('saving') : store.t('saveSettings') }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.bg-space-850 {
  background-color: #141724;
}
.bg-space-800 {
  background-color: #1a1d30;
}
</style>
