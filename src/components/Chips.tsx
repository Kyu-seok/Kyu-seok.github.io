import type { ComponentType } from 'react';
import type { Content, Intent } from '../content/types';
import { IconBriefcase, IconLayers, IconMail, IconSpark, IconUser } from './Icons';

interface Props {
  t: Content;
  compact?: boolean;
  active?: Intent | null;
  onPick: (intent: Intent) => void;
  className?: string;
}

const ORDER: Intent[] = ['me', 'projects', 'skills', 'fun', 'contact'];

const ICONS: Record<Intent, ComponentType<{ size?: number; className?: string }>> = {
  me: IconUser,
  projects: IconBriefcase,
  skills: IconLayers,
  fun: IconSpark,
  contact: IconMail,
};

export function Chips({ t, compact = false, active = null, onPick, className = '' }: Props) {
  return (
    <div className={`chips${compact ? ' chips-compact' : ''} ${className}`.trim()} role="group" aria-label={t.ui.suggestionsLead}>
      {ORDER.map((intent) => {
        const Icon = ICONS[intent];
        const isActive = active === intent;
        return (
          <button
            key={intent}
            type="button"
            className={`chip chip-${intent}${isActive ? ' is-active' : ''}`}
            onClick={() => onPick(intent)}
            aria-pressed={isActive}
          >
            <Icon size={compact ? 16 : 20} className="chip-icon" />
            <span className="chip-label">{t.ui.chips[intent]}</span>
          </button>
        );
      })}
    </div>
  );
}
