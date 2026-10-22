import { useEffect, useRef, useState } from 'react'
import type {
  ChangeEvent,
  ClipboardEvent,
  DragEvent,
  KeyboardEvent,
} from 'react'
import {
  AiStreamError,
  getAssistantStatus,
  streamAssistant,
  type AssistantStatus,
  type ChatTurn,
} from '../../lib/aiClient'
import {
  IMAGE_ACCEPT,
  MAX_IMAGE_ATTACHMENTS,
  isSupportedImage,
  prepareImage,
  type PreparedImage,
} from '../../lib/imageAttachment'
import {
  demoReply,
  STUDY_LEVELS,
  type AssistantMode,
  type StudyLevel,
} from '../../lib/studyAssistant'
import Markdown from './Markdown'

interface Conversation {
  id: string
  title: string
  messages: ChatTurn[]
  mode: AssistantMode
  level: StudyLevel
  updatedAt: number
}

interface Suggestion {
  icon: string
  title: string
  desc: string
  prompt: string
}

const STORAGE_KEY = 'talma-ai-chats-v2'
const EMPTY_MESSAGES: ChatTurn[] = []

const GENERAL_SUGGESTIONS: Suggestion[] = [
  {
    icon: 'bi-pencil-square',
    title: 'Write something',
    desc: 'Essays, emails, applications, captions.',
    prompt:
      'Help me write a strong scholarship application letter. Ask me for the details you need first.',
  },
  {
    icon: 'bi-code-slash',
    title: 'Debug my code',
    desc: 'Find the bug and explain the fix.',
    prompt: 'I need help debugging some code. Tell me what to paste and how to describe the error.',
  },
  {
    icon: 'bi-lightbulb',
    title: 'Understand a topic',
    desc: 'Plain-language explanations with examples.',
    prompt: 'Explain a topic I am stuck on in plain language, with a simple real-life example.',
  },
  {
    icon: 'bi-calendar2-week',
    title: 'Plan my week',
    desc: 'Turn deadlines into a realistic plan.',
    prompt: 'Help me plan my week around three deadlines. Ask me what they are and how many hours I have.',
  },
]

const STUDY_SUGGESTIONS: Suggestion[] = [
  {
    icon: 'bi-lightbulb',
    title: 'Explain a concept',
    desc: 'Turn a confusing topic into plain language.',
    prompt: 'Explain a topic I am stuck on, step by step, with one example.',
  },
  {
    icon: 'bi-patch-question',
    title: 'Quiz me',
    desc: 'One question at a time, marked and explained.',
    prompt: 'Quiz me. Ask me which topic and level first, then give me one question at a time.',
  },
  {
    icon: 'bi-journal-text',
    title: 'Summarise notes',
    desc: 'Compress a messy page into revision points.',
    prompt: 'Summarise my notes into a one-page revision sheet. I will paste them next.',
  },
  {
    icon: 'bi-calendar2-week',
    title: 'Build a revision plan',
    desc: 'A dated plan around your exam.',
    prompt: 'Build me a realistic 7-day revision plan. Ask for my exam date and subjects first.',
  },
]

function newId(): string {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID()
    }
  } catch {
    // Fall through to the timestamp-based id.
  }
  return `chat-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`
}

function createConversation(seed?: Pick<Conversation, 'mode' | 'level'>): Conversation {
  return {
    id: newId(),
    title: 'New chat',
    messages: [],
    mode: seed?.mode ?? 'general',
    level: seed?.level ?? 'university',
    updatedAt: Date.now(),
  }
}

function loadConversations(): Conversation[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return [createConversation()]

    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return [createConversation()]

    const chats = parsed.flatMap((entry): Conversation[] => {
      if (!entry || typeof entry !== 'object') return []
      const value = entry as {
        id?: unknown
        title?: unknown
        messages?: unknown
        mode?: unknown
        level?: unknown
        updatedAt?: unknown
      }

      if (typeof value.id !== 'string' || !Array.isArray(value.messages)) return []

      const messages = (value.messages as unknown[]).flatMap((item): ChatTurn[] => {
        if (!item || typeof item !== 'object') return []
        const message = item as { role?: unknown; content?: unknown; images?: unknown }
        if (message.role !== 'user' && message.role !== 'assistant') return []

        const content = typeof message.content === 'string' ? message.content : ''
        const images = Array.isArray(message.images)
          ? (message.images as unknown[])
              .filter(
                (image): image is string =>
                  typeof image === 'string' && image.startsWith('data:image/'),
              )
              .slice(0, MAX_IMAGE_ATTACHMENTS)
          : []

        if (!content && images.length === 0) return []
        return [{ role: message.role, content, ...(images.length ? { images } : {}) }]
      })

      return [
        {
          id: value.id,
          title: typeof value.title === 'string' && value.title ? value.title : 'New chat',
          messages,
          mode: value.mode === 'study' ? 'study' : 'general',
          level:
            value.level === 'primary' || value.level === 'secondary' || value.level === 'university'
              ? value.level
              : 'university',
          updatedAt: typeof value.updatedAt === 'number' ? value.updatedAt : Date.now(),
        },
      ]
    })

    return chats.length > 0 ? chats : [createConversation()]
  } catch {
    return [createConversation()]
  }
}

