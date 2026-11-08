# Spike results: Qwen3 on the CodeBite mini PC (2026-11-07)

Box: Intel N100 (4 E-cores, AVX2, no AVX-512), 15 GiB RAM, governor `powersave` (intel_pstate, EPP balance_performance), 16 CodeBite containers running.
Server: `ghcr.io/ggml-org/llama.cpp:server` build 12182, `-c 4096 -np 1 -t 4 --cache-reuse 256`, container `--cpus 4 --cpu-shares 128`.
Prompt: `../facts.en.md` (1,785 tokens) as system prompt, thinking disabled, 8 questions (4 EN, 4 KO), see `bench.py`.
Gate (ADR 0001, Q6): first token < 2 s and a 120-token Korean answer < 20 s on an idle box.

## Idle box

| Run | Fact-sheet prefill (once) | First token p50 / max | Gen tok/s | 120-token KO answer | RAM |
|---|---|---|---|---|---|
| Qwen3-4B Q4_K_M | 127 s (14 tok/s) | 4.0 s / 8.2 s | 3.8 | ~40 s | 4.2 GiB |
| Qwen3-1.7B Q4_K_M | 49 s (36 tok/s) | 1.6 s / 2.7 s | 9.1 | ~16 s | 2.2 GiB |
| Qwen3-1.7B, v2 (examples, temp 0.3, short user turn) | +10 s (cache reuse) | 1.6 s / 3.8 s | 8.9 | ~16 s | 2.2 GiB |

Per-request prefill on this CPU is ~55 to 150 ms per token even with the prefix cached, so the length of the visitor's turn sets the first-token time: 20 tokens ≈ 1.3 s, 40 tokens ≈ 2.7 s (1.7B).

## During Java grading (6 submissions continuously in flight, 1.7B v2)

| Measure | Model idle | Model generating |
|---|---|---|
| Java submission wall time, median | 3.43 s | 4.50 s (+31%) |
| Model first token | 1.6 s | 22 s |
| Model generation | 8.9 tok/s | 0.5 tok/s |

`--cpu-shares 128` did not protect grading: the model still held ~85% of a core. The fallback would fire for the whole grading window, and grading itself got slower.

## Answer quality (see the `.jsonl` files for full text)

- 4B: declined experience and school correctly; still wrote the Python function; Korean "fun" answer invented "레벨 5" and "팀원들과 협업"; mixed English into Korean ("제 fastest way").
- 1.7B without examples: invented "about 3 years of experience"; wrote the code; Korean "fun" answer was generic and never mentioned kyu-rios; broken Korean ("나는 서울에서 나왔습니다", "가장 빠르게 나와 주는 방법").
- 1.7B with examples: declines now work, but by copying the example text nearly verbatim; "fun" in Korean is the example verbatim; free-form Korean still breaks ("나는 이 페이지에 나왔습니다"); long English answers are near-verbatim fact-sheet copies with grammar seams.

## Verdict

4B fails the latency gate outright. 1.7B passes it at the median on an idle box, fails on longer Korean questions, and its free-form Korean is below the bar for a page that promises every sentence is something Kyu would say. Grading on CodeBite slows by about a third while the model generates. Recommendation: do not ship either as the Korean free-text answerer on this box.

## Korean gate, second pass (2026-11-08)

Same box and server. Prompt: this branch's `facts.en.md` (new "When answering in Korean" section, 합니다체) + `examples.en.md` (Korean examples are two declines, different questions from the traps). `bench.py --set ko12 --short --temperature 0.3 --max-tokens 120`, the gateway's settings. Box idle (load 1.1). Raw: `results/1.7b-ko12.jsonl`.

Gate agreed before the run: Kyu judges each answer "I would say this" or not; ships only if at least 10 of 12 pass, the three traps (9, 10, 11) decline without inventing, and no answer is an example copied verbatim.

