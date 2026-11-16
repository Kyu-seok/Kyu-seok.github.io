import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AVATAR_SRC, content, initialLang, rememberLang } from './content';
import type { Intent, Lang, ProjectId, ReplyKind } from './content/types';
import { resolve, studyTopic, type KeyedStudyTopic, type Resolution } from './chat/answer';
import { askGateway } from './chat/gateway';
import { TopBar } from './components/TopBar';
import { Hero } from './components/Hero';
import { Composer } from './components/Composer';
import { Chips } from './components/Chips';
import { Thread, type Generated, type Message } from './components/Thread';
import { Backdrop } from './components/Backdrop';

const REPLY_DELAY_MS = 520;

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// The reply follows the question; the UI follows the page (#24). A question with Hangul gets a Korean reply,
// a question with Latin letters an English one, on either page; anything else ("?", an emoji) takes the page's
// language. Only English free text is generated: Korean was generated from 2026-11-08 and reverted on
// 2026-11-12 when real answers stayed below the bar (ADR 0001). HANGUL matches the gateway's hasHangul
// (unicode.Hangul in server/main.go), which refuses Hangul and generates only for lang "en".
// Greetings and "how does this work" stay scripted.
const HANGUL = /\p{Script=Hangul}/u;
const GENERATED_LANG: Lang = 'en'; // the only language the gateway generates
const LATIN = /\p{Script=Latin}/u;
function questionLang(text: string, page: Lang): Lang {
  if (HANGUL.test(text)) return 'ko';
  if (LATIN.test(text)) return 'en';
  return page;
}
function wantsGeneration(lang: Lang, r: Resolution): boolean {
  return lang === GENERATED_LANG && r.kind !== 'hello' && r.kind !== 'how';
}

export function App() {
  const [lang, setLang] = useState<Lang>(initialLang);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typing, setTyping] = useState(false);
  const nextId = useRef(1);
  const timer = useRef<number | null>(null);
  const session = useRef(0); // bumped on restart so a stream in flight cannot write into a new chat
  const t = content[lang];

  useEffect(() => {
    document.documentElement.lang = lang;
    rememberLang(lang);
  }, [lang]);

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  // missed: a generated reply was tried and got no first token: down, busy, or past the time budget.
  const reply = useCallback((lang: Lang, kind: ReplyKind, focus?: ProjectId, study?: KeyedStudyTopic, missed?: boolean) => {
    const push = () => {
      setMessages((m) => [...m, { id: nextId.current++, role: 'assistant', lang, kind, focus, study, missed }]);
      setTyping(false);
    };
    if (prefersReducedMotion()) {
      push();
      return;
    }
    setTyping(true);
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(push, REPLY_DELAY_MS);
  }, []);

  // The intent and card are decided before the model is asked; the model only supplies prose.
  // No token within the budget, or the gateway down or busy, means the scripted reply instead.
  const replyGenerated = useCallback(
    async (text: string, r: Resolution, study?: KeyedStudyTopic) => {
      const mine = session.current;
      const id = nextId.current++;
      let added = false;
      setTyping(true);
      const patch = (f: (g: Generated) => Generated) =>
        setMessages((m) => m.map((x) => (x.id === id && x.role === 'assistant' && x.gen ? { ...x, gen: f(x.gen) } : x)));
      const outcome = await askGateway(text, r.kind, GENERATED_LANG, {
        onToken(tok) {
          if (session.current !== mine) return;
          if (!added) {
            added = true;
            setTyping(false);
            setMessages((m) => [...m, { id, role: 'assistant', lang: GENERATED_LANG, kind: r.kind, focus: r.focus, study, gen: { text: tok, done: false } }]);
          } else {
            patch((g) => ({ ...g, text: g.text + tok }));
          }
        },
        onDone(stamp) {
          if (session.current !== mine) return;
          patch((g) => ({ ...g, done: true, stamp }));
        },
      });
      if (session.current !== mine) return;
      if (outcome === 'generated') {
        patch((g) => (g.done ? g : { ...g, done: true })); // cut mid-stream: keep what arrived, no stamp
      } else {
        reply(GENERATED_LANG, r.kind, r.focus, study, true);
      }
    },
    [reply],
  );

  const ask = useCallback(
    (text: string, intent?: Intent) => {
      const clean = text.trim();
      if (!clean) return;
      setMessages((m) => [...m, { id: nextId.current++, role: 'user', text: clean }]);
      if (intent) {
        reply(lang, intent);
        return;
      }
      const r = resolve(clean);
      // Free text only, never chips. The notes card is added beside the intent's card and never changes it.
      const study = studyTopic(clean);
      const replyLang = questionLang(clean, lang);
      if (wantsGeneration(replyLang, r)) void replyGenerated(clean, r, study);
      else reply(replyLang, r.kind, r.focus, study);
    },
    [lang, reply, replyGenerated],
  );

  const askChip = useCallback((intent: Intent) => ask(t.ui.chipQuestions[intent], intent), [ask, t]);

  const askHow = useCallback(() => {
    setMessages((m) => [...m, { id: nextId.current++, role: 'user', text: t.ui.howQuestion }]);
    reply(lang, 'how');
  }, [lang, reply, t]);

  const restart = useCallback(() => {
    if (timer.current) window.clearTimeout(timer.current);
    session.current++;
    setTyping(false);
    setMessages([]);
  }, []);

  const toggleLang = useCallback(() => setLang((l) => (l === 'ko' ? 'en' : 'ko')), []);

  const isChat = messages.length > 0;
  const lastIntent = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.role === 'assistant' && m.kind !== 'hello' && m.kind !== 'unknown' && m.kind !== 'how') return m.kind as Intent;
    }
    return null;
  }, [messages]);

  return (
    <div className={`app${isChat ? ' is-chat' : ''}`}>
      <Backdrop active={!isChat} />
      <TopBar t={t} lang={lang} avatarSrc={AVATAR_SRC} onToggleLang={toggleLang} onRestart={restart} isChat={isChat} />
      <main className="stage">
        <Hero t={t} avatarSrc={AVATAR_SRC} />
        <Thread t={t} messages={messages} typing={typing} avatarSrc={AVATAR_SRC} onAskChip={askChip} onAskHow={askHow} onAsk={ask} />
        <div className="dock">
          <div className="dock-inner">
            <Chips t={t} compact={isChat} active={lastIntent} onPick={askChip} />
            <Composer t={t} onSubmit={(text) => ask(text)} />
            <p className="dock-note">{t.ui.scriptedNote}</p>
          </div>
        </div>
      </main>
    </div>
  );
}
