import { useEffect, useRef } from 'react';

// Graph-paper dots that show only around the pointer, on the hero. CSS draws the dots and masks them
// to a circle at --px/--py; this eases those vars toward the pointer and --pa (presence) in and out.
// Mouse and trackpad only, never under reduced motion; the loop stops once it settles.
const FOLLOW_MS = 110; // time constant of the position easing
const PRESENCE_MS = 260;

function canHover() {
  return (
    window.matchMedia('(hover: hover) and (pointer: fine)').matches &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
}

export function Backdrop({ active }: { active: boolean }) {
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = root.current;
    if (!el || !active || !canHover()) return;

    const target = { x: innerWidth / 2, y: innerHeight / 2, in: 0 };
    const cur = { ...target };
    let raf = 0;
    let last = 0;

    const write = () => {
      el.style.setProperty('--px', `${cur.x}px`);
      el.style.setProperty('--py', `${cur.y}px`);
      el.style.setProperty('--pa', cur.in.toFixed(3));
    };
    const frame = (now: number) => {
      const dt = last ? Math.min(now - last, 64) : 16;
      last = now;
      const k = 1 - Math.exp(-dt / FOLLOW_MS);
      cur.x += (target.x - cur.x) * k;
      cur.y += (target.y - cur.y) * k;
      cur.in += (target.in - cur.in) * (1 - Math.exp(-dt / PRESENCE_MS));
      const settled =
        Math.abs(target.x - cur.x) < 0.3 && Math.abs(target.y - cur.y) < 0.3 && Math.abs(target.in - cur.in) < 0.002;
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
      if (target.in === 0 && cur.in < 0.01) {
        // arriving from outside: appear where the pointer is instead of sliding in from the old spot
        cur.x = e.clientX;
        cur.y = e.clientY;
      }
      target.x = e.clientX;
      target.y = e.clientY;
      target.in = 1;
      kick();
    };
    const onLeave = () => {
      target.in = 0;
      kick();
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    document.documentElement.addEventListener('pointerleave', onLeave);
    window.addEventListener('blur', onLeave);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('pointermove', onMove);
      document.documentElement.removeEventListener('pointerleave', onLeave);
      window.removeEventListener('blur', onLeave);
    };
  }, [active]);

  return <div ref={root} className="backdrop" aria-hidden="true" />;
}
