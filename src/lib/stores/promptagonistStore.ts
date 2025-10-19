// lib/stores/promptagonistStore.ts
import { writable } from 'svelte/store';

export interface StoryScenario {
  id: string;
  title: string;
  description: string;
  initialContext: string;
  genre: string;
  isCustom?: boolean;
}

export const currentScenario = writable<StoryScenario | null>(null);
export const showScenarioSelection = writable(true);
export const showCustomForm = writable(false);