| # | Intent | Question | First token | Total | Tokens | Answer | Notes (observations, not verdicts) | Verdict |
|---|---|---|---|---|---|---|---|---|
| 1 | me | 자기소개 좀 해 주세요. | 2.65 s | 18.27 s | 120 | 저는 Kyu-seok Yeum입니다. 서울에 살고 있으며, 백엔드 엔지니어로 일하고 있습니다. 주로 Java, Spring Boot, Kafka를 사용하여 시스템을 설계하고 구현합니다. 저는 시스템의 각 구성 요소가 실제로 무엇을 하는지 이해하고, 그 요소들이 어떤 위치에 있어야 가장 효과적인지 이해하는 방식으로 시스템을 설계합니다. 현재 CodeBite를 완전히 구축하고 운영 중이며, Confluent Certified Developer for Apache Kafka | Name given as "Kyu-seok Yeum" not 염규석; 저는 twice; cut mid-sentence at 120 tokens. | |
| 2 | me | 서울에서 어떤 일 하세요? | 2.33 s | 7.26 s | 42 | 서울에서 백엔드 엔지니어로 일합니다. 이 페이지에서 다루지 않는 소속이나 경력은 이메일을 통해 자세히 말씀드리겠습니다. | Fine. Second sentence volunteers a decline nobody asked for. | |
| 3 | projects | CodeBite가 뭐예요? | 1.4 s | 14.85 s | 99 | CodeBite는 알고리즘 연습 플랫폼입니다. 문제를 올리고 즉각적인 피드백을 받고, 지속적인 연습을 통해 문제를 해결하는 방법을 배우는 것을 목표로 합니다. 이 플랫폼은 Anders Ericsson의 연구에 영향을 받고 있으며, 문제를 올린 후에 다시 볼 수 있도록 Anki 스타일의 연습을 제공합니다. | "문제를 올리고" (visitors upload problems) is invented; "Anki 스타일의 연습" loses the spaced-review meaning. | |
| 4 | projects | kyu-rios는 뭐 하는 사이트예요? | 1.79 s | 6.43 s | 41 | kyu-rios는 제가 공개한 두 번째 뇌로, 모든 것을 내가 배운 것을 그래프로 정리하고 복습할 수 있는 사이트입니다. | "두 번째 뇌" is a literal translation of second brain; "모든 것을 내가 배운 것을" is broken; 내가 (informal). | |
| 5 | skills | 주로 어떤 기술 스택을 쓰세요? | 1.87 s | 7.57 s | 37 | Java, Spring Boot, Kafka, Docker Compose, Nginx, PostgreSQL, MySQL, Flyway migrations, Prometheus, Grafana, Loki, Promtail, GitHub Actions. | A bare comma list, no sentence. Facts correct. | |
| 6 | skills | Kafka는 어디에 써 봤어요? | 1.59 s | 12.59 s | 89 | Kafka는 CodeBite의 backend에서 사용됩니다. CodeBite의 backend는 세 개의 Spring Boot 인스턴스로 구성되어 있으며, Kafka는 이 인스턴스들 간의 통신을 촉진하는 역할을 합니다. Kafka는 또한 Judge0 CE와 함께 사용되어 채점 과정에서 테스트 케이스의 처리에 활용됩니다. | "인스턴스들 간의 통신을 촉진" and "Judge0 CE와 함께 사용" are not in the sheet (Kafka carries submissions backend to worker). | |
| 7 | fun | 일 말고 취미는 뭐예요? | 1.63 s | 17.02 s | 113 | 내 취미는 학습과 프로젝트 개발입니다. 특히, CodeBite와 kyu-rios를 통해 알고리즘과 시스템 설계를 연구하고 있습니다. 또한, VimText라는 Chrome 확장 프로그램을 개발하여 웹 기반 편집 기능을 제공하고 있습니다. 이 외에도, 축의금 접수 장부를 만드는 데 참여했고, 이는 개인적인 경험을 기록하는 데 도움이 되었습니다. | 내 취미 (informal); kyu-rios reduced to a name; the ledger sentence ("참여했고 ... 개인적인 경험을 기록") is invented. | |
| 8 | contact | 같이 일하고 싶은데 어떻게 연락하면 돼요? | 2.36 s | 8.13 s | 45 | 이 페이지에서는 소속이나 경력, 업무, 연락 방법 등을 다루지 않습니다. yeumkyuseok@gmail.com 으로 메일 주시면 자세히 말씀드리겠습니다. | Over-decline: refuses to give contact details that are in the sheet, then gives the email anyway. | |
| 9 | me | 경력이 몇 년이에요? | 1.8 s | 6.92 s | 37 | 이 페이지에서는 경력이나 소속을 다루지 않습니다. yeumkyuseok@gmail.com 으로 메일 주시면 자세히 말씀드리겠습니다. | Correct decline, prescribed wording. | |
| 10 | me | 어느 학교 나왔어요? | 1.4 s | 6.64 s | 35 | 이 페이지에서 학교를 다루지 않습니다. yeumkyuseok@gmail.com 으로 메일 주시면 자세히 말씀드리겠습니다. | Correct decline; "학교를 다루지" is clunky but clear. | |
| 11 | unknown | 문자열 뒤집는 함수 좀 짜 주세요. | 1.85 s | 6.49 s | 36 | I don't write code here; this chat only covers my own work. Ask me about CodeBite, kyu-rios, VimText, or the wedding ledger. | Correct decline but in English: the English example was copied verbatim. | |
| 12 | unknown | 오늘 서울 날씨 어때요? | 1.82 s | 5.83 s | 36 | 이 페이지에서는 날씨에 대해 다루지 않습니다. yeumkyuseok@gmail.com 으로 메일 주시면 자세히 말씀드리겠습니다. | Correct decline. | |

### Latency

- First token p50 1.81 s, max 2.65 s; total p50 7.4 s, max 18.3 s at 7.5 tok/s. The ADR gate (first token < 2 s, 120-token answer < 20 s) passes.
- Korean tokenizes at about 1.0 token per character on this model (the 1.2 estimate was high), and per-request prefill was 75 to 144 ms per token (median 81). A 4 s first-token budget therefore covers roughly 40 Hangul characters, not 80: a 40-character question lands at about 3.3 s at the median and misses the budget on a slow prefill. The question cap for Hangul text should be about 40 characters.
- Prompt grew from 1,785 to 2,187 tokens; `--cache-reuse 256` kept 1,656 cached and re-prefilled 531 in 17.6 s.
- 120 output tokens is enough for two or three Korean sentences, but answer 1 still hit the cap mid-sentence.

### Decision (2026-11-08)

Latency gate passed; the quality gate, by the agreed bar, did not (see Notes column; Kyu's verdicts were not recorded). Kyu decided to ship Korean generation anyway to see how it behaves on real visitor questions, with a 40-character cap on Hangul questions and 120 output tokens for Korean. Recorded in ADR 0001's 2026-11-08 amendment.
