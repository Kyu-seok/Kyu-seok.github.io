import { useEffect, useRef, useState } from 'react';
import type { ComponentType } from 'react';
import type { ContactItem, Content, ProjectId } from '../content/types';
import type { Project } from '../content/types';
import { IconArrowLeft, IconArrowRight, IconChevron, IconExternal, IconGitHub, IconGlobe, IconLinkedIn, IconMail } from './Icons';

function ProjectCard({ t, p, focused }: { t: Content; p: Project; focused: boolean }) {
  const [open, setOpen] = useState(focused);
  const descId = `desc-${p.id}`;
  return (
    <article className={`pcard${focused ? ' is-focus' : ''}${open ? ' is-open' : ''}`} data-project={p.id}>
      <div className="pcard-cover">
        <img src={p.cover} alt={p.coverAlt} loading="lazy" />
      </div>
      <div className="pcard-body">
        <div className="pcard-head">
          <h3 className="pcard-name">{p.name}</h3>
          <span className="pcard-status">{p.status}</span>
        </div>
        <p className="pcard-tagline">{p.tagline}</p>
        <div id={descId} className="pcard-more" hidden={!open}>
          {p.description.map((d, i) => (
            <p key={i} className="pcard-desc">
              {d}
            </p>
          ))}
        </div>
        <button type="button" className="pcard-toggle" aria-expanded={open} aria-controls={descId} onClick={() => setOpen((o) => !o)}>
          {open ? t.ui.less : t.ui.more}
          <IconChevron size={16} className="pcard-toggle-icon" />
        </button>
        <ul className="tags" aria-label="Stack">
          {p.stack.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
        <div className="pcard-links">
          {p.links.map((l) => (
            <a key={l.href} className="btn" href={l.href} target="_blank" rel="noreferrer">
              {l.label}
              <IconExternal size={16} />
            </a>
          ))}
        </div>
      </div>
    </article>
  );
}

export function MeCard({ t }: { t: Content }) {
  return (
    <dl className="card facts">
      {t.me.facts.map((f) => (
        <div key={f.label} className="fact">
          <dt>{f.label}</dt>
          <dd>{f.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function ProjectCarousel({ t, focus }: { t: Content; focus?: ProjectId }) {
  const track = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const measure = () => {
    const el = track.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 2);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 2);
  };

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    if (focus) {
      const target = el.querySelector<HTMLElement>(`[data-project="${focus}"]`);
      if (target) el.scrollLeft = target.offsetLeft - el.offsetLeft;
    }
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [focus]);

  const step = (dir: 1 | -1) => {
    const el = track.current;
    if (!el) return;
    const card = el.querySelector<HTMLElement>('.pcard');
    const w = card ? card.offsetWidth + 12 : el.clientWidth;
    el.scrollBy({ left: dir * w, behavior: 'smooth' });
  };

  return (
    <div className="carousel-wrap">
      <div className="carousel" ref={track} onScroll={measure}>
        {t.projects.map((p) => (
          <ProjectCard key={p.id} t={t} p={p} focused={focus === p.id} />
        ))}
      </div>
      <div className="carousel-nav">
        <button type="button" className="iconbtn iconbtn-solid" onClick={() => step(-1)} disabled={atStart} aria-label={t.ui.prev}>
          <IconArrowLeft size={18} />
        </button>
        <button type="button" className="iconbtn iconbtn-solid" onClick={() => step(1)} disabled={atEnd} aria-label={t.ui.next}>
          <IconArrowRight size={18} />
        </button>
      </div>
    </div>
  );
}

export function SkillsCard({ t }: { t: Content }) {
  return (
    <div className="card skills">
      <dl className="skills-groups">
        {t.skills.groups.map((g) => (
          <div key={g.label} className="skills-row">
            <dt>{g.label}</dt>
            <dd>
              <ul className="tags tags-lg">
                {g.items.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

export function FunCard({ t }: { t: Content }) {
  const f = t.fun;
  return (
    <div className="card fun">
      <div className="fun-cover">
        <img src="/projects/kyu-rious-graph.jpg" alt={f.coverAlt} loading="lazy" />
      </div>
      <div className="fun-body">
        <h3 className="fun-title">{f.title}</h3>
        <dl className="fun-stats">
          {f.stats.map((s) => (
            <div key={s.label}>
              <dd>{s.value}</dd>
              <dt>{s.label}</dt>
            </div>
          ))}
        </dl>
        <ul className="fun-topics">
          {f.topics.map((tp) => (
            <li key={tp.name}>
              <span className="dot" style={{ background: tp.color }} aria-hidden="true" />
              <span className="fun-topic-name">{tp.name}</span>
              <span className="fun-topic-meta">
                {tp.lessons} {t.ui.lessons} · {tp.refs} {t.ui.refs}
              </span>
            </li>
          ))}
        </ul>
        <a className="btn" href={f.link.href} target="_blank" rel="noreferrer">
          {f.link.label}
          <IconExternal size={16} />
        </a>
      </div>
    </div>
  );
}

const CONTACT_ICONS: Record<ContactItem['kind'], ComponentType<{ size?: number }>> = {
  email: IconMail,
  github: IconGitHub,
  linkedin: IconLinkedIn,
  site: IconGlobe,
};

export function ContactCard({ t }: { t: Content }) {
  return (
    <ul className="card contact">
      {t.contact.items.map((c) => {
        const Icon = CONTACT_ICONS[c.kind];
        const external = c.kind !== 'email';
        return (
          <li key={c.kind}>
            <a href={c.href} target={external ? '_blank' : undefined} rel={external ? 'noreferrer' : undefined}>
              <span className="contact-icon">
                <Icon size={20} />
              </span>
              <span className="contact-text">
                <span className="contact-label">{c.label}</span>
                <span className="contact-value">{c.value}</span>
              </span>
              <IconExternal size={16} className="contact-ext" />
            </a>
          </li>
        );
      })}
    </ul>
  );
}
