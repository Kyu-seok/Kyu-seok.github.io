import { useEffect, useRef } from 'react';
import type { Content, Intent, Lang, ProjectId, ReplyKind } from '../content/types';
import { content } from '../content';
import type { Stamp } from '../chat/gateway';
import { Chips } from './Chips';
import type { KeyedStudyTopic } from '../chat/answer';
import { ContactCard, FunCard, MeCard, NotesCard, ProjectCarousel, SkillsCard } from './Cards';

// A generated reply: prose streamed from the model. The card still comes from the intent.
export interface Generated {
  text: string;
  done: boolean;
  stamp?: Stamp;
}

export type Message =
  | { id: number; role: 'user'; text: string }
  // lang is the reply's language, which follows the question; t (the page's language) dresses the chrome.
  | { id: number; role: 'assistant'; lang: Lang; kind: ReplyKind; focus?: ProjectId; study?: KeyedStudyTopic; gen?: Generated };

interface Props {
  t: Content;
  messages: Message[];
  typing: boolean;
  avatarSrc: string;
  onAskChip: (intent: Intent) => void;
  onAskHow: () => void;
  onAsk: (text: string) => void;
}

interface CardProps {
  t: Content; // the page's language: buttons
  said: Content; // the reply's language: the card itself
  kind: ReplyKind;
  focus?: ProjectId;
  onAskChip: (i: Intent) => void;
  onAsk: (text: string) => void;
}

function Card({ t, said, kind, focus, onAskChip, onAsk }: CardProps) {
  switch (kind) {
    case 'me':
      return <MeCard t={said} />;
    case 'projects':
      return <ProjectCarousel t={said} focus={focus} />;
    case 'skills':
      return <SkillsCard t={said} />;
    case 'fun':
      return <FunCard t={said} />;
    case 'contact':
      return <ContactCard t={said} />;
    case 'how':
      return null;
    case 'hello':
    case 'unknown':
      return (
        <div className="suggest" lang={t.lang}>
          <p className="suggest-lead">{t.ui.suggestionsLead}</p>
          <Chips t={t} compact onPick={onAskChip} className="chips-inline" />
          {kind === 'unknown' && said.askInEnglish && (
            <p className="suggest-english" lang={said.lang}>
              <span className="suggest-lead">{said.askInEnglish.lead}</span>{' '}
              <button type="button" className="suggest-english-q" lang="en" onClick={() => onAsk(said.askInEnglish!.question)}>
                {said.askInEnglish.question}
              </button>
            </p>
          )}
        </div>
      );
  }
}

function StampLine({ t, gen, onAskHow }: { t: Content; gen?: Generated; onAskHow: () => void }) {
  if (gen) {
    if (!gen.done) return null;
    const s = gen.stamp;
    const label = t.ui.stamp.generated.replace('{model}', s?.model ?? 'Qwen3');
    const speed = s ? ` · ${s.tokS.toFixed(1)} tok/s · ${s.seconds.toFixed(1)}s` : '';
    return (
      <p className="stamp" lang={t.lang}>
        {label}
        {speed}
        <button type="button" className="stamp-link" onClick={onAskHow}>
          {t.ui.stamp.how}
        </button>
      </p>
    );
  }
  return (
    <p className="stamp" lang={t.lang}>
      {t.ui.stamp.scripted}
    </p>
  );
}

export function Thread({ t, messages, typing, avatarSrc, onAskChip, onAskHow, onAsk }: Props) {
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
        const said = content[m.lang];
        let lead: string[];
        let tail: string[];
        if (m.gen) {
          lead = m.gen.text.split(/\n{2,}/).filter((p) => p.trim().length > 0);
          if (lead.length === 0) lead = [''];
          tail = [];
        } else {
          const paras = said.replies[m.kind];
          // For project-focused answers the first paragraph is enough before the carousel.
          lead = paras.slice(0, 1);
          tail = m.kind === 'projects' && m.focus ? [] : paras.slice(1);
        }
        const showCard = !m.gen || m.kind !== 'unknown';
        return (
          <div key={m.id} className="msg msg-assistant">
            <img className="msg-avatar" src={avatarSrc} alt="" width={32} height={32} aria-hidden="true" />
            <div className="msg-body" lang={m.lang}>
              <span className="sr-only">{t.ui.assistantName}: </span>
              {lead.map((p, i) => (
                <p key={i} className={m.gen && !m.gen.done && i === lead.length - 1 ? 'gen-cursor' : undefined}>
                  {p}
                </p>
              ))}
              {showCard && <Card t={t} said={said} kind={m.kind} focus={m.focus} onAskChip={onAskChip} onAsk={onAsk} />}
              {tail.map((p, i) => (
                <p key={`t${i}`}>{p}</p>
              ))}
              {m.study && <NotesCard t={said} slug={m.study} />}
              <StampLine t={t} gen={m.gen} onAskHow={onAskHow} />
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
