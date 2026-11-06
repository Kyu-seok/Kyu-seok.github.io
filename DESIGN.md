---
name: Kyu-seok Yeum Portfolio
description: A portfolio you talk to. One scripted conversation on cool paper, one orange accent, Pretendard in both languages.
colors:
  ground: "#f6f7f9"
  surface: "#ffffff"
  surface-2: "#f1f3f6"
  line: "#e2e6ec"
  line-strong: "#cfd5de"
  ink: "#0f1419"
  ink-2: "#525c6a"
  ink-3: "#66707e"
  accent: "#ea6a12"
  accent-ink: "#b14d08"
  accent-soft: "#fde9d8"
  accent-soft-2: "#fbd7b8"
  chip-amber: "#d97706"
  chip-green: "#0f9d58"
  chip-blue: "#2563eb"
  chip-violet: "#7c3aed"
  chip-red: "#dc2626"
typography:
  display:
    fontFamily: "Pretendard Variable, Pretendard, -apple-system, BlinkMacSystemFont, Apple SD Gothic Neo, Segoe UI, Roboto, Noto Sans KR, sans-serif"
    fontSize: "clamp(2.25rem, 7vw, 3rem)"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Pretendard Variable, Pretendard, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  title:
    fontFamily: "Pretendard Variable, Pretendard, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.3
    letterSpacing: "-0.02em"
  stat:
    fontFamily: "Pretendard Variable, Pretendard, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.1
    letterSpacing: "-0.02em"
    fontVariation: "tabular-nums"
  body:
    fontFamily: "Pretendard Variable, Pretendard, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "0em"
    fontFeature: "'ss01', 'tnum'"
  body-sm:
    fontFamily: "Pretendard Variable, Pretendard, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.55
  label:
    fontFamily: "Pretendard Variable, Pretendard, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 600
    lineHeight: 1.4
  caption:
    fontFamily: "Pretendard Variable, Pretendard, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1.4
rounded:
  control: "8px"
  icon-tile: "10px"
  row: "14px"
  chip: "16px"
  card: "20px"
  pill: "999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  2xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.surface}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "8px 14px"
  button-primary-hover:
    backgroundColor: "#232a33"
    textColor: "{colors.surface}"
  button-send:
    backgroundColor: "{colors.accent}"
    textColor: "{colors.surface}"
    rounded: "{rounded.pill}"
    size: "40px"
  button-send-hover:
    backgroundColor: "#d95f0e"
    textColor: "{colors.surface}"
  button-icon:
    backgroundColor: "transparent"
    textColor: "{colors.ink-2}"
    rounded: "{rounded.pill}"
    size: "36px"
  button-icon-hover:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink}"
  button-icon-solid:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.pill}"
    size: "36px"
  chip:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-2}"
    typography: "{typography.label}"
    rounded: "{rounded.chip}"
    padding: "12px 8px"
  chip-hover:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
  chip-active:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.accent-ink}"
  chip-compact:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-2}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "8px 14px 8px 12px"
  composer:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.pill}"
    padding: "6px 6px 6px 20px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
    padding: "14px 16px 16px"
  tag:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink-2}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    padding: "3px 9px"
  status-badge:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.accent-ink}"
    rounded: "{rounded.pill}"
    padding: "2px 8px"
  bubble-user:
    backgroundColor: "{colors.accent-soft}"
    textColor: "{colors.ink}"
    rounded: "20px 20px 6px 20px"
    padding: "10px 16px"
  lang-toggle:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink-3}"
    typography: "{typography.caption}"
    rounded: "{rounded.pill}"
    height: "32px"
    padding: "0 10px"
---

# Design System: Kyu-seok Yeum Portfolio

## Overview

**Creative North Star: "The Paper Conversation"**

