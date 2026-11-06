import type { Content } from '../content/types';

interface Props {
  t: Content;
  avatarSrc: string;
}

export function Hero({ t, avatarSrc }: Props) {
  return (
    <section className="hero" aria-label={t.ui.avatarAlt}>
      <div className="hero-clip">
        <div className="hero-inner">
          <p className="hero-greeting">{t.ui.greeting}</p>
          <h1 className="hero-title">{t.ui.title}</h1>
          <img className="hero-avatar" src={avatarSrc} alt={t.ui.avatarAlt} width={200} height={200} />
        </div>
      </div>
    </section>
  );
}
