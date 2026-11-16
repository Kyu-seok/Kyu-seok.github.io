import type { Lang } from '../content/types';
import type { Resolution } from './answer';

// Who answers a typed question, and in which language. Pinned by route.test.mjs.
//
// The reply follows the question; the UI follows the page (#24). A question with Hangul gets a Korean reply,
// a question with Latin letters an English one, on either page; anything else ("?", an emoji) takes the page's
// language. Only English free text is generated: Korean was generated from 2026-11-08 and reverted on
// 2026-11-12 when real answers stayed below the bar (ADR 0001). HANGUL matches the gateway's hasHangul
// (unicode.Hangul in server/main.go), which refuses Hangul and generates only for lang "en".
// Greetings and "how does this work" stay scripted.
const HANGUL = /\p{Script=Hangul}/u;
const LATIN = /\p{Script=Latin}/u;

export const GENERATED_LANG: Lang = 'en'; // generated() in server/main.go: lang == "en" and no Hangul

export function questionLang(text: string, page: Lang): Lang {
  if (HANGUL.test(text)) return 'ko';
  if (LATIN.test(text)) return 'en';
  return page;
}

export function wantsGeneration(lang: Lang, r: Resolution): boolean {
  return lang === GENERATED_LANG && r.kind !== 'hello' && r.kind !== 'how';
}