The whole site is one chat with Kyu on a sheet of cool paper. There is no page chrome to speak of: a 56px top bar, a centered 640px column, and a dock at the bottom holding the composer and five quick-action chips. Everything the visitor sees is either a message in the thread or a control for sending the next one. White surfaces sit on a blue-gray ground (#f6f7f9) with a faint radial lift behind the hero, so cards read as paper laid on paper rather than panels on a screen.

The system is light-only and quiet. Pretendard Variable carries Latin and Hangul in one voice; the display title is heavy and tightly tracked, body copy is regular at 1.6 line-height, and numerals are tabular everywhere. One accent, CodeBite orange (#ea6a12), does all the pointing: the send disc, the active chip, the user's bubble, link underlines, caret, selection, and focus rings. The only other hues on the page are the five resting chip icons (amber, green, blue, violet, red), and those give the single accent back the moment a chip is active.

Motion is one grammar used once per transition: ease-out expo, 12px rise, 420ms. The signature move is the fold, where the hero collapses into the top bar on the first question and the composer becomes a sticky dock. Nothing is glass, nothing is blurred, nothing is a gradient except the ground lift and the dock's fade into the ground.

**Key Characteristics:**
- Single centered column, max 640px, same width for top bar, hero, thread, and dock.
- Paper-on-paper surfaces: pure white, 1px tinted hairline, soft offset shadow at rest, lifted shadow on hover or focus.
- One accent (CodeBite orange) for every pointing device; five chip hues only on resting chip icons and the kyu-rios topic dots.
- Pill geometry for inputs, buttons, tags, and compact chips; 20px for cards; 16px for the hero chips.
- Pretendard Variable at 700 for anything that names something, 600 for labels, 400 for prose.
- Authored 24-viewbox SVG icons at 1.75 stroke, round caps and joins; GitHub and LinkedIn marks are the only filled glyphs.
- One motion curve (`cubic-bezier(0.16, 1, 0.3, 1)`) and one duration (420ms) for entrances; 160ms linear for color hovers.

## Colors

A blue-gray paper ground, pure white surfaces, near-black ink with two blue-gray secondary inks, and one orange accent with two tints and one deep for text.

### Primary
- **CodeBite Orange** (`accent`): the flagship project's brand color. Owns the send disc background, the caret and `accent-color`, focus-visible outlines, link underline on hover, the topbar and message avatars' fill in the placeholder art.
- **Orange Ink** (`accent-ink`): the accent darkened for text on light surfaces. Link color, active chip text, project status badge text, project "more" toggle, contact icon tile glyph.
- **Orange Paper** (`accent-soft`): user bubble background, active chip background, status badge background, contact icon tile, avatar backing while an image loads.
- **Orange Paper Edge** (`accent-soft-2`): the hairline around the user bubble and the active chip, the resting link underline, text selection background, and the focused project card's border.

### Neutral
- **Cool Paper** (`ground`): page background, top bar background, and the bottom of the dock's fade. The hero sits on a radial lift of pure white (60% x 40% at 50% 18%) over it.
- **Paper White** (`surface`): every card, chip, composer, solid icon button, and lang toggle. Also the text color on ink and accent fills.
- **Paper Shade** (`surface-2`): tags, project and fun cover backdrops, hover wash on wordmark, icon buttons, and contact rows.
- **Hairline** (`line`): 1px border on every surface; row dividers inside the facts, skills, fun-topics, and contact lists; the top bar's bottom edge in chat mode.
- **Hairline Strong** (`line-strong`): hover border for chips, composer focus-within, solid icon buttons, and lang toggle; the lang toggle separator; scrollbar thumb.
- **Ink** (`ink`): body text, titles, primary button background, `.btn` fill.
- **Ink Secondary** (`ink-2`): hero greeting, resting chip label, tag text, project description, icon buttons at rest.
- **Ink Tertiary** (`ink-3`): placeholder, captions, fact and contact labels, lang toggle off-state, typing dots, dock note.

### Chip Hues (resting icons only)
- **Amber** (`chip-amber`): Me chip icon.
- **Green** (`chip-green`): Projects chip icon.
- **Blue** (`chip-blue`): Skills chip icon.
- **Violet** (`chip-violet`): Fun chip icon.
- **Red** (`chip-red`): Contact chip icon.
The same five values (with the accent as the sixth) color the 10px topic dots in the kyu-rios fun card, as data from that project. Active chips drop their hue and inherit `accent-ink`.

### Named Rules
**The One Orange Rule.** Every device that points, selects, or confirms is CodeBite orange or one of its three derivatives. No second accent exists; the chip hues are icon-only and die on activation.

**The Ink-On-Paper Rule.** Primary call-to-action buttons are ink (#0f1419), not orange. Orange is reserved for the send disc so the composer stays the loudest control on the page.

## Typography

**Display Font:** Pretendard Variable (self-hosted via the `pretendard` npm package, dynamic subset), falling back to Pretendard, -apple-system, Apple SD Gothic Neo, Segoe UI, Roboto, Noto Sans KR, sans-serif
**Body Font:** same family
**Label/Mono Font:** none; numerals are made tabular with `font-feature-settings: 'ss01', 'tnum'` on body

**Character:** One family at variable weights carries both Korean and English, so the KO/EN toggle changes words but not voice. Heavy, tightly tracked titles against relaxed 1.6 body; `word-break: keep-all` keeps Hangul words intact and `text-wrap: balance` on the display title.

### Hierarchy
- **Display** (700, clamp(2.25rem, 7vw, 3rem), 1.1, -0.03em): the hero title only ("Backend Engineer" / "백엔드 엔지니어").
- **Headline** (700, 1.25rem, 1.2, -0.02em): project card names.
- **Title** (700, 1.125rem, -0.02em): wordmark "Kyu" and the fun card title.
- **Stat** (700, 1.5rem, 1.1, -0.02em, tabular-nums): the three kyu-rios numbers.
- **Body** (400, 1rem, 1.6): thread paragraphs (max 62ch), composer input, contact values (600), user bubble (500), hero greeting (500, 1.125rem, ink-2).
- **Body Small** (400 or 500, 0.875rem to 0.9375rem, 1.5 to 1.55): project tagline (500, 0.9375rem), project description (0.875rem, ink-2), fact values (600, 0.9375rem), fun topic names (600, 0.9375rem).
- **Label** (600, 0.8125rem): chip labels, large tags, skills group names, suggestion lead, project "more" toggle, fun topic meta.
- **Caption** (600, 0.75rem): tags, fact and stat and contact labels, dock note; lang toggle and status badge go to 700 (status at 0.6875rem).

### Named Rules
**The Weight-Is-Hierarchy Rule.** Size steps are small (0.6875 to 1.5rem outside the hero); hierarchy comes from 700 / 600 / 500 / 400 and from ink / ink-2 / ink-3, not from size alone.

**The No-Caps Rule.** Nothing is uppercased or letter-spaced open; labels stay sentence-case at 600 and shrink instead.

## Layout

One centered column: `max-width: 640px + 2 x 16px gutter`, identical for the top bar inner, the stage, and the dock, so the composer, chips, cards, and header all share edges. The app is a full-height flex column (`min-height: 100dvh`); in hero mode the hero takes `margin-top: auto` and the dock `margin-bottom: auto`, centering the hero-plus-dock block vertically. In chat mode (`.is-chat`) the hero collapses to a 0fr grid row, the thread takes `flex: 1`, and the dock becomes `position: sticky; bottom: 0` with a ground-colored fade above it and `env(safe-area-inset-bottom)` padding.

Top bar: 56px, sticky, opaque ground, a transparent bottom hairline that becomes `line` in chat mode. Left: a 36px avatar that is width 0 and hidden in hero mode, wordmark, and a restart icon button in chat; right: lang toggle, GitHub, LinkedIn.

Hero: centered stack with `clamp(24px, 6vh, 56px)` top padding, 4px between greeting and title, `clamp(20px, 4vh, 36px)` above a 200px circular avatar (160px under 480px).

Dock: 12px vertical gap between composer, chips, and the dock note; chips sit below the composer in hero mode and above it in chat (`order` swap). Hero chips are a 5-column grid with 8px gap; under 480px they become a wrapping flex row at `calc((100% - 16px) / 3)` each, giving three on top and two centered beneath. Compact chips are a horizontally scrolling row with hidden scrollbars.

Thread: 18px gap between messages; assistant messages are a `32px minmax(0, 1fr)` grid with 10px gap (avatar beside body); user bubbles align right at `min(80%, 480px)`; body paragraphs max 62ch, 12px gap between paragraphs and cards. New messages get `scroll-margin-top: 56px + 16px` so answers land under the top bar.

Cards: project cards are `flex: 0 0 min(300px, 84%)` in a scroll-snap carousel with 12px gap and prev/next solid icon buttons right-aligned 6px below. Facts are a 3-column grid with 1px vertical dividers (stacked with horizontal dividers under 520px). Skills rows are `148px minmax(0, 1fr)` (single column under 480px). Contact rows are `36px minmax(0, 1fr) 16px` with 12px gap.

Spacing rhythm: 4 / 6 / 8 / 10 / 12 / 14 / 16 / 18 / 20 / 24px, with 8 and 12 doing most of the work. Breakpoints: 480px (chips, skills, hero avatar) and 520px (facts).

## Elevation & Depth

Hybrid: tonal layering (ground, surface, surface-2) plus two soft, downward-biased shadows. Every resting surface carries a 1px `line` border and the card shadow; hover and focus swap to the float shadow and a 1 to 2px lift. There is no blur, no backdrop-filter, and no shadow on compact chips, tags, or the user bubble, which are flat tonal shapes.

### Shadow Vocabulary
- **Card** (`box-shadow: 0 1px 2px rgba(15, 20, 25, 0.04), 0 10px 28px -14px rgba(15, 20, 25, 0.22)`): resting state for cards, project cards, hero chips, the composer, and solid icon buttons.
- **Float** (`box-shadow: 0 2px 4px rgba(15, 20, 25, 0.05), 0 16px 40px -18px rgba(15, 20, 25, 0.28)`): the hero avatar at rest; chips on hover; the composer on focus-within.

### Named Rules
**The Lift-On-Intent Rule.** Shadows deepen only in response to hover or focus, and always together with a `translateY(-1px)` (buttons) or `translateY(-2px)` (chips) on the 300ms ease-out curve. Nothing floats at rest except the hero avatar.

**The Ink-Tinted Shadow Rule.** Shadows are tinted with the ink color (rgba 15, 20, 25), never neutral black, and carry a negative spread so they read as a soft offset, not a glow.

## Shapes

Two geometries. Pills (999px) for everything hand-sized: the composer, primary buttons, tags, status badge, lang toggle, compact chips, and the 36 to 40px circular icon buttons, send disc, and avatars. Rounded rectangles for containers: 20px for cards and project cards, 16px for the hero chips, 14px for contact rows, 10px for the contact icon tile, 8px for the wordmark's hover wash, 6px for focus rings. Message bubbles are 20px with one 6px corner pointing at the speaker (bottom-right for the user, bottom-left for the typing indicator). Every container carries a 1px hairline; covers are clipped by `overflow: hidden` and separated from the card body by a hairline. Icons live in a 24-unit viewbox at 1.75 stroke with round caps and joins; rects inside icons use a 2.5 radius.

## Components

### Buttons
Tactile and restrained: dark pills that lift a pixel on hover.
- **Shape:** pill (999px)
- **Primary (`.btn`):** ink background, white text, 600 at 0.875rem, 8px 14px padding, 6px gap to a 16px external-link icon. Used for project links and the kyu-rios link.
- **Hover / Focus:** background to #232a33, `translateY(-1px)` over 300ms ease-out; focus-visible is the global 2px accent outline, 2px offset.
- **Send (`.composer-send`):** 40px accent disc with a white 20px up-arrow; hover to #d95f0e with the same lift; disabled at 0.4 opacity when the input is empty.
- **Icon (`.iconbtn`):** 36px transparent circle, ink-2 glyph; hover washes to surface-2 and ink. Used for GitHub, LinkedIn, and restart in the top bar.
- **Icon Solid (`.iconbtn-solid`):** the same circle on surface with hairline and card shadow; hover lifts 1px and strengthens the border; disabled at 0.38 opacity without shadow. Used for carousel prev/next.
- **Text (`.pcard-toggle`):** accent-ink label at 0.8125rem/600 with a 16px chevron that rotates 180deg when open; underline on hover.

### Chips
Five quick actions; the primary action of the first viewport.
- **Hero style:** surface, hairline, 16px radius, card shadow, 72px min height, 12px 8px padding, icon (20px) stacked over label (0.8125rem/600, ink-2) with 6px gap. Each chip's resting icon takes its own hue.
- **Hover:** `translateY(-2px)`, float shadow, border to line-strong, label to ink.
- **Active (`aria-pressed`):** accent-soft background, accent-soft-2 border, accent-ink text; the icon drops its hue and inherits.
- **Compact (chat mode and inline suggestions):** horizontal pill, 16px icon beside label, 8px 14px 8px 12px padding, no shadow and no lift. Inline suggestions inside a hello/unknown answer regain the card shadow.

### Cards / Containers
Paper on paper.
- **Corner Style:** 20px
- **Background:** surface with a 1px hairline
- **Shadow Strategy:** card shadow at rest (see Elevation); project cards only change border color (to accent-soft-2) when focused by a question, never shadow.
- **Internal Padding:** 14px 16px 16px for project bodies; 16px 18px 18px for skills and fun; 4px outer with 12px 14px per cell for facts and 10px 12px per row for contact.
- **Covers:** 16/10 aspect for projects, 16/7 for the fun card, surface-2 backdrop, hairline below.
- **Tags:** surface-2 pills, ink-2, 0.75rem/600, 3px 9px (0.8125rem and 4px 11px in the skills card).
- **Status badge:** accent-soft pill, accent-ink, 0.6875rem/700, 2px 8px.

### Inputs / Fields
- **Style:** the composer is a surface pill with hairline and card shadow, 6px padding (20px on the left), a borderless 40px-tall transparent input at 1rem with ink-3 placeholder, and the send disc at the right.
- **Focus:** `focus-within` strengthens the border to line-strong and swaps to the float shadow over 300ms; the input itself has no outline.
- **Disabled:** only the send disc disables (0.4 opacity) while the input is empty.

### Navigation
- Top bar is sticky, 56px, opaque ground; its bottom hairline is transparent in hero mode and `line` in chat mode (420ms transition).
- Wordmark "Kyu" at 1.125rem/700, -0.02em, 6px 8px padding, 8px radius, surface-2 wash on hover; it restarts the chat.
- Lang toggle: 32px surface pill, hairline, "KO | EN" at 0.75rem/700 with +0.02em, ink-3 with the active language in ink, a 1px x 12px line-strong separator.
- GitHub and LinkedIn are icon buttons; a restart icon button fades in beside the wordmark in chat mode.
- Mobile: no collapse; the same five controls fit at 390px.

### Thread (signature)
Assistant messages: 32px circular avatar left, body right, paragraphs max 62ch, cards stacked with 12px gap. User messages: accent-soft bubble with accent-soft-2 hairline, 20px radius with a 6px bottom-right corner, 500 weight, right-aligned. Typing indicator: a surface pill (20px with 6px bottom-left) holding three 7px ink-3 dots blinking on a 1.1s stagger; it shows for 520ms before an answer unless reduced motion is on. Each message enters with the rise animation (12px up, fade, 420ms, ease-out expo).

### The Fold (signature interaction)
On the first message `.is-chat` is set: the hero's grid row goes from 1fr to 0fr over 560ms while its inner block fades and shrinks (`translateY(-24px) scale(0.94)`); the top bar avatar grows from `scale(0.4)` and width 0 to 36px with a 120ms delay; the dock's chips reorder above the composer and go compact; the thread takes the freed height. All of it runs on the one ease-out curve; reduced motion collapses transitions to 0.01ms and skips the typing pause.

## Do's and Don'ts

### Do:
- **Do** keep every new surface inside the 640px column with 16px gutters; the top bar, thread, and dock share edges.
- **Do** build containers as surface + 1px `line` + card shadow + 20px radius, and lift to the float shadow only on hover or focus.
- **Do** use pills (999px) for any control a hand would press: buttons, tags, toggles, compact chips, inputs.
- **Do** make ink (#0f1419) the primary button fill and keep orange for the send disc, active states, and bubbles.
- **Do** author icons as 24-viewbox inline SVG at 1.75 stroke with round caps and joins, 20px in chips and controls, 16px inline with text, 18px inside 36px icon buttons.
- **Do** use the single motion grammar: `cubic-bezier(0.16, 1, 0.3, 1)` at 300 to 560ms for movement, 160ms linear for color, and respect `prefers-reduced-motion`.
- **Do** set type with weight and ink level before size; 700 names things, 600 labels, 500 speaks (bubbles, taglines), 400 reads.
- **Do** keep numerals tabular (`'tnum'` is on body; stats add `tabular-nums`) and keep Hangul words whole (`word-break: keep-all`).

### Don't:
- **Don't** add a second accent. The five chip hues belong to resting chip icons and the kyu-rios topic dots only; any active or interactive state is orange.
- **Don't** use blur, backdrop-filter, glass, or gradient text. The only gradients are the hero's radial white lift and the dock's fade into the ground.
- **Don't** ship a dark theme or a second color-scheme; the site is light-only by scene (`color-scheme: light`).
- **Don't** uppercase or track-out labels; shrink and embolden instead.
- **Don't** float anything at rest except the hero avatar; resting shadows are the card shadow, compact chips and tags carry none.
- **Don't** use emoji, icon fonts, or an icon package in place of the authored SVG set; the wave in the greeting is copy, not an icon.
- **Don't** introduce a second font family, including monospace; Pretendard Variable covers both languages.
