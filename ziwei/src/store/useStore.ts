import { reactive } from 'vue';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { astro } from 'iztro';
import { extractChartSummary } from '../utils/iztroPruner';

export interface Profile {
  id: string;
  name: string;
  gender: '男' | '女';
  birth_type: 'solar' | 'lunar';
  is_leap_month: boolean;
  birth_date: string; // YYYY-MM-DD HH
  created_at: string;
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AppSettings {
  apiKey: string;
  model: string;
  lang?: 'zh' | 'en';
}

const translations = {
  zh: {
    title: '紫微斗数 AI 分析仪',
    subtitle: '紫微斗数智能命盘分析',
    activeChart: '当前命盘',
    settings: '设置',
    settingsTitle: '设置 & API',
    apiKey: 'OpenRouter API 密钥',
    apiKeyDesc: 'API 密钥储存在本地，并通过 Rust 后端进行安全请求。',
    aiModel: 'AI 模型',
    saveSettings: '保存设置',
    saving: '保存中...',
    settingsSaved: '设置保存成功！',
    newProfile: '新建排盘档案',
    name: '姓名',
    gender: '性别',
    male: '男',
    female: '女',
    calendarType: '历法类型',
    solar: '阳历',
    lunar: '农历',
    isLeapMonth: '是否闰月',
    birthDate: '出生日期',
    birthTime: '出生时辰',
    nameRequired: '请输入姓名。',
    dateRequired: '请选择出生日期。',
    profileCreated: '档案已保存并载入！',
    calculateSave: '排盘并保存',
    profilesArchive: '档案库',
    searchProfiles: '搜索档案...',
    noProfiles: '未找到档案',
    deleteConfirm: '您确定要删除此档案吗？',
    astrolabeChart: '紫微斗数命盘',
    interactiveGrid: '交互式星盘',
    genderLabel: '性别',
    zodiacLabel: '生肖',
    solarLabel: '阳历',
    lunarLabel: '农历',
    baziLabel: '八字',
    timeLabel: '时辰',
    soulBody: '命主 / 身主',
    placeholderTitle: '命盘解析器',
    placeholderDesc: '请在左侧新建排盘或从档案库载入，以生成传统的十二宫紫微斗数命盘。',
    aiOracle: 'AI 命理分析师',
    aiPowered: '由 OpenRouter AI 提供支持',
    clearHistory: '清除对话记录',
    aiWelcome: '您好！我是您的 AI 命理分析师。我可以为您深度解析紫微命盘，并提供关于人生格局、流年运势及人际关系的指引。',
    aiWelcomeTip: '点击下方的预设分析按钮，或直接在输入框中提问开始解析。',
    consulting: '正在推演命理...',
    askPlaceholder: '输入您的问题，向 AI 命理分析师提问...',
    presetDestiny: '分析命宫格局',
    presetCareer: '分析十年大限运势',
    presetRelations: '分析感情与婚姻',
  },
  en: {
    title: 'ZiWei AI Analyzer',
    subtitle: 'Purple Star Astrology Oracle',
    activeChart: 'Active Chart',
    settings: 'Settings',
    settingsTitle: 'Settings & API',
    apiKey: 'OpenRouter API Key',
    apiKeyDesc: 'API key is stored locally on your device and sent securely through the Rust backend.',
    aiModel: 'AI Model',
    saveSettings: 'Save Settings',
    saving: 'Saving...',
    settingsSaved: 'Settings saved successfully!',
    newProfile: 'New Astrology Profile',
    name: 'Full Name',
    gender: 'Gender',
    male: 'Male',
    female: 'Female',
    calendarType: 'Calendar Type',
    solar: 'Solar',
    lunar: 'Lunar',
    isLeapMonth: 'Is Birth Month Leap',
    birthDate: 'Birth Date',
    birthTime: 'Birth Time',
    nameRequired: 'Please enter a name.',
    dateRequired: 'Please select a birth date.',
    profileCreated: 'Profile created & loaded!',
    calculateSave: 'Calculate & Save',
    profilesArchive: 'Profiles Archive',
    searchProfiles: 'Search profiles...',
    noProfiles: 'No profiles found',
    deleteConfirm: 'Are you sure you want to delete this profile?',
    astrolabeChart: 'Astrolabe Chart',
    interactiveGrid: 'Interactive Grid',
    genderLabel: 'Gender',
    zodiacLabel: 'Zodiac',
    solarLabel: 'Solar',
    lunarLabel: 'Lunar',
    baziLabel: 'Ba Zi',
    timeLabel: 'Time',
    soulBody: 'Soul / Body',
    placeholderTitle: 'Astrolabe Visualizer',
    placeholderDesc: 'Please create a new profile or load one from the archive to generate the traditional 12-Palace Purple Star chart.',
    aiOracle: 'AI Astrologer Oracle',
    aiPowered: 'Powered by OpenRouter AI',
    clearHistory: 'Clear conversation',
    aiWelcome: 'Hello! I can read your calculated chart and provide insights on your life path, career cycles, and relationship compatibility.',
    aiWelcomeTip: 'Click one of the prompt chips below to begin your analysis.',
    consulting: 'Consulting the Oracle...',
    askPlaceholder: 'Ask follow-up questions to the Oracle...',
    presetDestiny: 'Analyze Destiny Palace',
    presetCareer: 'Career & Wealth',
    presetRelations: 'Relationships & Marriage',
  }
};

export const store = reactive({
  lang: 'zh' as 'zh' | 'en',
  
  settings: {
    apiKey: '',
    model: 'google/gemini-2.5-flash',
  } as AppSettings,
  
  profiles: [] as Profile[],
  activeProfile: null as Profile | null,
  activeChart: null as any | null,
  
  chatHistory: [] as ChatMessage[],
  isAiLoading: false,
  aiStreamingText: '',
  aiError: '',

  // Translation helper
  t(key: keyof typeof translations.zh): string {
    const dict = translations[this.lang] || translations.zh;
    return dict[key] || translations.zh[key] || String(key);
  },

  // Language selection action
  setLanguage(newLang: 'zh' | 'en') {
    this.lang = newLang;
    // Save settings back with lang
    this.saveSettings(this.settings.apiKey, this.settings.model);
    
    // Recompute active chart if one is loaded
    if (this.activeProfile) {
      this.selectProfile(this.activeProfile);
    }
  },

  // Initialize and load everything
  async init() {
    await this.loadSettings();
    await this.loadProfiles();
    this.setupEventListener();
  },

  // Settings
  async loadSettings() {
    try {
      const data = await invoke<AppSettings>('load_settings');
      this.settings.apiKey = data.apiKey || '';
      this.settings.model = data.model || 'google/gemini-2.5-flash';
      if (data.lang === 'en' || data.lang === 'zh') {
        this.lang = data.lang;
      }
    } catch (e) {
      console.error('Failed to load settings:', e);
    }
  },

  async saveSettings(apiKey: string, model: string) {
    try {
      this.settings.apiKey = apiKey;
      this.settings.model = model;
      await invoke('save_settings', { 
        settings: { 
          apiKey, 
          model,
          lang: this.lang
        } 
      });
    } catch (e) {
      console.error('Failed to save settings:', e);
      throw e;
    }
  },

  // Profiles (SQLite)
  async loadProfiles() {
    try {
      this.profiles = await invoke<Profile[]>('get_profiles');
    } catch (e) {
      console.error('Failed to load profiles:', e);
    }
  },

  async saveProfile(profile: Omit<Profile, 'created_at'>) {
    try {
      const fullProfile: Profile = {
        ...profile,
        created_at: new Date().toISOString()
      };
      await invoke('save_profile', { profile: fullProfile });
      await this.loadProfiles();
      // If saving the active profile, update it
      if (this.activeProfile?.id === profile.id) {
        this.activeProfile = fullProfile;
      }
    } catch (e) {
      console.error('Failed to save profile:', e);
      throw e;
    }
  },

  async deleteProfile(id: string) {
    try {
      await invoke('delete_profile', { id });
      await this.loadProfiles();
      if (this.activeProfile?.id === id) {
        this.activeProfile = null;
        this.activeChart = null;
        this.chatHistory = [];
      }
    } catch (e) {
      console.error('Failed to delete profile:', e);
      throw e;
    }
  },

  // Chart calculation
  selectProfile(profile: Profile) {
    this.activeProfile = profile;
    this.chatHistory = [];
    this.aiStreamingText = '';
    this.aiError = '';
    
    try {
      // Date: YYYY-MM-DD, Hour: HH
      const parts = profile.birth_date.split(' ');
      const dateStr = parts[0]; // YYYY-MM-DD
      const hourStr = parts[1] || '00';
      const hourNum = parseInt(hourStr, 10);
      
      const genderStr = profile.gender;
      const targetLang = this.lang === 'en' ? 'en-US' : 'zh-CN';
      
      if (profile.birth_type === 'solar') {
        this.activeChart = astro.bySolar(
          dateStr,
          hourNum,
          genderStr,
          true,
          targetLang
        );
      } else {
        this.activeChart = astro.byLunar(
          dateStr,
          hourNum,
          genderStr,
          profile.is_leap_month,
          true,
          targetLang
        );
      }
    } catch (e) {
      console.error('Failed to calculate chart:', e);
      this.activeChart = null;
    }
  },

  // AI Streaming Listener
  setupEventListener() {
    listen<string>('ai-response-chunk', (event) => {
      this.aiStreamingText += event.payload;
    });
  },

  // AI Chat Request
  async askAi(userPrompt: string) {
    if (!this.activeChart) {
      this.aiError = this.lang === 'zh' ? '请先计算或载入命盘。' : 'Please calculate or load a profile first.';
      return;
    }
    if (!this.settings.apiKey) {
      this.aiError = this.lang === 'zh' ? '请先在设置中配置 API 密钥。' : 'Please configure your OpenRouter API Key in Settings first.';
      return;
    }

    this.isAiLoading = true;
    this.aiError = '';
    this.aiStreamingText = '';

    // Generate Chart summary
    const summary = extractChartSummary(this.activeChart);

    // Context System prompt
    const systemPromptZh = `你是一位精通紫微斗数的AI命理大师。
请分析上下文中提供的用户紫微斗数命盘摘要。
解释专业名词，并基于星盘细节提供关于命运格局、性格、财富、事业、家庭及婚姻感情的深刻见解。
不要捏造或幻想星曜或命理配置，保持见解专业、客气、客观，使用清晰精美的Markdown格式输出。
请务必使用中文（简体）进行回复。

用户紫微命盘上下文：
\`\`\`markdown
${summary}
\`\`\`
`;

    const systemPromptEn = `You are "The AI Oracle" (紫微斗数AI分析师), an expert in Zi Wei Dou Shu (Purple Star Astrology).
You will analyze the user's astrological chart summary provided in the context.
Always explain terms clearly. Provide insights on destiny, strengths, weaknesses, wealth, career, and relationships based strictly on the chart details.
Never make up stars or configurations that are not in the context. Keep your response insightful, encouraging, and structured in clean Markdown.
Please respond in English.

Here is the user's Zi Wei Dou Shu chart context:
\`\`\`markdown
${summary}
\`\`\`
`;

    const systemPrompt = this.lang === 'zh' ? systemPromptZh : systemPromptEn;

    // Construct history: limit to last 5 turns of conversation
    const newUserMessage: ChatMessage = { role: 'user', content: userPrompt };
    const recentHistory = this.chatHistory.slice(-10); // 10 messages = 5 turns
    
    const messagesToSend = [
      { role: 'system', content: systemPrompt } as ChatMessage,
      ...recentHistory,
      newUserMessage
    ];

    try {
      this.chatHistory.push(newUserMessage);
      
      // Call Rust backend async command
      await invoke('ask_ai', { messages: messagesToSend });
      
      if (this.aiStreamingText) {
        this.chatHistory.push({
          role: 'assistant',
          content: this.aiStreamingText
        });
      }
    } catch (e: any) {
      console.error('AI Request failed:', e);
      this.aiError = e.toString() || 'Failed to get response from AI.';
    } finally {
      this.isAiLoading = false;
    }
  },

  clearChat() {
    this.chatHistory = [];
    this.aiStreamingText = '';
    this.aiError = '';
  }
});
