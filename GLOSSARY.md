# Portfolio chat

The single-page "ask me anything" portfolio at kyu-seok.github.io. A visitor asks a question; the page answers in Kyu's voice, either from prose written ahead of time or from a small language model Kyu hosts himself.

## Language

**Reply**:
One assistant turn in the thread: a piece of prose and, usually, a card.
_Avoid_: Answer, response, message (the thread holds messages from both sides)

**Scripted reply**:
A reply whose prose was written by Kyu ahead of time and chosen by the keyword matcher.
_Avoid_: Static reply, canned reply, fallback (fallback is when it is used, not what it is)

**Generated reply**:
A reply whose prose was produced by the self-hosted model from the fact sheet, labeled as such on the page.
_Avoid_: AI reply, LLM answer, live reply

**Intent**:
Which of the five topics (me, projects, skills, fun, contact) a question is about. Decided by the keyword matcher, never by the model.
_Avoid_: Category, topic, kind

**Card**:
The structured block under a reply's prose: the project carousel, the skills grid, the contact list, and so on. Always picked from the intent, never generated.
_Avoid_: Widget, attachment, rich answer

**Fact sheet**:
The single authored document of facts about Kyu that the model is allowed to speak from. Written in English; the model answers in the page's active language.
_Avoid_: Knowledge base, context, corpus, RAG documents

**Model**:
The Qwen3 language model running on the CodeBite mini PC that writes generated replies.
_Avoid_: AI, the LLM, Qwen (use the size when it matters: Qwen3-1.7B, Qwen3-4B)

**Time budget**:
The fixed wait, measured from sending the question, after which the page gives up on a generated reply and shows the scripted reply instead.
_Avoid_: Timeout (the request may still complete and be discarded)

**Question log**:
The permanent record of every question a visitor asked, the reply they got, and how long it took. Never deleted; it is how the fact sheet learns what visitors actually ask.
_Avoid_: Analytics, access log, history
