import { useEffect, useRef } from 'react';
import type { Content, Intent, ProjectId, ReplyKind } from '../content/types';
import { Chips } from './Chips';
import { ContactCard, FunCard, MeCard, ProjectCarousel, SkillsCard } from './Cards';

export type Message =
  | { id: number; role: 'user'; text: string }
  | { id: number; role: 'assistant'; kind: ReplyKind; focus?: ProjectId };

interface Props {
  t: Content;
  messages: Message[];
  typing: boolean;
  avatarSrc: string;
  onAskChip: (intent: Intent) => void;
}

function Card({ t, kind, focus, onAskChip }: { t: Content; kind: ReplyKind; focus?: ProjectId; onAskChip: (i: Intent) => void }) {
  switch (kind) {
    case 'me':
      return <MeCard t={t} />;
    case 'projects':
      return <ProjectCarousel t={t} focus={focus} />;
    case 'skills':
      return <SkillsCard t={t} />;
    case 'fun':
      return <FunCard t={t} />;
    case 'contact':
      return <ContactCard t={t} />;
    case 'hello':
    case 'unknown':
      return (
        <div className="suggest">
          <p className="suggest-lead">{t.ui.suggestionsLead}</p>
          <Chips t={t} compact onPick={onAskChip} className="chips-inline" />
        </div>
      );
  }
}

export function Thread({ t, messages, typing, avatarSrc, onAskChip }: Props) {
  const listRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const count = messages.length;
  const last = messages[count - 1];

  // A question scrolls the thread to its end; an answer scrolls so the answer starts under the top bar,
  // because answers with cards are taller than the viewport.
  useEffect(() => {
    if (count === 0) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const behavior: ScrollBehavior = reduce ? 'auto' : 'smooth';
    if (last?.role === 'assistant') {
      const nodes = listRef.current?.querySelectorAll<HTMLElement>('.msg-assistant:not(.msg-typing)');
      const node = nodes?.[nodes.length - 1];
      node?.scrollIntoView({ behavior, block: 'start' });
    } else {
      endRef.current?.scrollIntoView({ behavior, block: 'end' });
    }
  }, [count, typing, last]);

  return (
    <div className="thread" aria-live="polite" aria-relevant="additions" ref={listRef}>
      {messages.map((m) => {
        if (m.role === 'user') {
          return (
            <div key={m.id} className="msg msg-user">
              <span className="sr-only">{t.ui.you}: </span>
              <p>{m.text}</p>
            </div>
          );
        }
        const paras = t.replies[m.kind];
        // For project-focused answers the first paragraph is enough before the carousel.
        const lead = m.kind === 'projects' && m.focus ? paras.slice(0, 1) : paras.slice(0, 1);
        const tail = m.kind === 'projects' && m.focus ? [] : paras.slice(1);
        return (
          <div key={m.id} className="msg msg-assistant">
            <img className="msg-avatar" src={avatarSrc} alt="" width={32} height={32} aria-hidden="true" />
            <div className="msg-body">
              <span className="sr-only">{t.ui.assistantName}: </span>
              {lead.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
              <Card t={t} kind={m.kind} focus={m.focus} onAskChip={onAskChip} />
              {tail.map((p, i) => (
                <p key={`t${i}`}>{p}</p>
              ))}
            </div>
          </div>
        );
      })}
      {typing && (
        <div className="msg msg-assistant msg-typing" aria-label={t.ui.thinking}>
          <img className="msg-avatar" src={avatarSrc} alt="" width={32} height={32} aria-hidden="true" />
          <div className="typing" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
        </div>
      )}
      <div ref={endRef} className="thread-end" />
    </div>
  );
}
