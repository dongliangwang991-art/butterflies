export enum MemoryType {
  REAL = 'REAL',
  DREAM = 'DREAM'
}

export interface MemoryVisuals {
  customColor?: string;
  auraIntensity?: number; // 0 to 2
  scale?: number;
  distortion?: number; // For "glitch" or "wavy" effects
}

export interface Memory {
  id: string;
  content: string;
  type: MemoryType;
  timestamp: number;
  emotion: number; // 0 (Sad/Dark) to 1 (Happy/Bright)
  keywords: string[];
  position: [number, number, number]; // [x, y, z]
  visuals?: MemoryVisuals;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'aurelia';
  text: string;
  timestamp: number;
}

export enum AppMode {
  EXPLORE = 'EXPLORE',
  ADD_MEMORY = 'ADD_MEMORY',
  CHAT = 'CHAT',
  VIEW_MEMORY = 'VIEW_MEMORY',
  SEARCH = 'SEARCH',
  DIARY = 'DIARY' // Aurelia's Diary
}

export interface ProcessedMemoryResult {
  type: MemoryType;
  emotion: number;
  summary: string;
  keywords: string[];
}

export interface AtmosphereState {
  fogColor: string;
  fogDensity: number;
  ambientLightColor: string;
  bloomStrength: number;
}

export interface SculptResult {
  visuals: MemoryVisuals;
  poeticResponse: string;
}

export interface AtmosphereResult {
  atmosphere: AtmosphereState;
  poeticResponse: string;
}

// --- NEW TYPES FOR LIVING WORLD ---

export enum HolidayMode {
  NONE = 'NONE',
  BIRTHDAY = 'BIRTHDAY', // "Candlelight"
  WINTER_SOLSTICE = 'WINTER_SOLSTICE', // "Polar Night"
  NEW_YEAR = 'NEW_YEAR' // "Fireworks"
}

export enum AureliaSkin {
  DEFAULT = 'DEFAULT', // Crystal/Mirror
  STARLIGHT = 'STARLIGHT', // Glittering particles
  NATURE = 'NATURE' // Vines/Flowers
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string; // Lucid icon name
  unlocked: boolean;
  reward?: string; // Description of reward
  skinUnlock?: AureliaSkin;
}

export interface UserStats {
  dreamsRecorded: number;
  realMemoriesRecorded: number;
  totalMemories: number;
  deepDives: number; // Low emotion memories visited
  searchCount: number;
}

export interface DiaryEntry {
  id: string;
  date: string;
  title: string;
  content: string;
  isUnlocked: boolean; // Only show if specific conditions met
}