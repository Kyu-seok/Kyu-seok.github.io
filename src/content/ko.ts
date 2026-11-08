import type { Content } from './types';

export const ko: Content = {
  ui: {
    wordmark: 'Kyu',
    greeting: '안녕하세요, 규석입니다 👋',
    title: '소프트웨어 엔지니어',
    placeholder: '무엇이든 물어보세요…',
    send: '보내기',
    chips: {
      me: '소개',
      projects: '프로젝트',
      skills: '기술',
      fun: '취미',
      contact: '연락',
    },
    chipQuestions: {
      me: '어떤 사람인가요?',
      projects: '무엇을 만들었나요?',
      skills: '어떤 기술을 쓰나요?',
      fun: '일 말고는 뭘 하나요?',
      contact: '어떻게 연락하면 되나요?',
    },
    toggleLabel: 'Switch to English',
    thinking: '규석이 입력 중',
    scriptedNote: '칩 답변은 규석이 미리 써 둔 대본입니다. 직접 입력한 질문은 규석의 미니 PC에서 도는 Qwen3가 답하고, 질문은 기록됩니다.',
    suggestionsLead: '이런 질문을 해 보세요:',
    prev: '이전 프로젝트',
    next: '다음 프로젝트',
    open: '열기',
    more: '자세히 보기',
    less: '접기',
    lessons: '레슨',
    refs: '참고 시트',
    you: '나',
    assistantName: '규석',
    avatarAlt: '염규석',
    newChat: '처음으로',
    howQuestion: '이 채팅은 어떻게 동작하나요?',
    stamp: {
      generated: '규석의 미니 PC에서 {model}이 생성',
      scripted: '규석이 직접 쓴 답변',
      how: '어떻게 동작하나요?',
    },
  },
  replies: {
    hello: [
      '안녕하세요! 아래 질문 중 하나를 고르거나 직접 입력해 보세요. 칩 답변은 제가 미리 써 둔 대본이고, 직접 물어보면 미니 PC의 작은 모델이 답합니다.',
    ],
    unknown: [
      '지금은 그 질문에 답하지 못해요. 미니 PC의 모델이 바쁘거나 쉬고 있고, 대본으로 된 부분은 정해진 질문만 알거든요.',
      '다른 궁금한 점은 이메일로 직접 보내 주세요. 꼭 읽습니다.',
    ],
    how: [
      '칩 답변은 제가 미리 써 둔 대본입니다. 질문을 직접 입력하면 CodeBite 채점이 돌아가는 바로 그 Intel N100 미니 PC에서 llama.cpp로 띄운 Qwen3-1.7B 모델이 답하고, 그 앞에 작은 Go 게이트웨이가 있습니다.',
      '모델은 제가 쓴 팩트 시트만 알고, 생성된 답변에는 속도가 표시됩니다. 4초 안에 첫 단어가 오지 않으면 대본 답변을 보여 줍니다. Java 채점 중에는 채점이 CPU를 먼저 쓰기 때문에 그렇게 됩니다.',
      '배포 전에 Qwen3-4B와 1.7B를 직접 재봤습니다. 4B는 이 CPU에서 초당 3.8 토큰이라 채팅처럼 느껴지기엔 너무 느렸고, 1.7B는 약 9 토큰입니다. 1.7B의 한국어는 두 번 재봤는데 두 번 다 제 기준에는 못 미쳤습니다. 그래도 실제 질문에서 어떤지 보려고 한국어 생성을 켰고, 한국어 질문은 40자, 답변은 두세 문장으로 제한했습니다. 모든 질문은 팩트 시트를 개선하기 위해 기록됩니다.',
    ],
    me: [
      '서울에서 일하는 백엔드 엔지니어 염규석입니다. 느린 시스템은 항상 무언가를 말하고 있다고 믿습니다. 어디서 들어야 하는지만 알면 됩니다.',
      '큐는 메시지를 옮기는 게 아니라, 트래픽이 몰릴 때 시간을 벌어 줍니다. 캐시는 데이터베이스가 이미 답한 질문을 다시 받지 않게 지켜 줍니다. 인덱스는 어떤 질문이 싼 질문인지를 바꿉니다. 각 구성 요소가 실제로 무슨 일을 해 주는지 이해한 다음 맞는 자리에 놓는 방식으로 시스템을 설계합니다.',
      '요즘은 집에 있는 미니 PC 한 대에서 CodeBite를 처음부터 끝까지 직접 만들고 운영하고 있고, CCDAK(Confluent Kafka 개발자 자격) 시험을 준비하고 있습니다.',
    ],
    projects: [
      '이 중 둘은 지금도 실제로 돌아가고 있어요. 넘겨 보세요:',
      '가장 자신 있는 건 CodeBite입니다. 제일 어려웠던 건 제출 후 결과까지 30초가 넘던 지연을 1.9초로 줄이는 일이었어요. 테스트케이스를 묶어서 보내고, 연결을 재사용하고, 폴링을 푸시로 바꿨습니다.',
    ],
    skills: [
      '매일 쓰는 도구들입니다. 목록 자체보다, 각 도구가 시스템에서 실제로 무슨 일을 해 주는지 아는 걸 더 중요하게 생각해요.',
    ],
    fun: [
      '코드를 배포하는 일 말고는, 공개 세컨드 브레인을 가꿉니다. 공부한 주제마다 레슨으로 정리하고, 선행·확장 관계로 연결하고, 간격 반복으로 퀴즈를 풉니다.',
      '지금 들어 있는 내용은 이렇습니다.',
    ],
    contact: [
      '이메일이 가장 빠릅니다. GitHub과 LinkedIn에도 있어요.',
    ],
  },
  me: {
    facts: [
      { label: '위치', value: '서울' },
      { label: '주력', value: 'Java · Spring Boot · Kafka' },
      { label: '지금', value: 'CodeBite 운영, CCDAK 준비' },
    ],
  },
  projects: [
    {
      id: 'codebite',
      name: 'CodeBite',
      tagline: '의도적 연습을 위한 알고리즘 학습 플랫폼.',
      description: [
        '한국어로 번역된 200문제를 CB50 / CB100 / CB200 세 단계로 큐레이션하고, 19개 토픽을 선행 관계로 엮은 학습 로드맵, Vim 키바인딩을 지원하는 Monaco 워크스페이스, 막힌 문제가 더 빨리 돌아오는 Anki 방식의 간격 반복 복습을 제공합니다.',
        '제출은 Kafka를 거쳐 Judge0 워커가 채점하고, 결과는 SSE로 브라우저에 밀어줍니다. Nginx 뒤에 Spring Boot 3대, 집에 있는 미니 PC 한 대에서 돌아갑니다.',
      ],
      stack: ['Java', 'Spring Boot', 'Kafka', 'PostgreSQL', 'Redis', 'Judge0', 'React', 'TypeScript', 'Nginx', 'Docker', 'Grafana'],
      links: [
        { label: 'code-bite.com', href: 'https://code-bite.com/' },
        { label: 'GitHub', href: 'https://github.com/Kyu-seok/CodeBite' },
      ],
      cover: '/projects/codebite-landing.jpg',
      coverAlt: 'CodeBite 랜딩 페이지: "연습은 양이 아니라 질입니다"',
      status: '운영 중',
    },
    {
      id: 'kyu-rios',
      name: 'kyu-rios',
      tagline: '배운 모든 것을 복습할 수 있는 그래프로 공개합니다.',
      description: [
        '토픽, 레슨, 참고 시트를 선행·확장·대조 관계로 연결한 그래프와, 모든 레슨 퀴즈의 간격 반복 복습이 브라우저 안에서 돌아갑니다.',
        '/teach 워크스페이스에서 Astro로 생성합니다. 지금까지 5개 토픽, 26개 레슨, 232장의 복습 카드.',
      ],
      stack: ['Astro', 'TypeScript', 'Vitest', 'Playwright', 'GitHub Pages'],
      links: [
        { label: 'kyu-seok.github.io/kyu-rios', href: 'https://kyu-seok.github.io/kyu-rios/' },
        { label: 'GitHub', href: 'https://github.com/Kyu-seok/kyu-rios' },
      ],
      cover: '/projects/kyu-rios.jpg',
      coverAlt: '다섯 개 토픽 클러스터가 보이는 kyu-rios 지식 그래프',
      status: '공개 중',
    },
    {
      id: 'vimtext',
      name: 'VimText',
      tagline: '웹의 모든 textarea에 Vim 모달 편집을.',
      description: [
        'Normal · Insert · Visual 모드, 모션, 오퍼레이터, 텍스트 오브젝트, 점 반복, 검색에 vim-surround와 targets.vim 포팅까지. Manifest V3.',
        '순수 JavaScript 모듈을 의존성 없는 작은 스크립트로 번들합니다. npm 의존성 0개.',
      ],
      stack: ['JavaScript', 'Chrome MV3'],
      links: [{ label: 'GitHub', href: 'https://github.com/Kyu-seok/VimText' }],
      cover: '/projects/vimtext.svg',
      coverAlt: 'Vim normal 모드 상태의 웹 textarea',
      status: 'MVP',
    },
    {
      id: 'wedding-ledger',
      name: '축의금 접수 장부',
      tagline: '결혼식 접수대에서 키보드만으로 축의금을 기록합니다.',
      description: [
        '이모 결혼식 전날 Claude Code로 만들었습니다. 이름, 금액, Enter. 봉투 한 건에 3초, 내 컴퓨터에서만 돌아가고, 끝나면 엑셀로 내보냅니다.',
        '기록은 네 겹으로 지킵니다. 저장 못 한 기록은 브라우저에 쌓였다가 서버가 돌아오면 알아서 저장됩니다. 입력 도중 서버를 강제로 죽여 보며 확인했습니다.',
      ],
      stack: ['JavaScript', '의존성 2개', '빌드 도구 없음'],
      links: [{ label: 'GitHub', href: 'https://github.com/Kyu-seok/wedding-ledger' }],
      cover: '/projects/wedding-ledger.png',
      coverAlt: '축의금 접수 장부 입력 화면',
      status: '한 번 썼고, 잘 됐음',
    },
  ],
  skills: {
    groups: [
      { label: '백엔드', items: ['Java', 'Spring Boot'] },
      { label: '인프라', items: ['Docker', 'Nginx', 'Apache Kafka', 'Redis'] },
      { label: '데이터베이스', items: ['PostgreSQL', 'MySQL'] },
      { label: '관측', items: ['Prometheus', 'Grafana', 'Loki'] },
      { label: 'CI/CD', items: ['GitHub Actions'] },
      { label: '필요할 때 프런트엔드', items: ['TypeScript', 'React', 'Vite', 'Astro'] },
      { label: '매일 쓰는 도구', items: ['Vim', 'Claude Code'] },
    ],
  },
  fun: {
    title: 'kyu-rios, 공개 세컨드 브레인',
    stats: [
      { label: '토픽', value: '5' },
      { label: '레슨', value: '26' },
      { label: '복습 카드', value: '232' },
    ],
    topics: [
      { name: 'Agent Orchestration', lessons: 5, refs: 3, color: '#2563eb' },
      { name: 'AI Engineering 101', lessons: 6, refs: 6, color: '#ea6a12' },
      { name: 'Git Workflow', lessons: 5, refs: 2, color: '#0f9d58' },
      { name: 'Kafka', lessons: 2, refs: 3, color: '#dc2626' },
      { name: "Matt Pocock's Skills", lessons: 8, refs: 7, color: '#7c3aed' },
    ],
    link: { label: '그래프 열기', href: 'https://kyu-seok.github.io/kyu-rios/' },
    coverAlt: 'kyu-rios 지식 그래프',
  },
  contact: {
    items: [
      { kind: 'email', label: '이메일', value: 'yeumkyuseok@gmail.com', href: 'mailto:yeumkyuseok@gmail.com' },
      { kind: 'github', label: 'GitHub', value: 'github.com/Kyu-seok', href: 'https://github.com/Kyu-seok' },
      { kind: 'linkedin', label: 'LinkedIn', value: 'linkedin.com/in/kyuseok', href: 'https://www.linkedin.com/in/kyuseok/' },
      { kind: 'site', label: 'CodeBite', value: 'code-bite.com', href: 'https://code-bite.com/' },
    ],
  },
};
