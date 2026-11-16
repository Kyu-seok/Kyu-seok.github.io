// Builds the hero's N100 mini PC figure: an isometric SVG drawn with the anatomy kit (iso-kit.mjs,
// copied from the anatomy skill). Writes src/components/n100/figure.ts. Run: node scripts/n100/build.mjs
//
// Proportions follow the GMKtec NucBox G3 (about 114 x 107 x 43 mm), drawn without any branding.
// World units are millimetres; z is up. The lid floats above and behind the tray so the board shows.
import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import * as k from "./iso-kit.mjs";

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, "../../src/components/n100/figure.ts");

const WIDTH = 440;
const HEIGHT = 340;

const CASE = { x: -57, y: -53.5, w: 114, d: 107, r: 9 };
const TRAY_H = 26; // the lower shell; the lid is the remaining 17 of the 43
const LID_H = 17;
const WALL = 3;
const FLOOR = 4;
const INNER = k.insetPlan(CASE, WALL);
const BOARD = k.insetPlan(INNER, 2);
const BOARD_TOP = FLOOR + 1.6;
const LID_AT = [-8, -8, TRAY_H + 52]; // where the lid floats: up, and back toward the far corner

const FAN = { x: -28, y: 20, r: 17, top: 15 };

const P = k.fitProjection(
  [
    ...k.boxCorners(CASE, -3, TRAY_H),
    ...k.boxCorners({ ...CASE, x: CASE.x + LID_AT[0], y: CASE.y + LID_AT[1] }, LID_AT[2], LID_AT[2] + LID_H),
  ],
  WIDTH,
  HEIGHT,
  { pad: 18, azimuth: 40, elevation: 40 },
);

