<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { store } from '../store/useStore';
import { User, Calendar, Clock, Plus } from 'lucide-vue-next';

const name = ref('');
const gender = ref<'男' | '女'>('男');
const birthType = ref<'solar' | 'lunar'>('solar');
const isLeapMonth = ref(false);

const birthDateStr = ref('');
const birthHourStr = ref('0');

const errorMessage = ref('');
const successMessage = ref('');
const isSaving = ref(false);

// The 12 earthly branches list for time mapping reference
const hourBranches = [
  { value: '0', label: '子时 (23:00 - 01:00)' },
  { value: '1', label: '丑时 (01:00 - 03:00)' },
  { value: '2', label: '寅时 (03:00 - 05:00)' },
  { value: '3', label: '卯时 (05:00 - 07:00)' },
  { value: '4', label: '辰时 (07:00 - 09:00)' },
  { value: '5', label: '巳时 (09:00 - 11:00)' },
  { value: '6', label: '午时 (11:00 - 13:00)' },
  { value: '7', label: '未时 (13:00 - 15:00)' },
  { value: '8', label: '申时 (15:00 - 17:00)' },
  { value: '9', label: '酉时 (17:00 - 19:00)' },
  { value: '10', label: '戌时 (19:00 - 21:00)' },
  { value: '11', label: '亥时 (21:00 - 23:00)' }
];

async function handleSubmit() {
  errorMessage.value = '';
  successMessage.value = '';

  if (!name.value.trim()) {
    errorMessage.value = store.t('nameRequired');
    return;
  }
  if (!birthDateStr.value) {
    errorMessage.value = store.t('dateRequired');
    return;
  }

  isSaving.value = true;
  try {
    const trimmedName = name.value.trim();
    const existingProfile = store.profiles.find(p => p.name.trim() === trimmedName);
    const profileId = existingProfile ? existingProfile.id : Math.random().toString(36).substring(2, 11);
    const birthDate = `${birthDateStr.value} ${birthHourStr.value.padStart(2, '0')}`;
    
    const profileData = {
      id: profileId,
      name: trimmedName,
      gender: gender.value,
      birth_type: birthType.value,
      is_leap_month: birthType.value === 'lunar' ? isLeapMonth.value : false,
      birth_date: birthDate
    };

    await store.saveProfile(profileData);
    
    const fullProfile = store.profiles.find(p => p.id === profileId);
    if (fullProfile) {
      store.selectProfile(fullProfile);
    }
    
    successMessage.value = store.t('profileCreated');
    
    if (!activeId.value) {
      name.value = '';
      birthDateStr.value = '';
      birthHourStr.value = '0';
      isLeapMonth.value = false;
    }
    
    setTimeout(() => {
      successMessage.value = '';
    }, 2000);
  } catch (e: any) {
    errorMessage.value = e.toString() || (store.lang === 'zh' ? '保存档案失败。' : 'Failed to save profile.');
  } finally {
    isSaving.value = false;
  }
}

const activeId = computed(() => store.activeProfile?.id || null);

watch(() => store.activeProfile, (newProfile) => {
  if (newProfile) {
    name.value = newProfile.name;
    gender.value = newProfile.gender;
    birthType.value = newProfile.birth_type;
    isLeapMonth.value = newProfile.is_leap_month;
    const parts = newProfile.birth_date.split(' ');
    birthDateStr.value = parts[0];
    birthHourStr.value = parseInt(parts[1] || '0', 10).toString();
  } else {
    name.value = '';
    gender.value = '男';
    birthType.value = 'solar';
    isLeapMonth.value = false;
    birthDateStr.value = '';
    birthHourStr.value = '0';
  }
}, { immediate: true });
</script>

