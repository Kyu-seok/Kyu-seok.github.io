import type { ProjectId, ReplyKind } from '../content/types';
import type { StudyTopicSlug } from '../content/kyu-rious.gen';

export interface Resolution {
  kind: ReplyKind;
  focus?: ProjectId;
}

// Study topics a free-text question can touch, for the notes card. Keywords are specific to the subject and
// never describe this chat (no bare "ai", "llm", "model", "prompt", "agent", "qwen"): "show me your prompt"
// must not get the Prompt Engineering lesson. Hangul keywords match as substrings, so none may sit inside a
// word another intent owns ("깃" would fire on "깃허브"). A slug missing from kyu-rious's graph.json fails
// tsc; a study topic with no entry here is simply never matched.
export const STUDY_TOPIC_KEYWORDS = {
  'agent-orchestration': ['agent orchestration', 'orchestration', 'orchestrate', 'multi-agent', 'multi agent', 'multiagent', 'harness engineering', 'context engineering', 'agent harness', 'agent loop', 'workflows vs agents', '오케스트레이션', '멀티 에이전트', '멀티에이전트', '하네스', '컨텍스트 엔지니어링'],
  'ai-engineering-101': ['ai engineering', 'chip huyen', 'rag', 'retrieval-augmented', 'retrieval augmented', 'fine-tuning', 'fine tuning', 'finetuning', 'finetune', 'prompt engineering', 'prompt injection', 'foundation model', 'foundation models', 'evals', 'llm evaluation', 'ai 엔지니어링', 'ai엔지니어링', '칩 후옌', '파인튜닝', '파인 튜닝', '미세조정', '프롬프트 엔지니어링', '프롬프트 인젝션', '검색 증강', '파운데이션 모델'],
  'git-workflow': ['git', 'git workflow', 'github flow', 'pull request', 'pull requests', 'merge conflict', 'merge conflicts', 'rebase', 'branching', 'rulesets', 'code review', '깃 워크플로', '풀 리퀘스트', '풀리퀘스트', '머지 충돌', '병합 충돌', '컨플릭트', '리베이스', '브랜치', '코드 리뷰'],
  kafka: ['kafka', 'ccdak', 'partition', 'partitions', 'consumer group', 'consumer groups', 'event streaming', '카프카', '파티션', '컨슈머 그룹', '컨슈머그룹'],
  'matt-pocock-skills': ['matt pocock', 'pocock', 'grilling', 'grill me', 'spec to tickets', 'agent skills', 'claude code skills', '맷 포칵', '매트 포칵', '포칵', '그릴링'],
} satisfies Partial<Record<StudyTopicSlug, string[]>>;

export type KeyedStudyTopic = keyof typeof STUDY_TOPIC_KEYWORDS;

interface Rule {
  kind: ReplyKind;
  weight: number;
  keywords: string[];
}

const PROJECT_FOCUS: { id: ProjectId; keywords: string[] }[] = [
  { id: 'codebite', keywords: ['codebite', 'code-bite', 'code bite', '코드바이트', '코드 바이트'] },
  { id: 'kyu-rious', keywords: ['kyu-rious', 'kyurious', 'kyu rious', '큐리어스', 'second brain', '세컨드 브레인', '세컨드브레인'] },
  { id: 'vimtext', keywords: ['vimtext', 'vim text', 'vim', '빔텍스트'] },
  { id: 'wedding-ledger', keywords: ['ledger', 'wedding', '축의금', '결혼', '장부'] },
];

