<script setup lang="ts">
import { ref, watch, nextTick, computed } from 'vue';
import { store } from '../store/useStore';
import { Send, Sparkles, RefreshCw, AlertCircle, Bot, User, Trash2 } from 'lucide-vue-next';
import MarkdownRenderer from './MarkdownRenderer.vue';

const messageText = ref('');
const chatScrollContainer = ref<HTMLDivElement | null>(null);

const presets = computed(() => {
  const isZh = store.lang === 'zh';
  return [
    { 
      text: store.t('presetDestiny'), 
      prompt: isZh
        ? '请结合我的紫微斗数命盘，详细分析我的命宫格局。包括主星的庙旺利陷、四化影响，以及它们如何决定我的性格特质和人生道路。'
        : 'Please provide a detailed analysis of my Destiny Palace (命宫), explaining the major stars, their configurations, and what they indicate about my personality and life path.' 
    },
    { 
      text: store.t('presetCareer'), 
      prompt: isZh
        ? '请分析我当前大限（十年大运）的事业与财运走势。重点结合大限宫位、主星和大限四化，并给出实用的调整建议。'
        : 'How is my Career and Wealth outlook in the current decade? Look at the decadal palace stars and transformations (大限四化) and give practical advice.' 
    },
    { 
      text: store.t('presetRelations'), 
      prompt: isZh
        ? '请结合我的命盘分析我的感情婚姻与人际关系走势。我应该注意哪些潜在问题？星盘有什么促进和谐的建议？'
        : 'What should I watch out for in my Marriage, family and overall relationships? What does my chart suggest for maintaining harmony?' 
    }
  ];
});

async function handleSend(text: string) {
  if (!text.trim() || store.isAiLoading) return;
  
  const prompt = text;
  messageText.value = '';
  
  await store.askAi(prompt);
  scrollToBottom();
}

function handlePresetClick(prompt: string) {
  handleSend(prompt);
}

function scrollToBottom() {
  nextTick(() => {
    if (chatScrollContainer.value) {
      chatScrollContainer.value.scrollTop = chatScrollContainer.value.scrollHeight;
    }
  });
}

watch(() => store.chatHistory.length, scrollToBottom);
watch(() => store.aiStreamingText, scrollToBottom);
</script>

