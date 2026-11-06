import type { Content } from './types';

export const en: Content = {
  ui: {
    wordmark: 'Kyu',
    greeting: "Hey, I'm Kyu-seok 👋",
    title: 'Backend Engineer',
    placeholder: 'Ask me anything…',
    send: 'Send',
    chips: {
      me: 'Me',
      projects: 'Projects',
      skills: 'Skills',
      fun: 'Fun',
      contact: 'Contact',
    },
    chipQuestions: {
      me: 'Who are you?',
      projects: 'What have you built?',
      skills: 'What do you work with?',
      fun: 'What do you do for fun?',
      contact: 'How can I reach you?',
    },
    toggleLabel: 'Switch to Korean',
    thinking: 'Kyu is typing',
    scriptedNote: 'Scripted, not AI. Every answer here was written by Kyu.',
    suggestionsLead: 'Try one of these:',
    prev: 'Previous project',
    next: 'Next project',
    open: 'Open',
    more: 'More about this',
    less: 'Show less',
    lessons: 'lessons',
    refs: 'reference sheets',
    you: 'You',
    assistantName: 'Kyu',
    avatarAlt: 'Kyu-seok Yeum',
    newChat: 'Start over',
  },
  replies: {
    hello: [
      "Hi! I'm a scripted version of Kyu. Nothing here is generated: every answer was written by him ahead of time.",
      'Pick a question below, or type one.',
    ],
    unknown: [
      "I can't answer that one. This chat is scripted, not an AI, so it only knows a handful of questions.",
      'For anything else, email Kyu directly. He reads it.',
    ],
    me: [
      "I'm Kyu-seok, a backend engineer in Seoul. I believe every slow system is telling you something; you just have to know where to listen.",
      "A queue doesn't just move messages, it buys you time when traffic spikes. A cache protects the database from questions it already answered. An index changes which questions are cheap to ask. I design systems by understanding what each part is really doing, then putting the right ones in the right places.",
      "Lately I've been building and operating CodeBite end to end on a mini PC at home, and studying for the Confluent Kafka developer certification (CCDAK).",
    ],
    projects: [
      'Two of these are running in production right now. Swipe through:',
      'The one I am proudest of is CodeBite. The hardest part was cutting submission-to-result latency from over 30 seconds to 1.9 seconds: batching test cases, reusing connections, and replacing polling with push.',
    ],
    skills: [
      'This is what I work with day to day. The list matters less to me than knowing what each tool is actually doing for the system.',
    ],
    fun: [
      'Outside shipping code, I keep a public second brain. Every topic I study gets written up as lessons, connected to what it requires and extends, and quizzed on a spaced-repetition schedule.',
      "Here's what is in it right now.",
    ],
    contact: [
      "Email is the fastest way to reach me. I'm also on GitHub and LinkedIn.",
    ],
  },
  me: {
    facts: [
      { label: 'Based in', value: 'Seoul, Korea' },
      { label: 'Focus', value: 'Java · Spring Boot · Kafka' },
      { label: 'Right now', value: 'Running CodeBite, prepping CCDAK' },
    ],
  },
  projects: [
    {
      id: 'codebite',
      name: 'CodeBite',
      tagline: 'An algorithm practice platform built on deliberate practice, in Korean.',
      description: [
        '200 curated problems in three tiers (CB50 / CB100 / CB200), a prerequisite roadmap across 19 topics, a Monaco workspace with Vim keys, and Anki-style spaced review so the problems you struggle with come back sooner.',
        'Submissions go through Kafka to a Judge0 worker and results are pushed back over SSE. Three Spring Boot instances behind Nginx, on one mini PC at home.',
      ],
      stack: ['Java', 'Spring Boot', 'Kafka', 'PostgreSQL', 'Redis', 'Judge0', 'React', 'TypeScript', 'Nginx', 'Docker', 'Grafana'],
      links: [
        { label: 'code-bite.com', href: 'https://code-bite.com/' },
        { label: 'GitHub', href: 'https://github.com/Kyu-seok/CodeBite' },
      ],
      cover: '/projects/codebite-landing.jpg',
      coverAlt: 'CodeBite landing page: "Practice is about quality, not quantity"',
      status: 'In production',
    },
    {
      id: 'kyu-rios',
      name: 'kyu-rios',
      tagline: 'Everything I have learned, published as a graph you can review.',
      description: [
        'Topics, lessons and reference sheets with typed relationships (requires, extends, contrasts-with), plus spaced-repetition review of every lesson quiz, running in the browser.',
        'Generated from /teach workspaces with Astro. 5 topics, 26 lessons and 232 review cards so far.',
      ],
      stack: ['Astro', 'TypeScript', 'Vitest', 'Playwright', 'GitHub Pages'],
      links: [
        { label: 'kyu-seok.github.io/kyu-rios', href: 'https://kyu-seok.github.io/kyu-rios/' },
        { label: 'GitHub', href: 'https://github.com/Kyu-seok/kyu-rios' },
      ],
      cover: '/projects/kyu-rios.jpg',
      coverAlt: 'kyu-rios knowledge graph with five topic clusters',
      status: 'Live',
    },
    {
      id: 'vimtext',
      name: 'VimText',
      tagline: 'Vim modal editing for every textarea on the web.',
      description: [
        'Normal, Insert and Visual modes, motions, operators, text objects, dot-repeat and search, plus ports of vim-surround and targets.vim. Manifest V3.',
        'Plain JavaScript modules bundled by a tiny dependency-free script. Zero npm dependencies.',
      ],
      stack: ['JavaScript', 'Chrome MV3'],
      links: [{ label: 'GitHub', href: 'https://github.com/Kyu-seok/VimText' }],
      cover: '/projects/vimtext.svg',
      coverAlt: 'A web textarea in Vim normal mode',
      status: 'MVP',
    },
    {
      id: 'wedding-ledger',
      name: 'Wedding Gift Ledger',
      tagline: 'A keyboard-only ledger for a wedding reception desk.',
      description: [
        'Built the day before a relative’s wedding with Claude Code. Name, amount, Enter: one envelope in three seconds, running only on the local machine, exported to Excel at the end.',
        'Records are protected four ways. Unsaved entries queue in the browser and sync when the server comes back; tested by killing the server mid-entry.',
      ],
      stack: ['JavaScript', 'Two dependencies', 'No build tool'],
      links: [{ label: 'GitHub', href: 'https://github.com/Kyu-seok/wedding-ledger' }],
      cover: '/projects/wedding-ledger.png',
      coverAlt: 'Wedding gift ledger entry screen',
      status: 'Used once, worked',
    },
  ],
  skills: {
    groups: [
      { label: 'Backend', items: ['Java', 'Spring Boot'] },
      { label: 'Infrastructure', items: ['Docker', 'Nginx', 'Apache Kafka', 'Redis'] },
      { label: 'Databases', items: ['PostgreSQL', 'MySQL'] },
      { label: 'Observability', items: ['Prometheus', 'Grafana', 'Loki'] },
      { label: 'CI/CD', items: ['GitHub Actions'] },
      { label: 'Frontend, when needed', items: ['TypeScript', 'React', 'Vite', 'Astro'] },
      { label: 'Daily tools', items: ['Vim', 'Claude Code'] },
    ],
  },
  fun: {
    title: 'kyu-rios, a public second brain',
    stats: [
      { label: 'Topics', value: '5' },
      { label: 'Lessons', value: '26' },
      { label: 'Review cards', value: '232' },
    ],
    topics: [
      { name: 'Agent Orchestration', lessons: 5, refs: 3, color: '#2563eb' },
      { name: 'AI Engineering 101', lessons: 6, refs: 6, color: '#ea6a12' },
      { name: 'Git Workflow', lessons: 5, refs: 2, color: '#0f9d58' },
      { name: 'Kafka', lessons: 2, refs: 3, color: '#dc2626' },
      { name: "Matt Pocock's Skills", lessons: 8, refs: 7, color: '#7c3aed' },
    ],
    link: { label: 'Open the graph', href: 'https://kyu-seok.github.io/kyu-rios/' },
    coverAlt: 'kyu-rios knowledge graph',
  },
  contact: {
    items: [
      { kind: 'email', label: 'Email', value: 'yeumkyuseok@gmail.com', href: 'mailto:yeumkyuseok@gmail.com' },
      { kind: 'github', label: 'GitHub', value: 'github.com/Kyu-seok', href: 'https://github.com/Kyu-seok' },
      { kind: 'linkedin', label: 'LinkedIn', value: 'linkedin.com/in/kyuseok', href: 'https://www.linkedin.com/in/kyuseok/' },
      { kind: 'site', label: 'CodeBite', value: 'code-bite.com', href: 'https://code-bite.com/' },
    ],
  },
};