const at = (p) => k.iso(p, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const r1 = (n) => Math.round(n * 10) / 10;
const depth = (x, y, z = 0) => k.depthOf([x, y, z], P);
const byDepth = (items) => [...items].sort((a, b) => a.depth - b.depth);

// ---------- the tray (lower shell) ----------

function feet() {
  const out = [`<path class="iso-halo" d="${k.haloOf(CASE, -3, 3, P)}"/>`];
  for (const [x, y] of k.corners(CASE, 14).sort((a, b) => depth(...a) - depth(...b))) {
    out.push(S(k.cylinder(x, y, 6, -3, 3, P, 24), { tone: "lo" }));
  }
  return out.join("");
}

function shell() {
  const seam = k.sideSeam(CASE, 6, P, 8);
  return S(k.slabOf(CASE, 0, TRAY_H, P, 8, 1.2), { tone: "mid", inner: L(seam, { tone: "faint" }) });
}

// Front face (+x): power button, LED, two USB-A, USB-C and the audio jack, drawn in the face plane.
// sideMatrix "right" maps local (u, v) to world (x = 57, y = -u, z = -v).
const FRONT = k.sideMatrix([CASE.x + CASE.w, 0], 0, P, "right");
const port = (yc, zc, w, h, r) => `<rect x="${r1(-yc - w / 2)}" y="${r1(-zc - h / 2)}" width="${w}" height="${h}" rx="${r}"/>`;
function front() {
  const out = [`<g transform="${FRONT}" class="n100-face">`];
  out.push(`<g class="n100-port">${port(-30, 13, 13, 5.6, 0.8)}${port(-12, 13, 13, 5.6, 0.8)}${port(6, 13, 9, 3.4, 1.7)}</g>`);
  out.push(`<g class="n100-port-tongue">${port(-30, 13.6, 10, 1.6, 0.4)}${port(-12, 13.6, 10, 1.6, 0.4)}${port(6, 13, 6, 1, 0.5)}</g>`);
  out.push(`<circle class="n100-port" cx="${-20}" cy="${-13}" r="1.8"/>`); // audio jack, y = 20
  out.push(`<circle class="n100-port" cx="${-36}" cy="${-13}" r="3.4"/><circle class="n100-port" cx="${-36}" cy="${-13}" r="2.2"/>`); // power button, y = 36
  out.push(`<circle class="n100-led-glow" cx="${-44}" cy="${-13}" r="3.2"/><circle class="n100-led" cx="${-44}" cy="${-13}" r="1"/>`); // LED, y = 44
  out.push(`</g>`);
  return out.join("");
}

// Side face (+y): a row of closed vent slots.
const SIDE = k.sideMatrix([0, CASE.y + CASE.d], 0, P, "left");
function side() {
  const slots = [];
  for (let x = -38; x <= 38; x += 5.5) slots.push(`<rect x="${r1(x - 1.2)}" y="-20" width="2.4" height="12" rx="1.2"/>`);
  return `<g transform="${SIDE}" class="n100-face"><g class="n100-port">${slots.join("")}</g></g>`;
}

// ---------- the cavity: everything inside is clipped to the rim, so the near walls hide it ----------

function cavity() {
  const rim = k.planOutline(INNER, TRAY_H, P);
  const floor = k.planOutline(INNER, FLOOR, P);
  const out = [`<clipPath id="n100-rim"><path d="${rim}"/></clipPath>`, `<g clip-path="url(#n100-rim)">`];
  out.push(`<path class="n100-wall" d="${rim}"/>`);
  out.push(`<path class="n100-floor" d="${floor}"/>`);
  out.push(board());
  out.push(`</g>`);
  out.push(L(rim, { tone: "lo" }));
  return out.join("");
}

function board() {
  const out = [S(k.slabOf(BOARD, FLOOR, 1.6, P, 6, 0.4), { tone: "lo", crease: "faint" })];
  const holes = k.corners(BOARD, 4);
  out.push(L(holes.map(([x, y]) => k.ring(x, y, 2, BOARD_TOP, P, 16)).join(""), { tone: "lo" }));
  out.push(D(holes.map(([x, y]) => at([x, y, BOARD_TOP])), { size: 0.5 }));
  const parts = [
    { depth: depth(-28, -19), svg: finStack() },
    { depth: depth(-30, -2), svg: outlet() },
    { depth: depth(FAN.x, FAN.y), svg: fan() },
    { depth: depth(9, -18), svg: cpu() },
    { depth: depth(24, 16), svg: ram() },
    { depth: depth(21, 39), svg: ssd() },
    { depth: depth(36, -40), svg: wifi() },
    { depth: depth(38, -16), svg: coin() },
    ...[[28, -30], [28, -24], [-2, -40], [4, -40]].map(([x, y]) => ({ depth: depth(x, y), svg: cap(x, y) })),
  ];
  for (const p of byDepth(parts)) out.push(p.svg);
  return out.join("");
}

const FINS = { x: -48, y: -32, w: 38, d: 22, r: 1.5 };
function finStack() {
  const top = BOARD_TOP + 11;
  const out = [S(k.slabOf(FINS, BOARD_TOP, 11, P, 3, 0.4), { tone: "mid" })];
  const fins = [];
  for (let x = FINS.x + 2.5; x < FINS.x + FINS.w - 1; x += 2.5) fins.push(k.lineOnTop([x, FINS.y], [x, FINS.y + FINS.d], top, P));
  out.push(L(fins.join(""), { tone: "lo" }));
  return out.join("");
}

function outlet() {
  return S(k.slabOf({ x: -44, y: -11, w: 30, d: 16, r: 2 }, BOARD_TOP, 9.4, P, 3, 0.4), { tone: "mid" });
}

// The blower: housing, an open ring on top, and nine curved blades drawn flat in the top plane so CSS can turn them.
function fan() {
  const { x, y, r, top } = FAN;
  const out = [S(k.cylinder(x, y, r, BOARD_TOP, top - BOARD_TOP, P, 48, 0.5), { tone: "mid" })];
  const plane = k.topMatrix([x, y], top, P);
  const blades = [];
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    const p = (rr, da) => [r1(Math.cos(a + da) * rr), r1(Math.sin(a + da) * rr)];
    const [x0, y0] = p(5, 0);
    const [x1, y1] = p(9, 0.35);
    const [x2, y2] = p(13, 0.5);
    blades.push(`M${x0} ${y0}Q${x1} ${y1} ${x2} ${y2}`);
  }
  out.push(
    `<g transform="${plane}"><circle class="n100-fan-well" r="13.6"/><g class="n100-blades"><path d="${blades.join("")}"/></g><circle class="n100-hub" r="4.6"/><circle class="n100-hub-dot" r="1"/></g>`,
  );
  out.push(L(k.ring(x, y, 13.6, top, P, 48), { tone: "mid" }));
  out.push(D(k.corners({ x: x - r, y: y - r, w: r * 2, d: r * 2 }, 3).filter(([px, py]) => Math.hypot(px - x, py - y) < r).map(([px, py]) => at([px, py, top])), { size: 0.45 }));
  return out.join("");
}

