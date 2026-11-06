import { en } from './en';
import { ko } from './ko';
import type { Content, Lang } from './types';

export const content: Record<Lang, Content> = { en, ko };

export const AVATAR_SRC = '/avatar.svg';

const STORAGE_KEY = 'kyu.lang';

export function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'ko' || saved === 'en') return saved;
  } catch {
    /* storage unavailable */
  }
  const nav = typeof navigator !== 'undefined' ? navigator.language : 'en';
  return nav.toLowerCase().startsWith('ko') ? 'ko' : 'en';
}

export function rememberLang(lang: Lang) {
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    /* storage unavailable */
  }
}
