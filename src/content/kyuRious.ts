import { STUDY_TOPICS } from './kyu-rious.gen';

const topics = Object.values(STUDY_TOPICS);

// Counts the page states about kyu-rious, from the graph.json fetched at build time so they cannot go stale.
// Review cards are not in graph.json; update this number by hand when it changes.
export const KYU_RIOUS = {
  topics: topics.length,
  lessons: topics.reduce((n, t) => n + t.lessons.length, 0),
  reviewCards: 232,
};
