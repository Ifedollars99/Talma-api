/** Shared Talma AI demo replies. */

export type AssistantMode = 'general' | 'study'

export type StudyLevel = 'primary' | 'secondary' | 'university'

export const STUDY_LEVELS: { id: StudyLevel; label: string; hint: string }[] = [
  { id: 'primary', label: 'Primary', hint: 'Simple words' },
  { id: 'secondary', label: 'Secondary', hint: 'Exam focused' },
  { id: 'university', label: 'University', hint: 'In depth' },
]

const LEVEL_LABEL: Record<StudyLevel, string> = {
  primary: 'primary school',
  secondary: 'secondary school',
  university: 'university',
}

export function localGeneralFallback(text: string): string {
  const t = text.toLowerCase()

  if (/^(hi|hello|hey|good (morning|afternoon|evening))/.test(t)) {
    return `**Hi! I'm Talma AI.** I can help with writing, code, maths, research, planning and study — anything you'd ask ChatGPT or Claude.

I'm in **demo mode** right now. Add a server AI key to unlock full answers.

For now, ask me something small and I'll show you the shape of a good answer.`
  }

  if (/essay|letter|application|email|write|draft|caption|post/.test(t)) {
    return `I can draft that properly once AI is connected. Here's a structure you can use immediately:

1. **Open with the point** — say what you want and why it matters in one sentence.
2. **Give evidence** — one concrete result, number or example.
3. **Connect to the reader** — explain why it matters to them.
4. **Close with one clear ask** — a next step, not a summary.

Paste your draft and I'll tighten it, fix the grammar and adjust the tone once AI is connected.`
  }

  if (/code|python|javascript|typescript|react|bug|error|debug|function/.test(t)) {
    return `Paste the code and the exact error message and I'll debug it with you. When AI is connected I can rewrite the function, explain the fix and suggest tests.

A quick checklist while you wait:

- Read the **first** line of the stack trace, not the last.
- Check the value is what you think it is (log it just before the failure).
- Reproduce it with the smallest possible input.
- Search the exact error text without your variable names.`
  }

  if (/math|algebra|equation|solve|fraction|calculus|physics|chemistry|integral|derivative/.test(t)) {
    return `I can work through it line by line once AI is connected. The method that earns marks:

1. Write **what you are given** and **what is asked**.
2. Choose the formula or rule and state why.
3. Substitute with units, then simplify one step per line.
4. Check the answer against the question and estimate whether it is sensible.

Send the exact question and I'll solve it fully once AI is connected.`
  }

  if (/plan|schedule|deadline|week|time|organi[sz]e|priority/.test(t)) {
    return `Here's a practical planning frame:

- List every deadline with its **real** date and effort estimate.
- Pick the **three** that matter most this week.
- Block 60–90 minute focus sessions; leave 20% of the week empty for spillover.
- Put the hardest task in your best energy window, not the earliest slot.
- End each day by writing tomorrow's first task.

Tell me your deadlines and available hours, and with AI connected I'll build the timetable for you.`
  }

  return `I'm in **demo mode**, so I can't generate a full answer yet. Add a server AI key and I'll answer like a full assistant.

In the meantime, try breaking the request into:

1. **What you already know**
2. **What you need to find out**
3. **The next single step**

Paste that breakdown here and I can help you think it through.`
}

export function localStudyFallback(text: string, level: StudyLevel): string {
  const t = text.toLowerCase()
  const prefix =
    level === 'primary'
      ? 'Great question! '
      : level === 'secondary'
        ? 'Here is the exam-ready approach. '
        : 'Here is a concise academic approach. '

  if (/^(hi|hello|hey|good (morning|afternoon|evening))/.test(t))
    return `**Hello!** I'm Talma AI in Study mode. Ask me to explain a topic, quiz you, summarise your notes, or plan revision for ${LEVEL_LABEL[level]}. Full answers turn on once AI is connected.`

  if (/quiz|test me|practice question|mcq/.test(t))
    return `${prefix}Quick self-check: pick one topic you studied today and write three questions — one definition, one "why", one "apply it". Answer without notes, then mark yourself.

Once AI is connected I'll build an adaptive quiz for you instead.`

  if (/summar|condense|shorten|notes/.test(t))
    return `${prefix}Use the **3-2-1 summary**:

1. **3** key ideas
2. **2** examples
3. **1** question you still have

Say the summary out loud without looking. Paste your notes here with AI connected and I'll compress them into a one-page revision sheet.`

  if (/exam|revision|revise|prepare|study plan|timetable/.test(t))
    return `${prefix}Plan backwards from the exam date:

1. List every topic and rate your confidence 1–5.
2. Give **60%** of study time to your two weakest topics.
3. Finish each session with one timed past question.
4. Work in **25 minutes focused, 5 minutes off**.

With AI connected I'll turn this into a dated plan for you.`

  if (/math|algebra|equation|solve|fraction|calculus|physics/.test(t))
    return `${prefix}For problem solving:

1. Write what you are **given**.
2. Write what is **asked**.
3. Choose the formula.
4. Substitute with units.
5. Check the answer makes sense.

Show every line — marks live in the steps. Paste the exact question once AI is connected for a full worked solution.`

  if (/explain|what is|define|how does|why does/.test(t))
    return `${prefix}Try this three-step method:

1. Define the idea in one sentence.
2. Give one real-life example.
3. Explain it out loud to a classmate without notes.

The place you stumble is the part to revisit. With AI connected I'll break the concept down fully.`

  if (/where|find|classroom|material|slide|note|message/.test(t))
    return `In Talma: faculties, courses and materials live in **Classroom**; chats and communities live in **Messages**; your profile, language and privacy live in **Settings**. Your dashboard feed shows what your class shared most recently.`

  return `I'm in **demo mode** right now, so I can't generate a full answer yet. Full explanations and quizzes turn on once AI is connected on the server.

Meanwhile, break the question into: **what you know**, **what you need**, and **the next single step**.`
}

export function demoReply(text: string, mode: AssistantMode, level: StudyLevel): string {
  return mode === 'study' ? localStudyFallback(text, level) : localGeneralFallback(text)
}