const RULES: Rule[] = [
  {
    kind: 'how',
    weight: 6,
    keywords: ['how does this work', 'how does this chat work', 'how do you work', 'how are you built', 'is this ai', 'are you ai', 'are you an ai', 'are you a bot', 'chatgpt', 'llm', 'qwen', 'generated', 'scripted', '어떻게 동작', '어떻게 작동', '어떻게 만들', 'ai야', 'ai예요', 'ai인가', '인공지능', '봇이야', '봇인가', '대본'],
  },
  {
    kind: 'contact',
    weight: 5,
    keywords: ['contact', 'email', 'e-mail', 'mail', 'reach', 'linkedin', 'github', 'hire', 'hiring', 'resume', 'cv', 'talk', '연락', '이메일', '메일', '링크드인', '깃허브', '채용', '이력서', '연락처', '얘기'],
  },
  {
    kind: 'skills',
    weight: 4,
    keywords: ['skill', 'skills', 'stack', 'tech', 'technology', 'technologies', 'language', 'languages', 'tool', 'tools', 'work with', 'java', 'spring', 'kafka', 'redis', 'postgres', 'postgresql', 'docker', 'nginx', 'grafana', 'database', '기술', '스택', '언어', '스킬', '도구', '잘하', '사용하', '쓰는', '쓰시', '데이터베이스'],
  },
  {
    kind: 'fun',
    weight: 4,
    keywords: ['fun', 'hobby', 'hobbies', 'outside', 'free time', 'learn', 'learning', 'study', 'studying', 'read', 'reading', 'book', 'books', 'note', 'notes', 'brain', '취미', '재미', '공부', '배우', '독서', '책', '노트', '여가', '일 말고'],
  },
  {
    kind: 'projects',
    weight: 3,
    keywords: ['project', 'projects', 'work', 'working on', 'built', 'build', 'building', 'made', 'make', 'portfolio', 'product', 'products', 'app', 'apps', '프로젝트', '만든', '만들', '작업', '포트폴리오', '서비스', '뭐 하', '무엇을 하'],
  },
  {
    kind: 'me',
    weight: 2,
    keywords: ['who', 'about you', 'yourself', 'introduce', 'intro', 'background', 'kyu', 'kyuseok', 'kyu-seok', 'seoul', 'where are you', 'where do you', 'engineer', 'developer', '규석', '누구', '소개', '자기', '본인', '어떤 사람', '어디', '당신', '너는', '너의', '개발자', '엔지니어'],
  },
  {
    kind: 'hello',
    weight: 1,
    keywords: ['hi', 'hello', 'hey', 'yo', 'sup', 'good morning', 'good evening', 'thanks', 'thank you', '안녕', '하이', '헬로', '반가', '고마', '감사'],
  },
];

function normalize(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

// ASCII keywords match on word boundaries so "hi" never fires on "which" and "you" never fires on "your".
// Hangul has no \b semantics in JS, so Korean keywords match as substrings.
function matches(q: string, keyword: string): boolean {
  if (/^[\x20-\x7e]+$/.test(keyword)) {
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`).test(q);
  }
  return q.includes(keyword);
}

// The study topic with the most keyword hits, or none. Ties go to the first in STUDY_TOPIC_KEYWORDS.
// Separate from resolve(): it never changes the intent, only adds a notes card.
export function studyTopic(text: string): KeyedStudyTopic | undefined {
  const q = normalize(text);
  let best: { slug: KeyedStudyTopic; hits: number } | undefined;
  for (const [slug, keywords] of Object.entries(STUDY_TOPIC_KEYWORDS) as [KeyedStudyTopic, string[]][]) {
    const hits = keywords.filter((k) => matches(q, k)).length;
    if (hits > 0 && (!best || hits > best.hits)) best = { slug, hits };
  }
  return best?.slug;
}

export function resolve(text: string): Resolution {
  const q = normalize(text);
  if (!q) return { kind: 'hello' };

  const focus = PROJECT_FOCUS.find((p) => p.keywords.some((k) => matches(q, k)))?.id;
  if (focus) return { kind: 'projects', focus };

  let best: { kind: ReplyKind; score: number } | null = null;
  for (const rule of RULES) {
    const hits = rule.keywords.filter((k) => matches(q, k)).length;
    if (hits === 0) continue;
    const score = hits * 10 + rule.weight;
    if (!best || score > best.score) best = { kind: rule.kind, score };
  }
  if (best) return { kind: best.kind };

  return { kind: 'unknown' };
}
