import type { ProjectId, ReplyKind } from '../content/types';

export interface Resolution {
  kind: ReplyKind;
  focus?: ProjectId;
}

interface Rule {
  kind: ReplyKind;
  weight: number;
  keywords: string[];
}

const PROJECT_FOCUS: { id: ProjectId; keywords: string[] }[] = [
  { id: 'codebite', keywords: ['codebite', 'code-bite', 'code bite', '코드바이트', '코드 바이트'] },
  { id: 'kyu-rios', keywords: ['kyu-rios', 'kyurios', 'rios', 'second brain', '세컨드 브레인', '세컨드브레인'] },
  { id: 'vimtext', keywords: ['vimtext', 'vim text', 'vim', '빔텍스트'] },
  { id: 'wedding-ledger', keywords: ['ledger', 'wedding', '축의금', '결혼', '장부'] },
];

const RULES: Rule[] = [
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
