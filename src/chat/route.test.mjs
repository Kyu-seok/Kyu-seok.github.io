// Who answers a typed question, and in which language: the reply follows the question, the UI follows the
// page (#24). Run: npm test. Change these only with the decision behind them (ADR 0001, PRODUCT.md).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { resolve } from './answer.ts';
import { questionLang, wantsGeneration } from './route.ts';

const CASES = [
  // [page, question, reply language, generated?]
  ['en', 'what did you build?', 'en', true],
  ['ko', 'what did you build?', 'en', true], // English on the Korean page reaches the model
  ['ko', '어떤 에디터 쓰세요?', 'ko', false],
  ['en', '어떤 에디터 쓰세요?', 'ko', false], // Korean on the English page gets Korean, never the model
  ['en', 'CodeBite는 뭐예요?', 'ko', false], // any Hangul makes it Korean
  ['ko', 'ㅋㅋ', 'ko', false], // bare jamo count as Hangul, as in Go's unicode.Hangul
  ['ko', '?', 'ko', false], // no letters: the page's language
  ['en', '?', 'en', true],
  ['ko', 'hello', 'en', false], // greetings stay scripted
  ['en', 'how does this chat work?', 'en', false], // so does "how"
];

for (const [page, question, lang, generated] of CASES) {
  test(`${page} page, ${JSON.stringify(question)} → ${lang}${generated ? ', generated' : ', scripted'}`, () => {
    const got = questionLang(question, page);
    assert.equal(got, lang);
    assert.equal(wantsGeneration(got, resolve(question)), generated);
  });
}
