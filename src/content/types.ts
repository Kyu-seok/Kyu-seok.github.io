export type Lang = 'ko' | 'en';

export type Intent = 'me' | 'projects' | 'skills' | 'fun' | 'contact';
export type ChipIntent = Intent;
export type ReplyKind = Intent | 'hello' | 'unknown';

export type ProjectId = 'codebite' | 'kyu-rios' | 'vimtext' | 'wedding-ledger';

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

export interface Topic {
  name: string;
  lessons: number;
  refs: number;
  color: string;
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
    stats: { label: string; value: string }[];
    topics: Topic[];
    link: Link;
    coverAlt: string;
  };
  contact: {
    items: ContactItem[];
  };
}
