<script setup lang="ts">
import { ref, computed } from 'vue';
import { store, Profile } from '../store/useStore';
import { Search, FolderOpen, Trash2, Calendar, UserCheck } from 'lucide-vue-next';

const searchQuery = ref('');

const filteredProfiles = computed(() => {
  const query = searchQuery.value.trim().toLowerCase();
  if (!query) return store.profiles;
  return store.profiles.filter(
    p => p.name.toLowerCase().includes(query) || p.birth_date.includes(query)
  );
});

function handleLoad(profile: Profile) {
  store.selectProfile(profile);
}

async function handleDelete(id: string) {
  if (confirm(store.t('deleteConfirm'))) {
    try {
      await store.deleteProfile(id);
    } catch (e) {
      console.error(e);
    }
  }
}

function formatBirthDetails(profile: Profile) {
  const parts = profile.birth_date.split(' ');
  const date = parts[0];
  const hourIndex = parseInt(parts[1] || '0', 10);
  
  // Earthly branch mapping for display
  const branches = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];
  const branchesEn = ['Zi', 'Chou', 'Yin', 'Mao', 'Chen', 'Si', 'Wu', 'Wei', 'Shen', 'You', 'Xu', 'Hai'];
  
  const isZh = store.lang === 'zh';
  const branchName = isZh ? branches[hourIndex] : branchesEn[hourIndex];
  
  const typeStr = profile.birth_type === 'solar' ? store.t('solar') : store.t('lunar');
  const leapStr = profile.is_leap_month ? (isZh ? '(闰)' : '(Leap)') : '';
  const timeSuffix = isZh ? '时' : ' Hour';
  
  return `${typeStr}${leapStr} ${date} ${branchName}${timeSuffix}`;
}
</script>

<template>
  <div class="rounded-2xl border border-white/5 bg-space-900/60 p-5 shadow-lg backdrop-blur-md flex flex-col h-full">
    <!-- Header -->
    <div class="flex items-center gap-2 mb-4">
      <div class="rounded-lg bg-gold/10 p-1.5 text-gold">
        <FolderOpen class="h-5 w-5" />
      </div>
      <h3 class="font-semibold text-white text-md">{{ store.t('profilesArchive') }}</h3>
    </div>

    <!-- Search Input -->
    <div class="relative flex items-center mb-4">
      <Search class="absolute left-3 h-4 w-4 text-white/30" />
      <input 
        type="text" 
        v-model="searchQuery"
        :placeholder="store.t('searchProfiles')"
        class="w-full rounded-lg border border-white/10 bg-space-950 py-1.5 pl-9 pr-4 text-white placeholder-white/30 focus:border-gold/50 focus:ring-1 focus:ring-gold/50 outline-none transition text-sm"
      />
    </div>

    <!-- Profiles List -->
    <div class="flex-1 overflow-y-auto space-y-2 max-h-[300px] pr-1 custom-scrollbar">
      <div 
        v-for="p in filteredProfiles" 
        :key="p.id"
        :class="store.activeProfile?.id === p.id ? 'border-gold bg-gold/5' : 'border-white/5 bg-space-950/40 hover:bg-space-950/80'"
        class="group flex items-center justify-between rounded-xl border p-3 transition"
      >
        <!-- Profile info click block -->
        <button 
          @click="handleLoad(p)"
          class="flex-1 text-left flex items-start gap-3 outline-none"
        >
          <!-- Gender badge -->
          <span 
            :class="p.gender === '男' ? 'bg-sky-500/10 text-sky-400 border-sky-500/20' : 'bg-pink-500/10 text-pink-400 border-pink-500/20'"
            class="mt-0.5 rounded-full border px-2 py-0.5 text-2xs font-semibold uppercase tracking-wider scale-90"
          >
            {{ p.gender === '男' ? store.t('male') : store.t('female') }}
          </span>

          <div class="space-y-0.5">
            <div class="flex items-center gap-1.5">
              <span class="font-medium text-white text-sm block group-hover:text-gold transition">
                {{ p.name }}
              </span>
              <UserCheck v-if="store.activeProfile?.id === p.id" class="h-3.5 w-3.5 text-gold" />
            </div>
            <div class="flex items-center gap-1 text-2xs text-white/40">
              <Calendar class="h-3 w-3 shrink-0" />
              <span>{{ formatBirthDetails(p) }}</span>
            </div>
          </div>
        </button>

        <!-- Delete button -->
        <button 
          @click="handleDelete(p.id)"
          class="rounded-lg p-1.5 text-white/40 hover:bg-red-500/10 hover:text-red-400 transition"
          title="Delete profile"
        >
          <Trash2 class="h-4 w-4" />
        </button>
      </div>

      <!-- Empty State -->
      <div 
        v-if="filteredProfiles.length === 0" 
        class="text-center py-8 text-white/30 text-sm flex flex-col items-center justify-center gap-2 border border-dashed border-white/5 rounded-xl"
      >
        <FolderOpen class="h-8 w-8 text-white/10" />
        <span>{{ store.t('noProfiles') }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.text-2xs {
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
