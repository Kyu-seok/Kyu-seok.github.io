import { useEffect, useRef, useState } from 'react';
import type { Content } from '../../content/types';
import { N100_SIZE, N100_SPOTS, N100_SVG } from './figure';

type Spot = keyof typeof N100_SPOTS;
const SPOTS = Object.keys(N100_SPOTS) as Spot[];

// The drawing is decorative to assistive tech; the figure's label and the three buttons carry its words.
const ART = N100_SVG.replace(/ role="img" aria-label="[^"]*"/, ' aria-hidden="true" focusable="false"');

const pct = (v: number, of: number) => `${((v / of) * 100).toFixed(2)}%`;

// The box this chat and CodeBite run on (the Fun card), drawn with the anatomy kit (scripts/n100/build.mjs).
// Each part label shows on hover or keyboard focus, and toggles on tap.
export function N100({ t }: { t: Content }) {
  const [open, setOpen] = useState<Spot | null>(null);
  const root = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (e: PointerEvent) => {
      if (!root.current?.contains(e.target as Node)) setOpen(null);
    };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [open]);

  return (
    <figure className="n100" ref={root} role="group" aria-label={t.fun.alt}>
      <div className="n100-art" dangerouslySetInnerHTML={{ __html: ART }} />
      {SPOTS.map((spot) => {
        const [x, y] = N100_SPOTS[spot];
        return (
          <button
            key={spot}
            type="button"
            className="n100-spot"
            data-spot={spot}
            data-open={open === spot || undefined}
            style={{ left: pct(x, N100_SIZE.width), top: pct(y, N100_SIZE.height) }}
            aria-expanded={open === spot}
            onClick={() => setOpen((o) => (o === spot ? null : spot))}
          >
            <span className="n100-tag">{t.fun.parts[spot]}</span>
          </button>
        );
      })}
    </figure>
  );
}