<template>
  <div class="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-5 shadow-lg backdrop-blur-md">
    <div class="flex items-center gap-2 mb-4">
      <div class="rounded-lg bg-gold/10 p-1.5 text-gold">
        <Plus class="h-5 w-5" />
      </div>
      <h3 class="font-semibold text-white text-md">{{ store.t('newProfile') }}</h3>
    </div>

    <form @submit.prevent="handleSubmit" class="space-y-4">
      <!-- Name input -->
      <div class="space-y-1">
        <label class="text-xs font-medium text-white/60 block">{{ store.t('name') }}</label>
        <div class="relative flex items-center">
          <User class="absolute left-3 h-4 w-4 text-white/30" />
          <input 
            type="text" 
            v-model="name"
            placeholder="John Doe"
            class="w-full rounded-lg border border-white/10 bg-space-950 py-2 pl-9 pr-4 text-white placeholder-white/30 focus:border-gold/50 focus:ring-1 focus:ring-gold/50 outline-none transition text-sm"
          />
        </div>
      </div>

      <!-- Gender Selector -->
      <div class="space-y-1">
        <label class="text-xs font-medium text-white/60 block">{{ store.t('gender') }}</label>
        <div class="grid grid-cols-2 gap-2">
          <button 
            type="button"
            @click="gender = '男'"
            :class="gender === '男' ? 'border-gold bg-gold/10 text-gold' : 'border-white/10 bg-space-950 text-white/60'"
            class="rounded-lg border py-1.5 text-center text-sm font-medium transition active:scale-95"
          >
            {{ store.t('male') }}
          </button>
          <button 
            type="button"
            @click="gender = '女'"
            :class="gender === '女' ? 'border-gold bg-gold/10 text-gold' : 'border-white/10 bg-space-950 text-white/60'"
            class="rounded-lg border py-1.5 text-center text-sm font-medium transition active:scale-95"
          >
            {{ store.t('female') }}
          </button>
        </div>
      </div>

      <!-- Calendar type -->
      <div class="space-y-1">
        <label class="text-xs font-medium text-white/60 block">{{ store.t('calendarType') }}</label>
        <div class="grid grid-cols-2 gap-2">
          <button 
            type="button"
            @click="birthType = 'solar'"
            :class="birthType === 'solar' ? 'border-gold bg-gold/10 text-gold' : 'border-white/10 bg-space-950 text-white/60'"
            class="rounded-lg border py-1.5 text-center text-sm font-medium transition active:scale-95"
          >
            {{ store.t('solar') }}
          </button>
          <button 
            type="button"
            @click="birthType = 'lunar'"
            :class="birthType === 'lunar' ? 'border-gold bg-gold/10 text-gold' : 'border-white/10 bg-space-950 text-white/60'"
            class="rounded-lg border py-1.5 text-center text-sm font-medium transition active:scale-95"
          >
            {{ store.t('lunar') }}
          </button>
        </div>
      </div>

      <!-- Leap month toggle for Lunar calendar -->
      <div v-if="birthType === 'lunar'" class="flex items-center gap-2 py-1 select-none animate-fade-in">
        <input 
          type="checkbox" 
          id="isLeap" 
          v-model="isLeapMonth"
          class="rounded border-white/20 bg-space-950 text-gold focus:ring-0 focus:ring-offset-0 h-4 w-4 cursor-pointer"
        />
        <label for="isLeap" class="text-xs text-white/70 cursor-pointer">
          {{ store.t('isLeapMonth') }}
        </label>
      </div>

      <!-- Birth Date Selector -->
      <div class="space-y-1">
        <label class="text-xs font-medium text-white/60 block">{{ store.t('birthDate') }}</label>
        <div class="relative flex items-center">
          <Calendar class="absolute left-3 h-4 w-4 text-white/30" />
          <input 
            type="date" 
            v-model="birthDateStr"
            class="w-full rounded-lg border border-white/10 bg-space-950 py-2 pl-9 pr-4 text-white focus:border-gold/50 focus:ring-1 focus:ring-gold/50 outline-none transition text-sm cursor-pointer"
          />
        </div>
      </div>

      <!-- Birth Hour Branch Selector -->
      <div class="space-y-1">
        <label class="text-xs font-medium text-white/60 block">{{ store.t('birthTime') }}</label>
        <div class="relative flex items-center">
          <Clock class="absolute left-3 h-4 w-4 text-white/30" />
          <select 
            v-model="birthHourStr"
            class="w-full rounded-lg border border-white/10 bg-space-950 py-2 pl-9 pr-4 text-white outline-none focus:border-gold/50 transition text-sm cursor-pointer"
          >
            <option v-for="hb in hourBranches" :key="hb.value" :value="hb.value">
              {{ hb.label }}
            </option>
          </select>
        </div>
      </div>

      <!-- Feedback messages -->
      <div v-if="errorMessage" class="text-xs text-red-400 bg-red-950/20 border border-red-500/10 rounded px-3 py-1.5">
        {{ errorMessage }}
      </div>
      <div v-if="successMessage" class="text-xs text-emerald-400 bg-emerald-950/20 border border-emerald-500/10 rounded px-3 py-1.5">
        {{ successMessage }}
      </div>

      <!-- Submit button -->
      <button 
        type="submit"
        :disabled="isSaving"
        class="w-full rounded-lg bg-gradient-to-r from-gold/70 to-gold hover:from-gold hover:to-gold-dark text-space-950 py-2 font-bold text-sm transition active:scale-95 disabled:opacity-50"
      >
        {{ isSaving ? store.t('saving') : store.t('calculateSave') }}
      </button>
    </form>
  </div>
</template>
