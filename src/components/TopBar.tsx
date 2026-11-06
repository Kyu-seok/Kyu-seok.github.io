import type { Content, Lang } from '../content/types';
import { IconGitHub, IconLinkedIn, IconRestart } from './Icons';

interface Props {
  t: Content;
  lang: Lang;
  avatarSrc: string;
  isChat: boolean;
  onToggleLang: () => void;
  onRestart: () => void;
}

export function TopBar({ t, lang, avatarSrc, isChat, onToggleLang, onRestart }: Props) {
  const github = t.contact.items.find((i) => i.kind === 'github');
  const linkedin = t.contact.items.find((i) => i.kind === 'linkedin');
  return (
    <header className="topbar">
      <div className="topbar-inner">
        <div className="topbar-left">
          <img className="topbar-avatar" src={avatarSrc} alt="" width={36} height={36} aria-hidden="true" />
          <button type="button" className="wordmark" onClick={onRestart} aria-label={isChat ? t.ui.newChat : t.ui.wordmark}>
            {t.ui.wordmark}
          </button>
          {isChat && (
            <button type="button" className="iconbtn topbar-restart" onClick={onRestart} aria-label={t.ui.newChat} title={t.ui.newChat}>
              <IconRestart size={18} />
            </button>
          )}
        </div>
        <div className="topbar-right">
          <button type="button" className="langtoggle" onClick={onToggleLang} aria-label={t.ui.toggleLabel} title={t.ui.toggleLabel}>
            <span className={lang === 'ko' ? 'on' : ''}>KO</span>
            <span className="langtoggle-sep" aria-hidden="true" />
            <span className={lang === 'en' ? 'on' : ''}>EN</span>
          </button>
          {github && (
            <a className="iconbtn" href={github.href} target="_blank" rel="noreferrer" aria-label={github.label} title={github.label}>
              <IconGitHub size={20} />
            </a>
          )}
          {linkedin && (
            <a className="iconbtn" href={linkedin.href} target="_blank" rel="noreferrer" aria-label={linkedin.label} title={linkedin.label}>
              <IconLinkedIn size={20} />
            </a>
          )}
        </div>
      </div>
    </header>
  );
}
