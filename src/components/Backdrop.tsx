import { useEffect, useRef, useSyncExternalStore } from 'react';

// Graph-paper dots that show only around the pointer, on the hero. CSS draws the dots and masks them
// to a circle at --px/--py; this eases those vars toward the pointer and --presence in and out.
// Mouse and trackpad only, never under reduced motion; the loop stops once it settles.
// The easing is continuous pointer following, not a transition, so it is the one place that does not
// use the ease-out curve (DESIGN.md, Pointer Dots).
const FOLLOW_MS = 110; // time constant of the position easing
const PRESENCE_MS = 260;

// Must match the @media around .backdrop in app.css.
const DOTS_QUERY = '(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)';

function subscribeDots(onChange: () => void) {
  const mq = window.matchMedia(DOTS_QUERY);
  mq.addEventListener('change', onChange);
  return () => mq.removeEventListener('change', onChange);
}
const wantsDots = () => window.matchMedia(DOTS_QUERY).matches;

export function Backdrop({ active }: { active: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  const enabled = useSyncExternalStore(subscribeDots, wantsDots, () => false);

  useEffect(() => {
    const el = root.current;
    if (!el || !active || !enabled) return;

    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2, presence: 0 };
    const cur = { ...target };
    let raf = 0;
    let last = 0;

    const write = () => {
      el.style.setProperty('--px', `${cur.x}px`);
      el.style.setProperty('--py', `${cur.y}px`);
      el.style.setProperty('--presence', cur.presence.toFixed(3));
    };
    const frame = (now: number) => {
      const dt = last ? Math.min(now - last, 64) : 16;
      last = now;
      const k = 1 - Math.exp(-dt / FOLLOW_MS);
      cur.x += (target.x - cur.x) * k;
      cur.y += (target.y - cur.y) * k;
      cur.presence += (target.presence - cur.presence) * (1 - Math.exp(-dt / PRESENCE_MS));
      const settled =
        Math.abs(target.x - cur.x) < 0.3 &&
        Math.abs(target.y - cur.y) < 0.3 &&
        Math.abs(target.presence - cur.presence) < 0.002;
      if (settled) {
        Object.assign(cur, target);
        raf = 0;
        last = 0;
      } else raf = requestAnimationFrame(frame);
      write();
    };
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(frame);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return;
      if (target.presence === 0 && cur.presence < 0.01) {
        // arriving from outside: appear where the pointer is instead of sliding in from the old spot
        cur.x = e.clientX;
        cur.y = e.clientY;
      }
      target.x = e.clientX;
      target.y = e.clientY;
      target.presence = 1;
      kick();
    };
    const onLeave = () => {
      target.presence = 0;
      kick();
    };

    write(); // start hidden: a restart from chat must not bring back the circle from before the fold
    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    window.addEventListener('blur', onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('blur', onLeave);
    };
  }, [active, enabled]);

  return <div ref={root} className="backdrop" aria-hidden="true" />;
}