// The N100 under a copper cold plate, joined to the fins by a flat heat pipe.
const CPU = { x: -2, y: -28, w: 22, d: 20, r: 1.5 };
function cpu() {
  const out = [];
  out.push(S(k.slabOf({ x: -12, y: -21, w: 12, d: 6, r: 1 }, BOARD_TOP + 3, 1.6, P, 2), { tone: "mid", crease: "none" }));
  out.push(S(k.slabOf(CPU, BOARD_TOP, 2.4, P, 3, 0.3), { tone: "mid" }));
  out.push(S(k.slabOf(k.insetPlan(CPU, 2.5), BOARD_TOP + 2.4, 2.2, P, 3, 0.4), { tone: "hi", crease: "lo" }));
  const screws = k.corners(CPU, 1.6);
  out.push(D(screws.map(([x, y]) => at([x, y, BOARD_TOP + 2.4])), { size: 0.5, tone: "mid" }));
  return out.join("");
}

// One SO-DIMM lying in its slot, four chips and a sticker whose rule lines stand for printed text.
const RAM = { x: 0, y: 4, w: 50, d: 24, r: 0.8 };
function ram() {
  const out = [S(k.slabOf({ x: -4, y: 2.5, w: 5, d: 27, r: 0.8 }, BOARD_TOP, 4.2, P, 2, 0.3), { tone: "mid" })];
  out.push(S(k.slabOf(RAM, BOARD_TOP + 2.2, 1, P, 2, 0.3), { tone: "hi", crease: "lo" }));
  const top = BOARD_TOP + 3.2;
  for (const cx of [3, 14, 25]) out.push(S(k.slabOf({ x: cx, y: 7, w: 9, d: 8, r: 0.4 }, top, 1, P, 2), { tone: "mid", crease: "none" }));
  const sticker = { x: 36, y: 7, w: 11, d: 18, r: 0.6 };
  out.push(S(k.slabOf(sticker, top, 0.3, P, 2), { tone: "hi", crease: "none" }));
  out.push(L([0, 1, 2].map((i) => k.lineOnTop([sticker.x + 2.5 + i * 3, sticker.y + 3], [sticker.x + 2.5 + i * 3, sticker.y + 15 - i * 3], top + 0.3, P)).join(""), { tone: "lo", free: true }));
  return out.join("");
}

// An M.2 2280 SSD: connector, board, controller, two NAND packages, and the standoff screw at its far end.
const SSD = { x: 0, y: 32, w: 44, d: 13, r: 0.6 };
function ssd() {
  const top = BOARD_TOP + 2.2;
  const out = [S(k.slabOf({ x: -4, y: 31, w: 5, d: 15, r: 0.6 }, BOARD_TOP, 3.4, P, 2, 0.3), { tone: "mid" })];
  out.push(S(k.slabOf(SSD, BOARD_TOP + 1.4, 0.8, P, 2, 0.3), { tone: "hi", crease: "lo" }));
  out.push(S(k.slabOf({ x: 3, y: 34.5, w: 8, d: 8, r: 0.4 }, top, 1, P, 2), { tone: "mid", crease: "none" }));
  for (const cx of [14, 27]) out.push(S(k.slabOf({ x: cx, y: 34, w: 11, d: 9, r: 0.4 }, top, 1, P, 2), { tone: "mid", crease: "none" }));
  out.push(S(k.cylinder(46.5, 38.5, 2.6, BOARD_TOP, 2.6, P, 18), { tone: "mid" }));
  out.push(L(k.ring(46.5, 38.5, 1.3, BOARD_TOP + 2.6, P, 12), { tone: "lo" }));
  return out.join("");
}

