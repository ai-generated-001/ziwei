<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { store } from '../store/useStore';
import { Compass, ChevronDown, ChevronUp, Sparkles } from 'lucide-vue-next';
import { getStarMeaning } from '../utils/starDictionary';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// Mapping position branches in clockwise circular fashion (standard 4x4 Grid layout)
const gridPositions = [
  { branch: '巳', row: 1, col: 1 },
  { branch: '午', row: 1, col: 2 },
  { branch: '未', row: 1, col: 3 },
  { branch: '申', row: 1, col: 4 },
  { branch: '酉', row: 2, col: 4 },
  { branch: '戌', row: 3, col: 4 },
  { branch: '亥', row: 4, col: 4 },
  { branch: '子', row: 4, col: 3 },
  { branch: '丑', row: 4, col: 2 },
  { branch: '寅', row: 4, col: 1 },
  { branch: '卯', row: 3, col: 1 },
  { branch: '辰', row: 2, col: 1 }
];

const expandedPalaces = ref<Record<string, boolean>>({});

function togglePalace(palaceName: string) {
  expandedPalaces.value[palaceName] = !expandedPalaces.value[palaceName];
}

// Helpers for star classification and styling
const luckyStars = ['左辅', '右弼', '天魁', '天钺', '文昌', '文曲'];
const unluckyStars = ['擎羊', '陀罗', '火星', '铃星', '地空', '地劫'];

// English translation equivalents if english is active
const luckyStarsEn = ['Left Assistant', 'Right Assistant', 'Chief', 'Aide', 'Intellect', 'Resource'];
const unluckyStarsEn = ['Sheep', '陀罗', 'Mars', 'Siren', 'Sky Void', 'Earth Void']; // standard translations or checks

function isLuckyStar(name: string) {
  return luckyStars.includes(name) || luckyStarsEn.includes(name);
}

function isUnluckyStar(name: string) {
  return unluckyStars.includes(name) || unluckyStarsEn.includes(name);
}

function getMutagenClass(mutagen: string) {
  switch (mutagen) {
    case '禄':
    case 'Lu': 
      return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    case '权':
    case 'Quan': 
      return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    case '科':
    case 'Ke': 
      return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    case '忌':
    case 'Ji': 
      return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    default: return 'bg-white/10 text-white/60 border-white/5';
  }
}

// Retrieve palace object for a given branch dynamically
function getPalaceByBranch(branch: string) {
  // In iztro, earthlyBranch is always in Chinese ('子', '丑', '寅', etc.)
  // Note: in English mode, iztro translates '午' as 'woo' to distinguish from '戊' (wu)
  const branchMap: Record<string, string[]> = {
    '巳': ['si'], '午': ['wu', 'woo'], '未': ['wei'], '申': ['shen'],
    '酉': ['you'], '戌': ['xu'], '亥': ['hai'], '子': ['zi'],
    '丑': ['chou'], '寅': ['yin'], '卯': ['mao'], '辰': ['chen']
  };
  const targets = branchMap[branch] || [branch];
  return store.activeChart?.palaces.find((p: any) => {
    const pBranch = p.earthlyBranch.toLowerCase();
    return pBranch === branch || targets.includes(pBranch);
  });
}

const hoveredIndex = ref<number | null>(null);

function getHighlightState(index: number | undefined) {
  if (index === undefined || hoveredIndex.value === null) {
    return 'normal';
  }
  if (index === hoveredIndex.value) {
    return 'target';
  }
  const opposite = (hoveredIndex.value + 6) % 12;
  const trine1 = (hoveredIndex.value + 4) % 12;
  const trine2 = (hoveredIndex.value + 8) % 12;

  if (index === opposite || index === trine1 || index === trine2) {
    return 'related';
  }
  return 'dimmed';
}

// Context Menu State
const contextMenu = ref({
  visible: false,
  x: 0,
  y: 0,
  palace: null as any
});

function openContextMenu(e: Event, palace: any) {
  e.preventDefault();
  let clientX = 0;
  let clientY = 0;
  
  if (window.TouchEvent && e instanceof TouchEvent) {
    clientX = e.touches[0].clientX;
    clientY = e.touches[0].clientY;
  } else {
    clientX = (e as MouseEvent).clientX;
    clientY = (e as MouseEvent).clientY;
  }
  
  contextMenu.value = {
    visible: true,
    x: clientX,
    y: clientY,
    palace
  };
}

