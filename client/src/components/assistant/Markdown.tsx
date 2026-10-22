import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'

/**
 * A small, dependency-free Markdown renderer tuned for chat replies.
 *
 * Supports headings, paragraphs, ordered/unordered lists, block quotes,
 * fenced code blocks (with copy), inline code, bold, italics, links and
 * horizontal rules. Everything is rendered as React nodes — no HTML injection.
 */

type Block =
  | { type: 'paragraph'; content: string }
  | { type: 'heading'; level: 1 | 2 | 3; content: string }
  | { type: 'list'; ordered: boolean; items: string[] }
  | { type: 'quote'; content: string }
  | { type: 'code'; language: string; content: string }
  | { type: 'divider' }

const INLINE_PATTERN =
  /(\*\*[^*]+\*\*|__[^_]+__|\*[^*\n]+\*|_[^_\n]+_|`[^`\n]+`|\[[^\]]+\]\([^)\s]+\))/g

function renderInline(text: string, keyPrefix = 'inline'): ReactNode[] {
  const pattern = new RegExp(INLINE_PATTERN.source, 'g')
  const nodes: ReactNode[] = []
  let lastIndex = 0
  let match: RegExpExecArray | null = pattern.exec(text)

  while (match) {
    if (match.index > lastIndex) nodes.push(text.slice(lastIndex, match.index))

    const token = match[0]
    const key = `${keyPrefix}-${match.index}`

    if (token.startsWith('**') || token.startsWith('__')) {
      nodes.push(
        <strong key={key} className="font-semibold text-[#0a0a0a]">
          {renderInline(token.slice(2, -2), key)}
        </strong>,
      )
    } else if (token.startsWith('`')) {
      nodes.push(
        <code
          key={key}
          className="rounded-md bg-[#eef4ef] px-1.5 py-0.5 font-mono text-[0.85em] text-[#15803d]"
        >
          {token.slice(1, -1)}
        </code>,
      )
    } else if (token.startsWith('[')) {
      const link = /^\[([^\]]+)\]\(([^)\s]+)\)$/.exec(token)
      const label = link?.[1] ?? token
      const href = link?.[2]

      if (href && /^(https?:\/\/|\/)/.test(href)) {
        nodes.push(
          <a
            key={key}
            href={href}
            target="_blank"
            rel="noreferrer noopener"
            className="font-medium text-[#15803d] underline decoration-[#f5c842] decoration-2 underline-offset-2 transition-colors hover:text-[#22c55e]"
          >
            {label}
          </a>,
        )
      } else {
        nodes.push(token)
      }
    } else {
      nodes.push(
        <em key={key} className="italic">
          {renderInline(token.slice(1, -1), key)}
        </em>,
      )
    }

    lastIndex = pattern.lastIndex
    match = pattern.exec(text)
  }

  if (lastIndex < text.length) nodes.push(text.slice(lastIndex))

  return nodes
}

function parseBlocks(text: string): Block[] {
  const lines = text.replace(/\r\n?/g, '\n').split('\n')
  const blocks: Block[] = []
  let index = 0

  while (index < lines.length) {
    const line = lines[index] ?? ''
    const trimmed = line.trim()

    if (!trimmed) {
      index += 1
      continue
    }

    if (trimmed.startsWith('```')) {
      const language = trimmed.slice(3).trim()
      const code: string[] = []
      index += 1

      while (index < lines.length && !(lines[index] ?? '').trim().startsWith('```')) {
        code.push(lines[index] ?? '')
        index += 1
      }
      index += 1

      blocks.push({ type: 'code', language, content: code.join('\n') })
      continue
    }

    const heading = /^(#{1,3})\s+(.+)$/.exec(trimmed)
    if (heading) {
      const level = Math.min(heading[1]?.length ?? 1, 3) as 1 | 2 | 3
      blocks.push({ type: 'heading', level, content: heading[2] ?? '' })
      index += 1
      continue
    }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(trimmed)) {
      blocks.push({ type: 'divider' })
      index += 1
      continue
    }

    if (/^[-*+]\s+/.test(trimmed)) {
      const items: string[] = []
      while (index < lines.length && /^[-*+]\s+/.test((lines[index] ?? '').trim())) {
        items.push((lines[index] ?? '').trim().replace(/^[-*+]\s+/, ''))
        index += 1
      }
      blocks.push({ type: 'list', ordered: false, items })
      continue
    }

    if (/^\d+[.)]\s+/.test(trimmed)) {
      const items: string[] = []
      while (index < lines.length && /^\d+[.)]\s+/.test((lines[index] ?? '').trim())) {
        items.push((lines[index] ?? '').trim().replace(/^\d+[.)]\s+/, ''))
        index += 1
      }
      blocks.push({ type: 'list', ordered: true, items })
      continue
    }

    if (trimmed.startsWith('>')) {
      const quote: string[] = []
      while (index < lines.length && (lines[index] ?? '').trim().startsWith('>')) {
        quote.push((lines[index] ?? '').trim().replace(/^>\s?/, ''))
        index += 1
      }
      blocks.push({ type: 'quote', content: quote.join('\n') })
      continue
    }

    const paragraph: string[] = [trimmed]
    index += 1

    while (index < lines.length) {
      const candidate = (lines[index] ?? '').trim()
      if (!candidate) break
      if (/^(#{1,3}\s|[-*+]\s+|\d+[.)]\s+|>|```)/.test(candidate)) break
      paragraph.push(candidate)
      index += 1
    }

    blocks.push({ type: 'paragraph', content: paragraph.join('\n') })
  }

  return blocks
}

