import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AVATAR_SRC, content, initialLang, rememberLang } from './content';
import type { Intent, Lang, ProjectId, ReplyKind } from './content/types';
import { resolve } from './chat/answer';
import { TopBar } from './components/TopBar';
import { Hero } from './components/Hero';
import { Composer } from './components/Composer';
import { Chips } from './components/Chips';
import { Thread, type Message } from './components/Thread';

const REPLY_DELAY_MS = 520;

function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function App() {
  const [lang, setLang] = useState<Lang>(initialLang);
  const [messages, setMessages] = useState<Message[]>([]);
  const [typing, setTyping] = useState(false);
  const nextId = useRef(1);
  const timer = useRef<number | null>(null);
  const t = content[lang];

  useEffect(() => {
    document.documentElement.lang = lang;
    rememberLang(lang);
  }, [lang]);

  useEffect(() => () => {
    if (timer.current) window.clearTimeout(timer.current);
  }, []);

  const reply = useCallback((kind: ReplyKind, focus?: ProjectId) => {
    const push = () => {
      setMessages((m) => [...m, { id: nextId.current++, role: 'assistant', kind, focus }]);
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

  const ask = useCallback(
    (text: string, intent?: Intent) => {
      const clean = text.trim();
      if (!clean) return;
      setMessages((m) => [...m, { id: nextId.current++, role: 'user', text: clean }]);
      if (intent) {
        reply(intent);
      } else {
        const r = resolve(clean);
        reply(r.kind, r.focus);
      }
    },
    [reply],
  );

  const askChip = useCallback((intent: Intent) => ask(t.ui.chipQuestions[intent], intent), [ask, t]);

  const restart = useCallback(() => {
    if (timer.current) window.clearTimeout(timer.current);
    setTyping(false);
    setMessages([]);
  }, []);

  const toggleLang = useCallback(() => setLang((l) => (l === 'ko' ? 'en' : 'ko')), []);

  const isChat = messages.length > 0;
  const lastIntent = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      const m = messages[i];
      if (m.role === 'assistant' && m.kind !== 'hello' && m.kind !== 'unknown') return m.kind as Intent;
    }
    return null;
  }, [messages]);

  return (
    <div className={`app${isChat ? ' is-chat' : ''}`}>
      <TopBar t={t} lang={lang} avatarSrc={AVATAR_SRC} onToggleLang={toggleLang} onRestart={restart} isChat={isChat} />
      <div className="stage">
        <Hero t={t} avatarSrc={AVATAR_SRC} />
        <Thread t={t} messages={messages} typing={typing} avatarSrc={AVATAR_SRC} onAskChip={askChip} />
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