function closeContextMenu() {
  contextMenu.value.visible = false;
}

function handleDeepAnalysis() {
  if (contextMenu.value.palace) {
    store.askAiDeepAnalysis(contextMenu.value.palace.name, contextMenu.value.palace);
    // Dispatch a custom event to open mobile chat if on mobile
    window.dispatchEvent(new CustomEvent('open-mobile-chat'));
  }
  closeContextMenu();
}

onMounted(() => {
  window.addEventListener('click', closeContextMenu);
});
onUnmounted(() => {
  window.removeEventListener('click', closeContextMenu);
});

</script>

<template>
  <TooltipProvider :delay-duration="200">
  <div v-if="store.activeChart" class="space-y-6 relative">
    <!-- 1. Mobile View (Card List) -->
    <div class="block md:hidden space-y-4">
      <!-- Sticky Header -->
      <div class="sticky top-0 z-20 rounded-xl border border-white/10 bg-space-950/90 p-4 shadow-lg backdrop-blur-md">
        <div class="flex items-center justify-between mb-2">
          <div class="flex items-center gap-2">
            <Compass class="h-5 w-5 text-gold animate-spin-slow" />
            <h2 class="text-md font-bold text-white tracking-wide">
              {{ store.lang === 'zh' ? store.activeProfile?.name + '的星盘' : store.activeProfile?.name + "'s Astrolabe" }}
            </h2>
          </div>
          <span class="rounded bg-gold/10 px-2 py-0.5 text-2xs font-semibold text-gold border border-gold/20">
            {{ store.activeChart.fiveElementsClass }}
          </span>
        </div>
        <div class="grid grid-cols-2 gap-y-1 text-2xs text-white/60">
          <div>{{ store.t('genderLabel') }}: {{ store.activeChart.gender }}</div>
          <div>{{ store.t('zodiacLabel') }}: {{ store.activeChart.zodiac }}</div>
          <div class="col-span-2">{{ store.t('solarLabel') }}: {{ store.activeChart.solarDate }}</div>
          <div class="col-span-2">{{ store.t('lunarLabel') }}: {{ store.activeChart.lunarDate }}</div>
          <div class="col-span-2 font-medium text-white/80">{{ store.t('baziLabel') }}: {{ store.activeChart.chineseDate }}</div>
        </div>
      </div>

      <div class="space-y-3">
        <div 
          v-for="p in store.activeChart.palaces" 
          :key="p.name"
          class="rounded-xl border border-zinc-800 bg-zinc-900/80 p-4 shadow backdrop-blur-sm transition touch-callout-none"
          style="-webkit-touch-callout: none;"
          @contextmenu.prevent="openContextMenu($event, p)"
        >
          <!-- Summary Header (Palace Name & Primary Stars) -->
          <div @click="togglePalace(p.name)" class="flex items-center justify-between cursor-pointer">
            <div>
              <div class="flex items-center gap-2">
                <span class="font-bold text-base text-white hover:text-gold transition">
                  {{ p.name }}
                </span>
                <span v-if="p.isBodyPalace" class="rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1 py-0.5 text-3xs font-semibold scale-90">
                  {{ store.lang === 'zh' ? '身宫' : 'Body' }}
                </span>
                <span class="text-xs text-white/40">
                  ({{ p.heavenlyStem }}{{ p.earthlyBranch }})
                </span>
              </div>
              <div class="flex flex-wrap gap-2 mt-1">
                <span 
                  v-for="s in p.majorStars" 
                  :key="s.name"
                  class="text-sm font-bold text-gold flex items-center gap-0.5"
                >
                  {{ s.name }}<span v-if="s.brightness" :class="s.brightness === '庙' || s.brightness === '旺' || s.brightness === 'Temple' || s.brightness === 'Prosperous' ? 'text-emerald-400' : s.brightness === '陷' || s.brightness === '平' || s.brightness === 'Trap' || s.brightness === 'Flat' ? 'text-rose-400' : 'text-white/40'" class="text-2xs font-normal">({{ s.brightness }})</span>
                  <span v-if="s.mutagen" :class="getMutagenClass(s.mutagen)" class="rounded px-1 text-3xs border scale-90">
                    {{ s.mutagen }}
                  </span>
                </span>
              </div>
            </div>

            <!-- Toggle icon -->
            <button class="rounded-lg p-1 hover:bg-white/5 text-white/40">
              <ChevronDown v-if="!expandedPalaces[p.name]" class="h-5 w-5" />
              <ChevronUp v-else class="h-5 w-5" />
            </button>
          </div>

          <!-- Expanded Secondary & Tertiary Stars -->
          <div v-if="expandedPalaces[p.name]" class="mt-4 pt-3 border-t border-white/5 space-y-3 animate-fade-in">
            <!-- Lucky & Unlucky Stars -->
            <div class="flex flex-wrap gap-2">
              <span 
                v-for="s in [...p.minorStars, ...p.adjectiveStars]" 
                :key="s.name"
                :class="isLuckyStar(s.name) ? 'text-emerald-400 border-emerald-500/10 bg-emerald-500/5' : isUnluckyStar(s.name) ? 'text-rose-400 border-rose-500/10 bg-rose-500/5' : 'text-white/60 border-white/5 bg-white/5'"
                class="rounded border px-1.5 py-0.5 text-2xs flex items-center gap-0.5"
              >
                {{ s.name }}
                <span v-if="s.mutagen" :class="getMutagenClass(s.mutagen)" class="rounded px-0.5 text-3xs border scale-75">
                  {{ s.mutagen }}
                </span>
              </span>
            </div>

            <!-- Muted Details -->
            <div class="grid grid-cols-2 gap-2 text-3xs text-white/40 border-t border-white/5 pt-2">
              <div>{{ store.lang === 'zh' ? '长生神' : 'Longevity' }}: <span class="text-white/60">{{ p.changsheng12 }}</span></div>
              <div>{{ store.lang === 'zh' ? '大限' : 'Decade' }}: <span class="text-white/60">{{ p.decadal.range[0] }} - {{ p.decadal.range[1] }}</span></div>
              <div class="col-span-2">{{ store.lang === 'zh' ? '流年/小限' : 'Yearly/Age' }}: <span class="text-white/60">{{ p.ages.slice(0, 8).join(', ') }}...</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 2. PC View (Circular 12-Palace 4x4 Grid) -->
    <div class="hidden md:grid grid-cols-4 grid-rows-4 gap-2 aspect-square max-w-[950px] w-full mx-auto border border-zinc-800 rounded-3xl bg-zinc-950 p-3 shadow-2xl backdrop-blur-xl animate-fade-in">
      <!-- Outer 12 Palaces -->
      <div 
        v-for="pos in gridPositions" 
        :key="pos.branch"
        :style="{ gridRow: pos.row, gridColumn: pos.col }"
        @mouseenter="hoveredIndex = getPalaceByBranch(pos.branch)?.index ?? null"
        @mouseleave="hoveredIndex = null"
        @contextmenu.prevent="openContextMenu($event, getPalaceByBranch(pos.branch))"
        :class="[
          getHighlightState(getPalaceByBranch(pos.branch)?.index) === 'target'
            ? 'border-gold bg-gold/15 scale-[1.03] shadow-lg shadow-gold/10 ring-1 ring-gold/40 z-10'
            : getHighlightState(getPalaceByBranch(pos.branch)?.index) === 'related'
            ? 'border-gold/40 bg-zinc-800 scale-[1.015] shadow-md border-dashed z-10'
            : getHighlightState(getPalaceByBranch(pos.branch)?.index) === 'dimmed'
            ? 'opacity-25 scale-[0.98] border-zinc-800 blur-[0.4px]'
        : 'border-zinc-800 bg-zinc-900'
        ]"
        class="relative border rounded-2xl p-2 shadow-md backdrop-blur-sm flex flex-col hover:border-gold/40 hover:bg-zinc-800 transition-all duration-300 cursor-pointer select-none touch-callout-none"
        style="-webkit-touch-callout: none;"
      >
        <!-- Palace Name Header -->
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-1.5">
            <span class="font-bold text-sm lg:text-base text-white/95">{{ getPalaceByBranch(pos.branch)?.name }}</span>
            <span v-if="getPalaceByBranch(pos.branch)?.isBodyPalace" class="rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1 py-0.5 text-2xs font-semibold scale-90">
              {{ store.lang === 'zh' ? '身' : 'Body' }}
            </span>
          </div>
          <span class="text-xs font-semibold text-white/30">{{ getPalaceByBranch(pos.branch)?.earthlyBranch }}</span>
        </div>

        <!-- Major Stars (Destiny Core) -->
        <div class="my-0.5 flex flex-col gap-1">
          <Tooltip 
            v-for="s in getPalaceByBranch(pos.branch)?.majorStars" 
            :key="s.name"
          >
            <TooltipTrigger as-child>
              <div class="text-xs lg:text-[15px] font-bold text-gold flex items-center justify-between cursor-help leading-tight">
                <span>{{ s.name }}</span>
                <div class="flex items-center gap-1">
                  <span v-if="s.brightness" :class="s.brightness === '庙' || s.brightness === '旺' || s.brightness === 'Temple' || s.brightness === 'Prosperous' ? 'text-emerald-400' : s.brightness === '陷' || s.brightness === '平' || s.brightness === 'Trap' || s.brightness === 'Flat' ? 'text-rose-400' : 'text-white/40'" class="text-3xs lg:text-2xs font-normal">({{ s.brightness }})</span>
                  <span v-if="s.mutagen" :class="getMutagenClass(s.mutagen)" class="rounded px-0.5 py-0.2 text-3xs border scale-95 leading-none">
                    {{ s.mutagen }}
                  </span>
                </div>
              </div>
            </TooltipTrigger>
            <TooltipContent side="top" :side-offset="4" class="z-[100] max-w-[200px] bg-zinc-900 border-zinc-800 text-white shadow-xl">
              <p class="text-xs whitespace-normal leading-relaxed text-center">
                {{ getStarMeaning(s.name) }}
              </p>
            </TooltipContent>
          </Tooltip>
        </div>

        <!-- Secondary (Lucky/Unlucky) & Tertiary Stars -->
        <div class="flex flex-wrap gap-1 mt-0.5 mb-1">
          <Tooltip 
            v-for="s in [...(getPalaceByBranch(pos.branch)?.minorStars || []), ...(getPalaceByBranch(pos.branch)?.adjectiveStars || [])]" 
            :key="s.name"
          >
            <TooltipTrigger as-child>
              <span 
                :class="isLuckyStar(s.name) ? 'text-emerald-400' : isUnluckyStar(s.name) ? 'text-rose-400' : 'text-gray-500 opacity-80'"
                class="text-[10px] font-medium tracking-tight flex items-center cursor-help leading-none"
              >
                {{ s.name }}<span v-if="s.mutagen" class="text-gold scale-75">*</span>
              </span>
            </TooltipTrigger>
            <TooltipContent side="top" :side-offset="4" class="z-[100] max-w-[200px] bg-zinc-900 border-zinc-800 text-white shadow-xl">
              <p class="text-xs whitespace-normal leading-relaxed text-center">
                {{ getStarMeaning(s.name) }}
              </p>
            </TooltipContent>
          </Tooltip>
        </div>

        <!-- Footer (Stem, Longevity, Decadal range, Ages) -->
        <div class="flex flex-col gap-1 border-t border-zinc-800 pt-1.5 mt-auto leading-tight">
          <div class="flex items-center justify-between text-[10px] text-white/30">
            <span>{{ getPalaceByBranch(pos.branch)?.heavenlyStem }}</span>
            <span class="text-gray-500">{{ getPalaceByBranch(pos.branch)?.changsheng12 }}</span>
            <span class="font-medium text-white/50">{{ store.lang === 'zh' ? '大限' : 'Decade' }}: {{ getPalaceByBranch(pos.branch)?.decadal.range[0] }}-{{ getPalaceByBranch(pos.branch)?.decadal.range[1] }}</span>
          </div>
          <div class="flex items-center justify-end text-3xs lg:text-[0.65rem] text-white/30">
            <span class="truncate opacity-75">{{ store.lang === 'zh' ? '流年' : 'Year' }}: {{ getPalaceByBranch(pos.branch)?.ages.slice(0, 5).join(', ') }}</span>
          </div>
        </div>
      </div>

      <!-- Merged 2x2 Center Info Card -->
      <div 
        class="gridRow-start-2 gridRow-end-4 gridColumn-start-2 gridColumn-end-4 col-start-2 col-end-4 row-start-2 row-end-4 border border-zinc-800 rounded-2xl bg-zinc-950/60 p-6 flex flex-col justify-between shadow-inner"
      >
        <div class="space-y-5">
          <!-- Title / Meta -->
          <div class="flex items-center justify-between border-b border-white/5 pb-3">
            <div class="flex items-center gap-3">
              <Compass class="h-6 w-6 text-gold animate-spin-slow" />
              <h2 class="text-base lg:text-xl font-bold text-white tracking-wider">
                {{ store.activeProfile?.name }}
              </h2>
            </div>
            <span class="rounded bg-gold/15 px-2.5 py-0.5 text-xs font-semibold text-gold border border-gold/30">
              {{ store.activeChart.fiveElementsClass }}
            </span>
          </div>

          <!-- Birth Times -->
          <div class="space-y-2.5 text-xs lg:text-sm text-white/70">
            <div class="flex items-center gap-3">
              <span class="font-medium text-white/40 w-14">{{ store.t('solarLabel') }}:</span>
              <span>{{ store.activeChart.solarDate }}</span>
            </div>
            <div class="flex items-center gap-3">
              <span class="font-medium text-white/40 w-14">{{ store.t('lunarLabel') }}:</span>
              <span>{{ store.activeChart.lunarDate }}</span>
            </div>
            <div class="flex items-center gap-3">
              <span class="font-medium text-white/40 w-14">{{ store.t('baziLabel') }}:</span>
              <span class="text-gold font-semibold">{{ store.activeChart.chineseDate }}</span>
            </div>
            <div class="flex items-center gap-3">
              <span class="font-medium text-white/40 w-14">{{ store.t('timeLabel') }}:</span>
              <span>{{ store.activeChart.time }} ({{ store.activeChart.timeRange }})</span>
            </div>
          </div>
        </div>

        <!-- Zodiac Sign and Masters -->
        <div class="border-t border-white/5 pt-4 flex items-center justify-between text-2xs lg:text-xs text-white/50">
          <div>{{ store.t('zodiacLabel') }}: <span class="text-white/80">{{ store.activeChart.zodiac }} ({{ store.activeChart.sign }})</span></div>
          <div>{{ store.t('soulBody') }}: <span class="text-white/80">{{ store.activeChart.soul }} / {{ store.activeChart.body }}</span></div>
        </div>
      </div>
    </div>

    <!-- Context Menu -->
    <Teleport to="body">
      <div 
        v-if="contextMenu.visible" 
        :style="{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }"
        class="fixed z-[100] w-48 bg-space-900/95 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl p-1 overflow-hidden"
        @click.stop
      >
        <div class="px-3 py-2 border-b border-white/5 mb-1">
          <span class="text-xs font-bold text-white/60">
            {{ contextMenu.palace?.name }}
          </span>
        </div>
        <button 
          @click="handleDeepAnalysis"
          class="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-gold hover:bg-gold/10 hover:text-yellow-400 rounded-lg transition"
        >
          <Sparkles class="h-4 w-4" />
          ✨ AI 深度解盘
        </button>
      </div>
    </Teleport>
  </div>

  <!-- Loading / Empty State -->
  <div 
    v-else 
    class="text-center py-20 text-white/30 flex flex-col items-center justify-center gap-3 border border-dashed border-white/5 rounded-3xl bg-space-900/20 max-w-[600px] mx-auto"
  >
    <Compass class="h-16 w-16 text-white/10 animate-pulse-slow" />
    <h3 class="font-medium text-white text-md">{{ store.t('placeholderTitle') }}</h3>
    <p class="text-xs max-w-xs text-white/40 leading-relaxed">
      {{ store.t('placeholderDesc') }}
    </p>
  </div>
  </TooltipProvider>
</template>

<style scoped>
.animate-spin-slow {
  animation: spin 12s linear infinite;
}
.text-3xs {
  font-size: 0.6rem;
}
.text-2xs {
  font-size: 0.7rem;
}
.touch-callout-none {
  -webkit-touch-callout: none;
  user-select: none;
}
</style>
