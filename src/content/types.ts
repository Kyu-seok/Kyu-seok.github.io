import type { KeyedStudyTopic } from '../chat/answer';

export type Lang = 'ko' | 'en';

export type Intent = 'me' | 'projects' | 'skills' | 'fun' | 'contact';
export type ChipIntent = Intent;
export type ReplyKind = Intent | 'hello' | 'unknown' | 'how' | 'toolong';

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
    stamp: {
      generated: string; // '{model}' is replaced with the model name
      scripted: string;
      how: string;
    };
  };
  replies: Record<ReplyKind, string[]>;
  me: {
    facts: { label: string; value: string }[];
  };
  projects: Project[];
  skills: {
    groups: SkillGroup[];
  };
  fun: {
    title: string;
    stats: { topics: string; lessons: string; reviewCards: string };
    link: Link;
    coverAlt: string;
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
