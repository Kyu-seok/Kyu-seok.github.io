import { STUDY_TOPICS, type StudyTopicSlug } from './kyu-rious.gen';

const topics = Object.values(STUDY_TOPICS);

// Counts the page states about kyu-rious, from the graph.json fetched at build time so they cannot go stale.
// Review cards are not in graph.json; update this number by hand when it changes.
export const KYU_RIOUS = {
  topics: topics.length,
  lessons: topics.reduce((n, t) => n + t.lessons.length, 0),
  reviewCards: 232,
};

// Dot colors on the Fun card, matching the kyu-rious graph. A new study topic falls back to a neutral dot.
export const STUDY_TOPIC_COLORS: Partial<Record<StudyTopicSlug, string>> = {
  'agent-orchestration': '#2563eb',
  'ai-engineering-101': '#ea6a12',
  'git-workflow': '#0f9d58',
  kafka: '#dc2626',
  'matt-pocock-skills': '#7c3aed',
};
