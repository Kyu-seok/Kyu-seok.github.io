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

**Picked reply**:
A reply to Korean free text whose prose Kyu wrote ahead of time, chosen from the answer bank by the embedding model. Nothing in it is generated.
_Avoid_: Matched reply, generated reply (no text is produced), retrieved answer

**Answer bank**:
Kyu's written Korean replies, each with the example questions it answers and the card it carries. The only source of picked replies.
_Avoid_: FAQ, knowledge base, canned replies, fact sheet (the fact sheet feeds the model; the answer bank feeds the embedding model)

**Intent**:
Which of the five subjects (me, projects, skills, fun, contact) a question is about. Decided by the keyword matcher, never by the model.
_Avoid_: Category, topic, kind

**Small talk**:
A question that is not about Kyu's work and that the model may answer playfully, in Kyu's voice, without adding facts.
_Avoid_: Off-topic, chit-chat, banter (banter is the tone, not the question)

**Out of scope**:
A question the model must decline: undisclosed facts, code, translation, general knowledge, and opinions on people, companies, or politics.
_Avoid_: Forbidden, blocked, unknown (the page's "unknown" is a matcher result, not a judgment)

**Card**:
A structured block under a reply's prose: the project carousel, the skills grid, the contact list, and so on. Chosen by the keyword matcher, or by the answer bank entry of a picked reply; never generated. A reply may carry more than one.
_Avoid_: Widget, attachment, rich answer

**Notes card**:
The card that links the study topic a free-text question touched and that topic's kyu-rious lessons, labeled "From my notes". Added alongside the intent's card, never instead of it.
_Avoid_: Lesson card (kyu-rious has review cards), note link, RAG result

**Study topic**:
One of the subjects Kyu has written kyu-rious lessons on, such as Kafka or AI Engineering 101. On this page the bare word "topic" is not used.
_Avoid_: Topic, course, category, note

**Fact sheet**:
The single authored document of facts about Kyu that the model is allowed to speak from. Written in English; generated replies are English only.
_Avoid_: Knowledge base, context, corpus, RAG documents

**Model**:
The Qwen3 language model running on the CodeBite mini PC that writes generated replies.
_Avoid_: AI, the LLM, Qwen (use the size when it matters: Qwen3-1.7B, Qwen3-4B)

**Embedding model**:
The second model on the mini PC (bge-m3) that finds the answer bank entry nearest in meaning to a Korean question. It never writes text.
_Avoid_: The model (that is Qwen3), AI, classifier, router

**Time budget**:
The fixed wait, measured from sending the question, after which the page gives up on a generated reply and shows the scripted reply instead.
_Avoid_: Timeout (the request may still complete and be discarded)

**Question log**:
The permanent record of every question a visitor asked, the reply they got, and how long it took. Never deleted; it is how the fact sheet learns what visitors actually ask.
_Avoid_: Analytics, access log, history