function makeTitle(text: string): string {
  const clean = text.replace(/\s+/g, ' ').trim()
  return clean.length > 48 ? `${clean.slice(0, 48)}…` : clean
}

function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1.5 py-2" aria-label="Talma AI is typing">
      {[0, 1, 2].map((dot) => (
        <span
          key={dot}
          className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#15803d]"
          style={{ animationDelay: `${dot * 0.12}s` }}
        />
      ))}
    </span>
  )
}

export default function StudyAssistantView() {
  const [conversations, setConversations] = useState<Conversation[]>(() => loadConversations())
  const [activeId, setActiveId] = useState('')
  const [input, setInput] = useState('')
  const [isStreaming, setIsStreaming] = useState(false)
  const [serverStatus, setServerStatus] = useState<AssistantStatus | null>(null)
  const [notice, setNotice] = useState<{ tone: 'info' | 'error'; text: string } | null>(null)
  const [copiedKey, setCopiedKey] = useState<string | null>(null)
  const [attachments, setAttachments] = useState<PreparedImage[]>([])
  const [isPreparing, setIsPreparing] = useState(false)

  const messagesRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const abortRef = useRef<AbortController | null>(null)
  const stickToBottom = useRef(true)
  const attachmentJob = useRef(0)

  const activeConversation =
    conversations.find((conversation) => conversation.id === activeId) ?? conversations[0]
  const messages = activeConversation?.messages ?? EMPTY_MESSAGES
  const mode = activeConversation?.mode ?? 'general'
  const level = activeConversation?.level ?? 'university'
  const recentChats = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt)

  const serverKeyed = serverStatus?.mode === 'server'
  const freeMode = serverStatus?.mode === 'free'
  const connected = serverStatus?.configured === true
  const visionReady = serverStatus === null || serverStatus.vision
  const statusText = !serverStatus
    ? 'Checking AI…'
    : serverKeyed
      ? `Talma AI · ${serverStatus.model}`
      : freeMode
        ? `Free AI · ${serverStatus.model}`
        : 'Demo mode'

  const lastAssistantIndex = messages.reduce(
    (last, message, index) => (message.role === 'assistant' ? index : last),
    -1,
  )
  const suggestions = mode === 'study' ? STUDY_SUGGESTIONS : GENERAL_SUGGESTIONS

  useEffect(() => {
    if (!activeId && conversations[0]) setActiveId(conversations[0].id)
  }, [activeId, conversations])

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(conversations))
      } catch {
        // Pictures can fill the tiny localStorage quota. Keep the text so the
        // conversation still survives a reload.
        try {
          const textOnly = conversations.map((chat) => ({
            ...chat,
            messages: chat.messages.map((message) => ({
              role: message.role,
              content: message.content,
            })),
          }))
          window.localStorage.setItem(STORAGE_KEY, JSON.stringify(textOnly))
        } catch {
          // Storage can be full or blocked; the chat still works for this session.
        }
      }
    }, 350)

    return () => window.clearTimeout(timeout)
  }, [conversations])

  useEffect(() => {
    let alive = true
    void getAssistantStatus().then((status) => {
      if (alive) setServerStatus(status)
    })
    return () => {
      alive = false
    }
  }, [])

  useEffect(() => {
    stickToBottom.current = true
  }, [activeId])

  useEffect(() => {
    const element = messagesRef.current
    if (element && stickToBottom.current) element.scrollTop = element.scrollHeight
  }, [messages, isStreaming])

  useEffect(() => {
    const element = textareaRef.current
    if (!element) return
    element.style.height = 'auto'
    element.style.height = `${Math.min(element.scrollHeight, 160)}px`
  }, [input])

  const patchConversation = (id: string, update: (chat: Conversation) => Conversation) => {
    setConversations((current) =>
      current.map((chat) =>
        chat.id === id ? { ...update(chat), updatedAt: Date.now() } : chat,
      ),
    )
  }

  const resetAttachments = () => {
    attachmentJob.current += 1
    setAttachments([])
    setIsPreparing(false)
  }

  const visionHelpText = freeMode
    ? 'The free AI reads text only. To send pictures, add a free vision-capable key in server/.env — Gemini 2.5 Flash (Google AI Studio) or Llama 4 Scout (Groq) — then restart the API.'
    : 'Pictures need a vision-capable AI model. Add a server AI key and restart the API to enable them.'

  const addImages = async (files: File[]) => {
    if (files.length === 0) return

    if (!visionReady) {
      setNotice({ tone: 'info', text: visionHelpText })
    }

    const pictures = files.filter(isSupportedImage)
    if (pictures.length < files.length) {
      setNotice({
        tone: 'error',
        text: 'Only pictures can be attached — videos and audio files are not supported.',
      })
    }

    const room = MAX_IMAGE_ATTACHMENTS - attachments.length
    if (room <= 0) {
      setNotice({
        tone: 'info',
        text: `You can attach up to ${MAX_IMAGE_ATTACHMENTS} pictures per message.`,
      })
      return
    }

    const selected = pictures.slice(0, room)
    if (selected.length === 0) return

    if (pictures.length > selected.length) {
      setNotice({
        tone: 'info',
        text: `You can attach up to ${MAX_IMAGE_ATTACHMENTS} pictures per message.`,
      })
    }

    const job = attachmentJob.current + 1
    attachmentJob.current = job
    setIsPreparing(true)

    try {
      const results = await Promise.allSettled(selected.map((file) => prepareImage(file)))
      if (attachmentJob.current !== job) return

      const prepared = results.flatMap((result) =>
        result.status === 'fulfilled' ? [result.value] : [],
      )

      if (prepared.length > 0) {
        setAttachments((current) =>
          [...current, ...prepared].slice(0, MAX_IMAGE_ATTACHMENTS),
        )
        window.requestAnimationFrame(() => textareaRef.current?.focus())
      }

      const failure = results.find((result) => result.status === 'rejected')
      if (failure && failure.status === 'rejected') {
        setNotice({
          tone: 'error',
          text:
            failure.reason instanceof Error
              ? failure.reason.message
              : 'That picture could not be attached.',
        })
      }
    } finally {
      if (attachmentJob.current === job) setIsPreparing(false)
    }
  }

  const removeAttachment = (id: string) => {
    setAttachments((current) => current.filter((attachment) => attachment.id !== id))
  }

  const openFilePicker = () => {
    if (isPreparing) return
    if (!visionReady) {
      setNotice({ tone: 'info', text: visionHelpText })
    }
    fileInputRef.current?.click()
  }

  const onFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    void addImages(files)
  }

  const onPaste = (event: ClipboardEvent<HTMLTextAreaElement>) => {
    const files = Array.from(event.clipboardData.files)
    if (files.length === 0) return
    if (!files.some(isSupportedImage)) {
      setNotice({
        tone: 'error',
        text: 'Only pictures can be attached — videos and audio files are not supported.',
      })
      return
    }
    event.preventDefault()
    void addImages(files)
  }

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    if (event.dataTransfer.files.length === 0) return
    event.preventDefault()
    void addImages(Array.from(event.dataTransfer.files))
  }

  const run = async (
    chatId: string,
    history: ChatTurn[],
    prompt: string,
    chatMode: AssistantMode,
    chatLevel: StudyLevel,
  ) => {
    const hasPictures = history.some((message) => (message.images?.length ?? 0) > 0)

    // Nothing to call: answer with the local demo instead of a failed request.
    if (serverStatus?.mode === 'off') {
      patchConversation(chatId, (chat) => {
        const next = [...chat.messages]
        const last = next[next.length - 1]
        if (last && last.role === 'assistant' && !last.content) {
          if (hasPictures) next.pop()
          else next[next.length - 1] = { ...last, content: demoReply(prompt, chatMode, chatLevel) }
        }
        return { ...chat, messages: next }
      })
      setNotice({
        tone: 'info',
        text: hasPictures
          ? 'Pictures need an AI provider. Add a server AI key and restart the API.'
          : 'Demo mode is on — connect an AI provider on the server to unlock full answers.',
      })
      return
    }

    setIsStreaming(true)
    setNotice(null)
    setCopiedKey(null)

    const controller = new AbortController()
    abortRef.current = controller
    let received = false

    try {
      await streamAssistant({
        messages: history,
        mode: chatMode,
        level: chatLevel,
        signal: controller.signal,
        onDelta: (delta) => {
          received = true
          setConversations((current) =>
            current.map((chat) => {
              if (chat.id !== chatId) return chat
              const next = [...chat.messages]
              const last = next[next.length - 1]
              if (!last || last.role !== 'assistant') return chat
              next[next.length - 1] = { ...last, content: last.content + delta }
              return { ...chat, messages: next }
            }),
          )
        },
      })
    } catch (caught) {
      const aborted =
        caught instanceof Error &&
        (caught.name === 'AbortError' || caught.message.includes('aborted'))

      if (!aborted) {
        const limited =
          caught instanceof AiStreamError &&
          (caught.code === 'FREE_AI_BUSY' || caught.code === 'AI_RATE_LIMITED')
        const visionUnsupported =
          caught instanceof AiStreamError && caught.code === 'VISION_NOT_SUPPORTED'

        const text =
          caught instanceof AiStreamError && caught.code === 'AI_NOT_CONFIGURED'
            ? 'No AI provider is connected yet. Set OPENAI_API_KEY in server/.env and restart the API.'
            : caught instanceof Error
              ? caught.message
              : 'Something went wrong while contacting the assistant.'

        setNotice({ tone: 'error', text })

        // A rate-limited or picture-related rejection is worth showing on its
        // own. Other failures fall back to a useful demo reply.
        if (!received && !limited && !visionUnsupported && !hasPictures) {
          patchConversation(chatId, (chat) => {
            const next = [...chat.messages]
            const last = next[next.length - 1]
            if (last && last.role === 'assistant' && !last.content) {
              next[next.length - 1] = {
                ...last,
                content: demoReply(prompt, chatMode, chatLevel),
              }
            }
            return { ...chat, messages: next }
          })
        }
      }
    } finally {
      abortRef.current = null
      setIsStreaming(false)
      setConversations((current) =>
        current.map((chat) => {
          if (chat.id !== chatId) return chat
          const next = [...chat.messages]
          const last = next[next.length - 1]
          if (last && last.role === 'assistant' && !last.content) next.pop()
          return { ...chat, messages: next }
        }),
      )
    }
  }

  const send = (raw?: string) => {
    const text = (raw ?? input).trim()
    if ((!text && attachments.length === 0) || isStreaming || isPreparing) return

    const chat = activeConversation
    if (!chat) return

    const images = attachments.map((attachment) => attachment.dataUrl)
    const userMessage: ChatTurn = {
      role: 'user',
      content: text,
      ...(images.length > 0 ? { images } : {}),
    }
    const history: ChatTurn[] = [...chat.messages, userMessage]
    const title =
      chat.messages.length === 0 ? (text ? makeTitle(text) : 'Picture chat') : chat.title

    setConversations((current) =>
      current.map((item) =>
        item.id === chat.id
          ? {
              ...item,
              title,
              messages: [...history, { role: 'assistant', content: '' }],
              updatedAt: Date.now(),
            }
          : item,
      ),
    )
    setActiveId(chat.id)
    setInput('')
    resetAttachments()
    setNotice(null)
    stickToBottom.current = true

    void run(chat.id, history, text, chat.mode, chat.level)
  }

  const regenerate = () => {
    const chat = activeConversation
    if (!chat || isStreaming || isPreparing) return

    let lastUserIndex = -1
    for (let index = chat.messages.length - 1; index >= 0; index -= 1) {
      if (chat.messages[index]?.role === 'user') {
        lastUserIndex = index
        break
      }
    }
    if (lastUserIndex < 0) return

    const history = chat.messages.slice(0, lastUserIndex + 1)
    const lastUser = history[history.length - 1]
    if (!lastUser || (!lastUser.content && !lastUser.images?.length)) return

    setConversations((current) =>
      current.map((item) =>
        item.id === chat.id
          ? {
              ...item,
              messages: [...history, { role: 'assistant', content: '' }],
              updatedAt: Date.now(),
            }
          : item,
      ),
    )
    setNotice(null)
    stickToBottom.current = true

    void run(chat.id, history, lastUser.content, chat.mode, chat.level)
  }

  const newChat = () => {
    abortRef.current?.abort()
    resetAttachments()
    const chat = createConversation({ mode, level })
    setConversations((current) => [chat, ...current])
    setActiveId(chat.id)
    setInput('')
    setNotice(null)
    window.requestAnimationFrame(() => textareaRef.current?.focus())
  }

  const removeChat = (id: string) => {
    if (id === activeConversation?.id) {
      abortRef.current?.abort()
      resetAttachments()
    }

    const remaining = conversations.filter((chat) => chat.id !== id)
    if (remaining.length === 0) {
      const fresh = createConversation({ mode, level })
      setConversations([fresh])
      setActiveId(fresh.id)
      return
    }

    setConversations(remaining)
    if (id === activeConversation?.id) {
      const next = [...remaining].sort((a, b) => b.updatedAt - a.updatedAt)[0]
      setActiveId(next?.id ?? '')
    }
  }

  const clearChat = () => {
    if (!activeConversation) return
    abortRef.current?.abort()
    resetAttachments()
    patchConversation(activeConversation.id, (chat) => ({
      ...chat,
      messages: [],
      title: 'New chat',
    }))
    setNotice(null)
  }

  const stop = () => {
    abortRef.current?.abort()
  }

  const changeMode = (next: AssistantMode) => {
    if (!activeConversation) return
    patchConversation(activeConversation.id, (chat) => ({ ...chat, mode: next }))
  }

  const changeLevel = (next: StudyLevel) => {
    if (!activeConversation) return
    patchConversation(activeConversation.id, (chat) => ({ ...chat, level: next }))
  }

  const copyMessage = async (text: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedKey(key)
      window.setTimeout(() => {
        setCopiedKey((current) => (current === key ? null : current))
      }, 1600)
    } catch {
      // Clipboard access can be blocked; nothing to do.
    }
  }

  const handleScroll = () => {
    const element = messagesRef.current
    if (!element) return
    stickToBottom.current =
      element.scrollHeight - element.scrollTop - element.clientHeight < 96
  }

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      send()
    }
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#8a6d00]">
            Talma AI · Always on
          </p>
          <h2 className="mt-1 font-heading text-3xl font-semibold text-[#0a0a0a]">
            Study Assistant
          </h2>
          <p className="mt-1 max-w-2xl text-[#4d554d]">
            Ask anything — writing, code, maths, research, planning or revision. A full assistant,
            not just a textbook.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            title={
              freeMode
                ? 'Free AI is rate-limited to one reply every 30 seconds. Pictures need a vision-capable server key.'
                : undefined
            }
            className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold ${
              connected
                ? 'border-[#22c55e]/40 bg-[#22c55e]/10 text-[#15803d]'
                : 'border-[#f5c842]/50 bg-[#fdf5d7] text-[#8a6d00]'
            }`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                connected ? 'animate-pulse bg-[#22c55e]' : 'bg-[#f5c842]'
              }`}
            />
            {statusText}
          </span>
          <button
            type="button"
            onClick={newChat}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#0a0a0a] px-3.5 py-2 text-xs font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-[#15803d] hover:shadow-lg"
          >
            <i className="bi bi-plus-lg" />
            New chat
          </button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-[250px_minmax(0,1fr)] lg:items-start">
        {/* History */}
        <aside className="hidden h-[72vh] min-h-[520px] flex-col rounded-2xl border border-[#e6e9e6] bg-white p-3 shadow-sm lg:flex">
          <button
            type="button"
            onClick={newChat}
            className="flex items-center justify-center gap-2 rounded-xl bg-[#0a0a0a] px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#15803d]"
          >
            <i className="bi bi-plus-lg" />
            New chat
          </button>

          <p className="mt-4 px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#8a938a]">
            Recent chats
          </p>

          <div className="mt-1 flex-1 space-y-0.5 overflow-y-auto pr-0.5">
            {recentChats.map((chat) => {
              const active = chat.id === activeConversation?.id
              return (
                <div
                  key={chat.id}
                  className={`group flex items-center gap-1 rounded-lg pr-1 transition-colors ${
                    active ? 'bg-[#fffbef]' : 'hover:bg-[#f5f8f5]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setActiveId(chat.id)}
                    title={chat.title}
                    className={`min-w-0 flex-1 truncate px-2.5 py-2 text-left text-[12.5px] ${
                      active ? 'font-semibold text-[#0a0a0a]' : 'text-[#4d554d]'
                    }`}
                  >
                    {chat.title}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeChat(chat.id)}
                    aria-label={`Delete ${chat.title}`}
                    className="grid h-6 w-6 flex-shrink-0 place-items-center rounded-md text-[#a0a8a0] opacity-0 transition-all hover:bg-[#f5c842]/20 hover:text-[#8a6d00] focus-visible:opacity-100 group-hover:opacity-100"
                  >
                    <i className="bi bi-trash3 text-[11px]" />
                  </button>
                </div>
              )
            })}
          </div>

          <div className="mt-3 rounded-xl bg-[#0a0a0a] p-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#f5c842]">
              Tip
            </p>
            <p className="mt-1 text-[11.5px] leading-relaxed text-white/65">
              Press{' '}
              <kbd className="rounded border border-white/20 bg-white/10 px-1 font-sans text-[10px] text-white">
                Enter
              </kbd>{' '}
              to send and{' '}
              <kbd className="rounded border border-white/20 bg-white/10 px-1 font-sans text-[10px] text-white">
                Shift + Enter
              </kbd>{' '}
              for a new line. Paste or drop a picture to ask about it.
            </p>
          </div>
        </aside>

        {/* Chat panel */}
        <section className="flex h-[72vh] min-h-[520px] flex-col overflow-hidden rounded-2xl border border-[#e6e9e6] bg-white shadow-xl shadow-black/[0.04]">
          {/* Mobile chat switcher */}
          <div className="flex items-center gap-2 border-b border-[#e6e9e6] px-3 py-2 lg:hidden">
            <select
              value={activeConversation?.id ?? ''}
              onChange={(event) => setActiveId(event.target.value)}
              aria-label="Switch conversation"
              className="min-w-0 flex-1 rounded-lg border border-[#e6e9e6] bg-white px-2.5 py-2 text-xs font-medium text-[#0a0a0a] focus:border-[#f5c842] focus:outline-none"
            >
              {recentChats.map((chat) => (
                <option key={chat.id} value={chat.id}>
                  {chat.title}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={newChat}
              aria-label="New chat"
              className="grid h-8 w-8 place-items-center rounded-lg bg-[#0a0a0a] text-white transition-colors hover:bg-[#15803d]"
            >
              <i className="bi bi-plus-lg text-xs" />
            </button>
            <button
              type="button"
              onClick={() => activeConversation && removeChat(activeConversation.id)}
              aria-label="Delete chat"
              className="grid h-8 w-8 place-items-center rounded-lg border border-[#e6e9e6] text-[#7b857b] transition-colors hover:border-[#f5c842] hover:text-[#8a6d00]"
            >
              <i className="bi bi-trash3 text-xs" />
            </button>
          </div>

          {/* Messages */}
          <div
            ref={messagesRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto overscroll-contain px-4 py-5 sm:px-6"
            role="log"
            aria-live="polite"
          >
            {messages.length === 0 ? (
              <div className="flex min-h-full flex-col items-center justify-center py-6 text-center">
                <div className="grid h-14 w-14 place-items-center rounded-2xl bg-[#0a0a0a] text-[#f5c842] shadow-lg shadow-black/10">
                  <i className="bi bi-stars text-2xl" />
                </div>
                <h3 className="mt-4 font-heading text-2xl font-semibold text-[#0a0a0a]">
                  {mode === 'study' ? 'Ready to study smarter?' : 'How can I help you today?'}
                </h3>
                <p className="mt-1 max-w-lg text-sm leading-relaxed text-[#4d554d]">
                  {mode === 'study'
                    ? 'Ask for an explanation, a quiz, a summary or a revision plan — at your level.'
                    : 'Writing, code, maths, research, planning or a quick question — ask away.'}
                </p>

                {freeMode && (
                  <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#fdf5d7] px-3 py-1 text-[11px] font-medium text-[#8a6d00]">
                    <i className="bi bi-hourglass-split" />
                    Free AI · one reply every 30 seconds
                  </p>
                )}

                <div className="mt-6 grid w-full max-w-2xl gap-2.5 sm:grid-cols-2">
                  {suggestions.map((suggestion) => (
                    <button
                      key={suggestion.title}
                      type="button"
                      onClick={() => send(suggestion.prompt)}
                      className="group flex items-start gap-3 rounded-xl border border-[#e6e9e6] bg-white p-3.5 text-left transition-all hover:-translate-y-0.5 hover:border-[#f5c842] hover:shadow-md"
                    >
                      <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg bg-[#fdf5d7] text-[#8a6d00] transition-transform group-hover:rotate-6">
                        <i className={`bi ${suggestion.icon} text-sm`} />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[13px] font-semibold text-[#0a0a0a]">
                          {suggestion.title}
                        </span>
                        <span className="mt-0.5 block text-[11.5px] leading-relaxed text-[#7b857b]">
                          {suggestion.desc}
                        </span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mx-auto max-w-3xl space-y-6">
                {messages.map((message, index) => {
                  const isUser = message.role === 'user'
                  const isLastAssistant = index === lastAssistantIndex
                  const messageKey = `${activeConversation?.id ?? 'chat'}-${index}`

                  if (isUser) {
                    return (
                      <div key={messageKey} className="flex justify-end">
                        <div
                          className={`max-w-[88%] break-words rounded-2xl rounded-br-md bg-[#0a0a0a] text-[14px] leading-relaxed text-white shadow-sm sm:max-w-[80%] ${
                            message.images?.length ? 'p-2.5' : 'px-4 py-3'
                          }`}
                        >
                          {message.images?.length ? (
                            <div
                              className={`grid gap-1.5 ${
                                message.images.length === 1 ? 'grid-cols-1' : 'grid-cols-2'
                              }`}
                            >
                              {message.images.map((source, imageIndex) => (
                                <img
                                  key={`${messageKey}-${imageIndex}`}
                                  src={source}
                                  alt={`Attached picture ${imageIndex + 1}`}
                                  className="max-h-64 w-full rounded-lg object-cover"
                                />
                              ))}
                            </div>
                          ) : null}
                          {message.content ? (
                            <p
                              className={
                                message.images?.length
                                  ? 'whitespace-pre-wrap px-1.5 pb-1 pt-2'
                                  : 'whitespace-pre-wrap'
                              }
                            >
                              {message.content}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    )
                  }

                  return (
                    <div key={messageKey} className="flex gap-3">
                      <div className="mt-0.5 grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg bg-[#0a0a0a] text-[#f5c842]">
                        <i className="bi bi-stars text-sm" />
                      </div>
                      <div className="min-w-0 flex-1 pt-0.5">
                        <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-[#8a6d00]">
                          Talma AI
                        </p>

                        {message.content ? <Markdown text={message.content} /> : <TypingDots />}

                        {isStreaming && isLastAssistant && message.content && (
                          <span className="mt-1 inline-block h-4 w-[3px] animate-pulse rounded-full bg-[#15803d] align-middle" />
                        )}

                        {!isStreaming && isLastAssistant && message.content && (
                          <div className="mt-2 flex flex-wrap items-center gap-1">
                            <button
                              type="button"
                              onClick={() => void copyMessage(message.content, messageKey)}
                              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-[#7b857b] transition-colors hover:bg-[#f5f8f5] hover:text-[#0a0a0a]"
                            >
                              <i className={`bi ${copiedKey === messageKey ? 'bi-check2' : 'bi-clipboard'}`} />
                              {copiedKey === messageKey ? 'Copied' : 'Copy'}
                            </button>
                            <button
                              type="button"
                              onClick={regenerate}
                              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-[#7b857b] transition-colors hover:bg-[#f5f8f5] hover:text-[#0a0a0a]"
                            >
                              <i className="bi bi-arrow-clockwise" />
                              Regenerate
                            </button>
                            <button
                              type="button"
                              onClick={clearChat}
                              className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-[#7b857b] transition-colors hover:bg-[#f5f8f5] hover:text-[#0a0a0a]"
                            >
                              <i className="bi bi-trash3" />
                              Clear chat
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Notice */}
          {notice && (
            <div className="border-t border-[#f5c842]/30 bg-[#fffbef] px-4 py-2.5 sm:px-6">
              <div className="mx-auto flex max-w-3xl items-start gap-2">
                <i
                  className={`bi ${
                    notice.tone === 'error' ? 'bi-exclamation-triangle' : 'bi-info-circle'
                  } mt-0.5 text-[#8a6d00]`}
                />
                <p className="flex-1 text-[11.5px] leading-relaxed text-[#8a6d00]">
                  {notice.text}
                </p>
                <button
                  type="button"
                  onClick={() => setNotice(null)}
                  aria-label="Dismiss message"
                  className="rounded p-0.5 text-[#8a6d00]/70 transition-colors hover:text-[#8a6d00]"
                >
                  <i className="bi bi-x-lg text-[10px]" />
                </button>
              </div>
            </div>
          )}

          {/* Composer */}
          <div className="border-t border-[#e6e9e6] bg-white px-3 pb-3 pt-3 sm:px-5">
            <div className="mx-auto max-w-3xl">
              <div
                className="rounded-2xl border border-[#dfe5df] bg-white shadow-sm transition-all focus-within:border-[#f5c842] focus-within:shadow-md"
                onDragOver={(event) => {
                  if (event.dataTransfer.types.includes('Files')) event.preventDefault()
                }}
                onDrop={onDrop}
              >
                {(attachments.length > 0 || isPreparing) && (
                  <div className="flex flex-wrap items-center gap-2 px-3 pt-3">
                    {attachments.map((attachment) => (
                      <div
                        key={attachment.id}
                        className="group relative h-16 w-16 overflow-hidden rounded-lg border border-[#e6e9e6] bg-[#f2f5f2]"
                      >
                        <img
                          src={attachment.dataUrl}
                          alt={attachment.name}
                          className="h-full w-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removeAttachment(attachment.id)}
                          aria-label={`Remove ${attachment.name}`}
                          className="absolute right-0.5 top-0.5 grid h-5 w-5 place-items-center rounded-full bg-black/70 text-white opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                        >
                          <i className="bi bi-x text-[11px]" />
                        </button>
                      </div>
                    ))}
                    {isPreparing && (
                      <div className="grid h-16 w-16 place-items-center rounded-lg border border-dashed border-[#f5c842] bg-[#fffbef]">
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#f5c842] border-t-transparent" />
                      </div>
                    )}
                    <span className="text-[10px] font-semibold text-[#8a6d00]">
                      {attachments.length}/{MAX_IMAGE_ATTACHMENTS}
                    </span>
                  </div>
                )}

                <label htmlFor="talma-ai-input" className="sr-only">
                  Message Talma AI
                </label>
                <textarea
                  id="talma-ai-input"
                  ref={textareaRef}
                  value={input}
                  onChange={(event) => setInput(event.target.value)}
                  onKeyDown={onKeyDown}
                  onPaste={onPaste}
                  rows={1}
                  placeholder={
                    mode === 'study'
                      ? 'Ask about any topic, or attach a picture…'
                      : 'Message Talma AI, or attach a picture…'
                  }
                  className="max-h-40 w-full resize-none bg-transparent px-4 pb-1 pt-3.5 text-sm leading-relaxed text-[#0a0a0a] outline-none placeholder:text-[#9aa39a]"
                />

                <div className="flex items-center justify-between gap-2 px-2.5 pb-2.5">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <div className="flex rounded-full bg-[#f2f5f2] p-0.5">
                      {(['general', 'study'] as const).map((option) => (
                        <button
                          key={option}
                          type="button"
                          onClick={() => changeMode(option)}
                          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-all ${
                            mode === option
                              ? 'bg-[#0a0a0a] text-white shadow-sm'
                              : 'text-[#4d554d] hover:text-[#0a0a0a]'
                          }`}
                        >
                          {option === 'general' ? 'General' : 'Study'}
                        </button>
                      ))}
                    </div>

                    {mode === 'study' && (
                      <select
                        value={level}
                        onChange={(event) => changeLevel(event.target.value as StudyLevel)}
                        aria-label="Study level"
                        className="rounded-full border border-[#e6e9e6] bg-white px-2 py-1 text-[11px] font-semibold text-[#4d554d] focus:border-[#f5c842] focus:outline-none"
                      >
                        {STUDY_LEVELS.map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.label}
                          </option>
                        ))}
                      </select>
                    )}

                    <button
                      type="button"
                      onClick={openFilePicker}
                      disabled={isPreparing}
                      aria-label="Attach pictures"
                      title={
                        visionReady
                          ? 'Attach pictures (PNG, JPEG, WebP or GIF)'
                          : 'Pictures need a vision model'
                      }
                      className={`grid h-7 w-7 place-items-center rounded-full border transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                        attachments.length > 0
                          ? 'border-[#f5c842] bg-[#fdf5d7] text-[#8a6d00]'
                          : 'border-[#e6e9e6] text-[#7b857b] hover:border-[#f5c842] hover:text-[#8a6d00]'
                      }`}
                    >
                      <i className="bi bi-image text-[11px]" />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept={IMAGE_ACCEPT}
                      multiple
                      className="hidden"
                      onChange={onFileChange}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="hidden text-[10.5px] text-[#8a938a] sm:inline">
                      Enter to send
                    </span>
                    {isStreaming ? (
                      <button
                        type="button"
                        onClick={stop}
                        aria-label="Stop generating"
                        className="grid h-9 w-9 place-items-center rounded-full bg-[#0a0a0a] text-white transition-colors hover:bg-[#15803d]"
                      >
                        <i className="bi bi-stop-fill text-sm" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => send()}
                        disabled={(!input.trim() && attachments.length === 0) || isPreparing}
                        aria-label="Send message"
                        className="grid h-9 w-9 place-items-center rounded-full bg-[#15803d] text-white transition-all hover:bg-[#22c55e] hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-35"
                      >
                        <i className="bi bi-arrow-up" />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <p className="mt-2 text-center text-[10.5px] leading-relaxed text-[#8a938a]">
                Talma AI can make mistakes — check important information. Pictures only (no video
                or audio); Shift + Enter adds a new line.
              </p>
              {freeMode && !visionReady && (
                <p className="mt-1 text-center text-[10.5px] leading-relaxed text-[#8a6d00]">
                  <i className="bi bi-image mr-1" />
                  Picture reading needs a vision model — add a Gemini or Groq key in server/.env.
                </p>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
