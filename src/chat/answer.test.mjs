// The keyword matcher decides the card for every typed question. These pin what real visitor questions get,
// in both languages. Run: npm test (node's built-in runner; types are stripped, nothing is installed).
// Chip presses never reach resolve(): they carry their intent.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolve, studyTopic } from './answer.ts';

const CASES = [
  // [question, kind, focus]
  ['who are you?', 'me'],
  ['tell me about yourself', 'me'],
  ['어떤 사람인가요?', 'me'],
  ['what have you built?', 'projects'],
  ['프로젝트 보여주세요', 'projects'],
  ['tell me about codebite', 'projects', 'codebite'],
  ['코드바이트가 뭐예요?', 'projects', 'codebite'],
  ['what is vimtext', 'projects', 'vimtext'],
  ['축의금 장부는 뭐예요?', 'projects', 'wedding-ledger'],
  ['what tech stack do you use?', 'skills'],
  ['어떤 기술을 쓰나요?', 'skills'],
  // Fun is the home server (2026-11-16); studying and notes are kyu-rious's project card
  ['what do you do for fun?', 'fun'],
  ['any hobbies?', 'fun'],
  ['tell me about your home server', 'fun'],
  ['what is your mini pc?', 'fun'],
  ['취미가 뭐예요?', 'fun'],
  ['홈서버 얘기 해 주세요', 'fun'],
  ['what are you studying lately?', 'projects', 'kyu-rious'],
  ['do you take notes?', 'projects', 'kyu-rious'],
  ['what books are you reading?', 'projects', 'kyu-rious'],
  ['요즘 무슨 공부 해요?', 'projects', 'kyu-rious'],
  ['tell me about your second brain', 'projects', 'kyu-rious'],
  ['how can I contact you?', 'contact'],
  ['이메일 주소 알려주세요', 'contact'],
  // Asking to talk is contact: one case per phrase keyword
  ["let's talk", 'contact'],
  ['let’s talk', 'contact'],
  ["I'd like to talk to you about a role", 'contact'],
  ['can I talk to Kyu?', 'contact'],
  ['could I talk with you?', 'contact'],
  ['can we talk?', 'contact'],
  ['could we talk?', 'contact'],
  ['I want to talk', 'contact'],
  ['I would love to talk', 'contact'],
  ['we should talk', 'contact'],
  ['얘기 나눠요', 'contact'],
  ['이야기 나누고 싶어요', 'contact'],
  ['얘기하고 싶어요', 'contact'],
  ['얘기 하고 싶어요', 'contact'],
  ['이야기하고 싶어요', 'contact'],
  ['이야기 하고 싶어요', 'contact'],
  // Bare "talk" / "얘기" / "이야기" is contact only when nothing else matched (fallback)
  ['talk?', 'contact'],
  ['얘기해요', 'contact'],
  ['이야기 좀 해요', 'contact'],
  ['talk about your home server', 'fun'],
  ['how does this chat work?', 'how'],
  ['are you an ai?', 'how'],
  ['hi', 'hello'],
  ['안녕하세요', 'hello'],
  ['', 'hello'],
  ['what is the capital of france?', 'unknown'],
];

for (const [question, kind, focus] of CASES) {
  test(`resolve(${JSON.stringify(question)}) is ${kind}${focus ? `:${focus}` : ''}`, () => {
    const got = resolve(question);
    assert.equal(got.kind, kind);
    assert.equal(got.focus, focus);
  });
}

test('study topics add a notes card without changing the intent', () => {
  assert.equal(studyTopic('how do kafka partitions work?'), 'kafka');
  assert.equal(studyTopic('what do you do for fun?'), undefined);
  assert.equal(studyTopic('github'), undefined); // "git" must not fire inside "github"
});