function CodeBlock({ code, language }: { code: string; language: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1600)
    } catch {
      // Clipboard access can be blocked; the button simply does nothing.
    }
  }

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0a0a0a]">
      <div className="flex items-center justify-between gap-2 border-b border-white/10 px-3 py-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#f5c842]/80">
          {language || 'code'}
        </span>
        <button
          type="button"
          onClick={() => void copy()}
          className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-white/60 transition-colors hover:bg-white/10 hover:text-white"
        >
          <i className={`bi ${copied ? 'bi-check2' : 'bi-clipboard'}`} />
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="overflow-x-auto p-3 font-mono text-[12.5px] leading-relaxed text-[#e9f5ec]">
        <code>{code}</code>
      </pre>
    </div>
  )
}

export default function Markdown({ text }: { text: string }) {
  const blocks = useMemo(() => parseBlocks(text), [text])

  return (
    <div className="space-y-3 break-words text-[14px] leading-relaxed text-[#263026]">
      {blocks.map((block, index) => {
        const key = `${block.type}-${index}`

        switch (block.type) {
          case 'heading': {
            const className =
              block.level === 1
                ? 'font-heading text-lg font-semibold text-[#0a0a0a]'
                : block.level === 2
                  ? 'text-base font-semibold text-[#0a0a0a]'
                  : 'text-[13px] font-semibold uppercase tracking-[0.12em] text-[#15803d]'

            if (block.level === 1) {
              return (
                <h1 key={key} className={className}>
                  {renderInline(block.content, key)}
                </h1>
              )
            }
            if (block.level === 2) {
              return (
                <h2 key={key} className={className}>
                  {renderInline(block.content, key)}
                </h2>
              )
            }
            return (
              <h3 key={key} className={className}>
                {renderInline(block.content, key)}
              </h3>
            )
          }

          case 'list': {
            const items = block.items.map((item, itemIndex) => (
              <li key={`${key}-${itemIndex}`} className="pl-0.5">
                {renderInline(item, `${key}-${itemIndex}`)}
              </li>
            ))

            return block.ordered ? (
              <ol key={key} className="list-decimal space-y-1 pl-5 marker:text-[#15803d]">
                {items}
              </ol>
            ) : (
              <ul key={key} className="list-disc space-y-1 pl-5 marker:text-[#15803d]">
                {items}
              </ul>
            )
          }

          case 'quote':
            return (
              <blockquote
                key={key}
                className="rounded-r-lg border-l-2 border-[#f5c842] bg-[#fffbef] py-2 pl-3 pr-2 italic text-[#4d554d]"
              >
                {renderInline(block.content, key)}
              </blockquote>
            )

          case 'code':
            return <CodeBlock key={key} code={block.content} language={block.language} />

          case 'divider':
            return <hr key={key} className="border-[#e6e9e6]" />

          case 'paragraph':
            return (
              <p key={key} className="whitespace-pre-wrap">
                {renderInline(block.content, key)}
              </p>
            )

          default:
            return null
        }
      })}
    </div>
  )
}