function wifi() {
  const card = { x: 26, y: -46, w: 22, d: 14, r: 0.6 };
  const top = BOARD_TOP + 2;
  const out = [S(k.slabOf(card, BOARD_TOP + 1.2, 0.8, P, 2, 0.3), { tone: "mid" })];
  const ufl = [[31, -42], [37, -42]];
  for (const [x, y] of ufl) out.push(S(k.cylinder(x, y, 1.2, top, 0.8, P, 12), { tone: "mid" }));
  // two antenna leads, from the connectors to pads on the far wall
  out.push(k.wireSvg(at([31, -42, top + 0.8]), at([16, INNER.y, 16]), { via: [at([24, -44, top + 3])], tone: "lo", size: 0.9 }));
  out.push(k.wireSvg(at([37, -42, top + 0.8]), at([44, INNER.y, 18]), { via: [at([40, -46, top + 3])], tone: "lo", size: 0.9 }));
  return out.join("");
}

function coin() {
  const out = [S(k.cylinder(38, -16, 6, BOARD_TOP, 2.2, P, 32, 0.4), { tone: "mid" })];
  out.push(L(k.ring(38, -16, 4, BOARD_TOP + 2.2, P, 32), { tone: "faint" }));
  return out.join("");
}

const cap = (x, y) => S(k.cylinder(x, y, 2.2, BOARD_TOP, 4.4, P, 16, 0.3), { tone: "mid" }) + L(k.ring(x, y, 1.1, BOARD_TOP + 4.4, P, 12), { tone: "faint" });

// ---------- the lid, floating ----------

function lid() {
  const [dx, dy, dz] = LID_AT;
  const plan = { ...CASE, x: CASE.x + dx, y: CASE.y + dy };
  const top = dz + LID_H;
  const out = [`<path class="iso-halo n100-lid-halo" d="${k.haloOf(k.insetPlan(plan, 8), dz - 22, 0.1, P)}"/>`];
  out.push(S(k.slabOf(plan, dz, LID_H, P, 8, 1.4), { tone: "mid", inner: L(k.sideSeam(plan, dz + 4, P, 8), { tone: "faint" }) }));
  out.push(L(k.planOutline(k.insetPlan(plan, 6), top, P), { tone: "faint" }));
  // a round grille of perforations over the fan
  const cx = FAN.x + dx;
  const cy = FAN.y + dy;
  const holes = [];
  for (let gx = -24; gx <= 24; gx += 4) for (let gy = -24; gy <= 24; gy += 4) if (Math.hypot(gx, gy) <= 24) holes.push(at([cx + gx, cy + gy, top]));
  out.push(D(holes, { size: 0.55, tone: "lo" }));
  out.push(L(k.ring(cx, cy, 27, top, P, 64), { tone: "faint" }));
  const screws = k.corners(plan, 7);
  out.push(D(screws.map(([x, y]) => at([x, y, top])), { size: 0.5, tone: "mid" }));
  return out.join("");
}

// ---------- spots: where the three part labels attach (viewBox coordinates) ----------

const spot = (p) => at(p).map(r1);
const SPOTS = {
  cpu: spot([CPU.x + CPU.w / 2, CPU.y + CPU.d / 2, BOARD_TOP + 4.6]),
  ram: spot([RAM.x + 18, RAM.y + RAM.d / 2, BOARD_TOP + 3.2]),
  ssd: spot([SSD.x + 22, SSD.y + SSD.d / 2, BOARD_TOP + 2.2]),
};

const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label:
    "An Intel N100 mini PC with its lid lifted: a blower fan and fin stack over the CPU, one RAM stick and an M.2 SSD on the board. This box runs CodeBite and the model behind this chat.",
  body: [lid(), feet(), shell(), front(), side(), cavity()],
});

const file = `// Generated by scripts/n100/build.mjs. Do not edit by hand.
export const N100_SVG = ${JSON.stringify(svg)};
export const N100_SIZE = { width: ${WIDTH}, height: ${HEIGHT} } as const;
export const N100_SPOTS = ${JSON.stringify(SPOTS)} as const;
`;
writeFileSync(OUT, file);
console.log("wrote", OUT, `${(svg.length / 1024).toFixed(1)} KB`, SPOTS);
