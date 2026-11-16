import type { KeyedStudyTopic } from '../chat/answer';

export type Lang = 'ko' | 'en';

export type Intent = 'me' | 'projects' | 'skills' | 'fun' | 'contact';
export type ChipIntent = Intent;
export type ReplyKind = Intent | 'hello' | 'unknown' | 'how';

export type ProjectId = 'codebite' | 'kyu-rious' | 'vimtext' | 'wedding-ledger';

export interface Link {
  label: string;
  href: string;
}

export interface Project {
  id: ProjectId;
  name: string;
  tagline: string;
  description: string[];
  stack: string[];
  links: Link[];
  cover: string;
  coverAlt: string;
  status: string;
}

export interface SkillGroup {
  label: string;
  items: string[];
}

export interface ContactItem {
  kind: 'email' | 'github' | 'linkedin' | 'site';
  label: string;
  value: string;
  href: string;
}

export interface Content {
  lang: Lang;
  ui: {
    wordmark: string;
    greeting: string;
    title: string;
    placeholder: string;
    send: string;
    chips: Record<Intent, string>;
    chipQuestions: Record<Intent, string>;
    toggleLabel: string;
    thinking: string;
    scriptedNote: string;
    suggestionsLead: string;
    prev: string;
    next: string;
    open: string;
    more: string;
    less: string;
    lessons: string;
    refs: string;
    you: string;
    assistantName: string;
    avatarAlt: string;
    newChat: string;
    howQuestion: string;
    /** Above a scripted reply shown because the model did not answer in time. In the page's language. */
    modelMissed: string;
    stamp: {
      generated: string; // '{model}' is replaced with the model name
      scripted: string;
      how: string;
    };
  };
  replies: Record<ReplyKind, string[]>;
  /** Shown in the miss reply: one English question that, tapped, is sent as-is and answered by the model.
   *  Korean only; English questions already reach the model. */
  askInEnglish: { lead: string; question: string } | null;
  me: {
    facts: { label: string; value: string }[];
  };
  projects: Project[];
  skills: {
    groups: SkillGroup[];
  };
  /** The Fun card: the N100 mini PC at home, drawn by scripts/n100/build.mjs. Part labels are facts from
   *  server/facts.en.md and server/spike/RESULTS.md. */
  fun: {
    title: string;
    alt: string;
    parts: { cpu: string; ram: string; ssd: string };
    hint: string;
  };
  contact: {
    items: ContactItem[];
  };
  notes: {
    label: string;
    showAll: string; // '{n}' is replaced with the lesson count
    showFewer: string;
    // English reads each study topic's title and summary from kyu-rious's graph.json. Korean writes them
    // here, and tsc fails if a study topic with keywords has none.
    topics: 'from-graph' | Record<KeyedStudyTopic, { title: string; summary: string }>;
  };
}