<template>
  <div class="rounded-2xl border border-zinc-800 bg-zinc-900/50 p-5 shadow-lg backdrop-blur-md flex flex-col h-full overflow-hidden">
    <!-- Header -->
    <div class="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
      <div class="flex items-center gap-2">
        <div class="rounded-lg bg-gold/10 p-1.5 text-gold">
          <Sparkles class="h-5 w-5 animate-pulse" />
        </div>
        <div>
          <h3 class="font-semibold text-white text-md">{{ store.t('aiOracle') }}</h3>
          <p class="text-3xs text-white/40">{{ store.t('aiPowered') }}</p>
        </div>
      </div>
      <button 
        v-if="store.chatHistory.length > 0"
        @click="store.clearChat" 
        class="rounded-lg p-1.5 text-white/40 hover:bg-red-500/10 hover:text-red-400 transition"
        :title="store.t('clearHistory')"
      >
        <Trash2 class="h-4 w-4" />
      </button>
    </div>

    <!-- Messages Container -->
    <div 
      ref="chatScrollContainer"
      class="flex-1 overflow-y-auto space-y-4 mb-4 pr-1 custom-scrollbar"
    >
      <!-- Initial State / Tutorial -->
      <div 
        v-if="store.chatHistory.length === 0 && !store.aiStreamingText"
        class="text-center py-10 text-white/30 text-xs max-w-xs mx-auto space-y-3 flex flex-col items-center justify-center h-full"
      >
        <Bot class="h-10 w-10 text-gold/30" />
        <p class="leading-relaxed">
          {{ store.t('aiWelcome') }}
        </p>
        <p class="text-white/20">
          {{ store.t('aiWelcomeTip') }}
        </p>
      </div>

      <!-- Messages list -->
      <div 
        v-for="(msg, index) in store.chatHistory" 
        :key="index"
        :class="msg.role === 'user' ? 'justify-end' : 'justify-start'"
        class="flex gap-2.5"
      >
        <!-- Avatar -->
        <div 
          v-if="msg.role !== 'user'"
          class="h-7 w-7 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center text-gold shrink-0 mt-0.5"
        >
          <Bot class="h-4 w-4" />
        </div>

        <!-- Bubble -->
        <div 
          :class="msg.role === 'user' ? 'bg-gold/15 text-white border-gold/20' : 'bg-space-950/60 text-white/95 border-white/5'"
          class="rounded-2xl border px-3.5 py-2 text-sm max-w-[85%] break-words leading-relaxed shadow-sm font-sans"
          :style="msg.role === 'user' ? 'white-space: pre-line' : ''"
        >
          <MarkdownRenderer v-if="msg.role !== 'user'" :content="msg.content" />
          <template v-else>{{ msg.content }}</template>
        </div>

        <div 
          v-if="msg.role === 'user'"
          class="h-7 w-7 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white/80 shrink-0 mt-0.5"
        >
          <User class="h-4 w-4" />
        </div>
      </div>

      <!-- Streaming / Loading active response -->
      <div v-if="store.isAiLoading && store.aiStreamingText" class="flex gap-2.5 justify-start">
        <div class="h-7 w-7 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center text-gold shrink-0 mt-0.5">
          <Bot class="h-4 w-4" />
        </div>
        <div class="bg-space-950/60 text-white/95 border-white/5 rounded-2xl border px-3.5 py-2 text-sm max-w-[85%] break-words leading-relaxed shadow-sm font-sans">
          <MarkdownRenderer :content="store.aiStreamingText" />
          <span class="inline-block w-1.5 h-4 ml-1 bg-gold animate-pulse"></span>
        </div>
      </div>

      <!-- Loading State Spinner -->
      <div v-else-if="store.isAiLoading" class="flex gap-2.5 justify-start">
        <div class="h-7 w-7 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center text-gold shrink-0 mt-0.5">
          <Bot class="h-4 w-4" />
        </div>
        <div class="bg-space-950/30 border border-white/5 rounded-2xl px-4 py-2 text-sm text-white/40 flex items-center gap-2">
          <RefreshCw class="h-4.5 w-4.5 animate-spin text-gold" />
          <span>{{ store.t('consulting') }}</span>
        </div>
      </div>

      <!-- Error message -->
      <div v-if="store.aiError" class="flex items-center gap-2 rounded-xl bg-red-950/20 border border-red-500/10 p-3 text-xs text-red-300">
        <AlertCircle class="h-4 w-4 shrink-0" />
        <span>{{ store.aiError }}</span>
      </div>
    </div>

    <!-- Quick Preset Chips -->
    <div class="flex flex-wrap gap-1.5 mb-2">
      <button 
        v-for="p in presets" 
        :key="p.text"
        @click="handlePresetClick(p.prompt)"
        :disabled="store.isAiLoading || !store.activeChart"
        class="rounded-full border border-white/10 bg-space-950 px-3 py-1 text-3xs font-medium text-white/60 hover:border-gold/30 hover:text-gold transition active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
      >
        {{ p.text }}
      </button>
    </div>

    <!-- Input Field -->
    <div class="flex items-center gap-2 border-t border-white/5 pt-3">
      <input 
        type="text" 
        v-model="messageText"
        @keydown.enter="handleSend(messageText)"
        :disabled="store.isAiLoading || !store.activeChart"
        :placeholder="store.t('askPlaceholder')"
        class="flex-1 rounded-xl border border-white/10 bg-space-950 px-4 py-2 text-sm text-white placeholder-white/30 focus:border-gold/50 focus:ring-1 focus:ring-gold/50 outline-none transition disabled:opacity-50"
      />
      <button 
        @click="handleSend(messageText)"
        :disabled="store.isAiLoading || !store.activeChart || !messageText.trim()"
        class="rounded-xl bg-gold p-2 text-space-950 hover:bg-gold-light transition active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
      >
        <Send class="h-4 w-4" />
      </button>
    </div>
  </div>
</template>

<style scoped>
.text-3xs {
  font-size: 0.65rem;
}
.custom-scrollbar::-webkit-scrollbar {
  width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
}
.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: rgba(212, 175, 55, 0.3);
}
</style>
