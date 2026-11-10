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

const REPLY_DELAY_MS = 520;

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

// Free text in either language is generated (ADR 0001, 2026-11-08 amendment). Greetings and "how does this
// work" stay scripted. Korean text longer than the gateway's cap (maxHangulQuestionChars in server/main.go)
// is not sent: Korean costs about one token per character and prefill is slow, so it would miss the
// first-token budget anyway. The script test matches Go's unicode.Hangul so page and gateway agree.
const GATEWAY_HANGUL_QUESTION_CAP = 40;
const HANGUL = /\p{Script=Hangul}/u;
function overHangulCap(text: string): boolean {
  return HANGUL.test(text) && [...text].length > GATEWAY_HANGUL_QUESTION_CAP;
}
function wantsGeneration(r: Resolution): boolean {
  return r.kind !== 'hello' && r.kind !== 'how';
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

  const reply = useCallback((kind: ReplyKind, focus?: ProjectId, study?: KeyedStudyTopic) => {
    const push = () => {
      setMessages((m) => [...m, { id: nextId.current++, role: 'assistant', kind, focus, study }]);
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
      const outcome = await askGateway(text, r.kind, lang, {
        onToken(tok) {
          if (session.current !== mine) return;
          if (!added) {
            added = true;
            setTyping(false);
            setMessages((m) => [...m, { id, role: 'assistant', kind: r.kind, focus: r.focus, study, gen: { text: tok, done: false } }]);
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
        reply(r.kind, r.focus, study);
      }
    },
    [lang, reply],
  );

  const ask = useCallback(
    (text: string, intent?: Intent) => {
      const clean = text.trim();
      if (!clean) return;
      setMessages((m) => [...m, { id: nextId.current++, role: 'user', text: clean }]);
      if (intent) {
        reply(intent);
        return;
      }
      const r = resolve(clean);
      // Free text only, never chips. The notes card is added beside the intent's card and never changes it.
      const study = studyTopic(clean);
      if (overHangulCap(clean)) {
        // A matched intent still has a true scripted reply; an unmatched one must say why, not "busy".
        // The too-long reply is about the question's length, not its subject, so it gets no notes card.
        if (r.kind === 'unknown') reply('toolong');
        else reply(r.kind, r.focus, study);
        return;
      }
      if (wantsGeneration(r)) void replyGenerated(clean, r, study);
      else reply(r.kind, r.focus, study);
    },
    [reply, replyGenerated],
  );

  const askChip = useCallback((intent: Intent) => ask(t.ui.chipQuestions[intent], intent), [ask, t]);

  const askHow = useCallback(() => {
    setMessages((m) => [...m, { id: nextId.current++, role: 'user', text: t.ui.howQuestion }]);
    reply('how');
  }, [reply, t]);

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
      if (m.role === 'assistant' && m.kind !== 'hello' && m.kind !== 'unknown' && m.kind !== 'how' && m.kind !== 'toolong') return m.kind as Intent;
    }
    return null;
  }, [messages]);

  return (
    <div className={`app${isChat ? ' is-chat' : ''}`}>
      <TopBar t={t} lang={lang} avatarSrc={AVATAR_SRC} onToggleLang={toggleLang} onRestart={restart} isChat={isChat} />
      <div className="stage">
        <Hero t={t} avatarSrc={AVATAR_SRC} />
        <Thread t={t} messages={messages} typing={typing} avatarSrc={AVATAR_SRC} onAskChip={askChip} onAskHow={askHow} />
        <div className="dock">
          <div className="dock-inner">
            <Chips t={t} compact={isChat} active={lastIntent} onPick={askChip} />
            <Composer t={t} onSubmit={(text) => ask(text)} />
            <p className="dock-note">{t.ui.scriptedNote}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
