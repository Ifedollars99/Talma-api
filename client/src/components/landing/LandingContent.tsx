import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import type { CSSProperties, ReactNode } from 'react'
import { useInView } from '../../hooks/useInView'

interface ChatMessage {
  role: 'user' | 'assistant'
  text: string
}

const QUICK_PROMPTS = [
  'How do I get started?',
  'How do I share notes?',
  'Where are lecturer slides?',
  'Give me a study tip',
]

const tickerItems = ['Teaching', 'Learning', 'Notes', 'Questions', 'Slides', 'Exam prep', 'Study together']

const stats = [
  { to: 120, suffix: 'K+', label: 'Students learning on Talma' },
  { to: 85, suffix: '+', label: 'Institutions & classrooms' },
  { to: 2.4, suffix: 'M', label: 'Notes shared by students', decimals: 1 },
]

const audiences = [
  {
    id: 'primary',
    name: 'Primary School',
    icon: 'bi-stars',
    accent: '#3a8f4d',
    tag: '#3a8f4d',
    iconInk: '#ffffff',
    desc: 'Playful, visual learning that makes early education joyful — simple notes, quizzes and encouragement shared in the classroom feed.',
  },
  {
    id: 'secondary',
    name: 'Secondary School',
    icon: 'bi-lightbulb',
    accent: '#f5c842',
    tag: '#8a6d00',
    iconInk: '#0a0a0a',
    desc: 'Peer notes, study groups and exam prep — a study rhythm built by students, for students, before the final bell.',
  },
  {
    id: 'university',
    name: 'University',
    icon: 'bi-mortarboard',
    accent: '#3a8f4d',
    tag: '#3a8f4d',
    iconInk: '#ffffff',
    desc: 'Lecturers upload slides, readings and past papers once; students ask mid-lecture and share verified notes with the whole class.',
  },
]

const steps = [
  {
    n: '01',
    title: 'Share notes',
    desc: 'Post your class notes and make them the default for everyone who missed it.',
  },
  {
    n: '02',
    title: 'Ask & answer',
    desc: 'Throw a question into the feed mid-lecture — classmates answer before the bell.',
  },
  {
    n: '03',
    title: 'Lecturers upload',
    desc: 'Slides, readings and past papers land in the same feed your students already watch.',
  },
  {
    n: '04',
    title: 'Study together',
    desc: 'Save, like and follow — a study rhythm built from real classroom moments.',
  },
]

const moments = [
  {
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/230201-N-DK722-1002_-_NAVEUR-NAVAF_Band_visits_Nigerian_National_Museum_and_University_of_Lagos.jpg/1280px-230201-N-DK722-1002_-_NAVEUR-NAVAF_Band_visits_Nigerian_National_Museum_and_University_of_Lagos.jpg',
    alt: 'US Navy band visiting the University of Lagos and Nigerian National Museum',
    caption: 'Notes posted 12 minutes ago — already 8 replies.',
  },
  {
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Adetokunbo_Sofoluwe_Park%2C_Unilag.jpg/960px-Adetokunbo_Sofoluwe_Park%2C_Unilag.jpg',
    alt: 'Lecturer presenting slides',
    caption: "A lecturer's slides, live before class even ends.",
  },
  {
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Confucius_Institute%2C_University_of_Lagos.jpg/960px-Confucius_Institute%2C_University_of_Lagos.jpg',
    alt: 'Students studying together in a library',
    caption: 'Notes passed hand to hand, same lecture.',
  },
  {
    src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/230201-N-DK722-1016_-_NAVEUR-NAVAF_Band_visits_Nigerian_National_Museum_and_University_of_Lagos.jpg/1920px-230201-N-DK722-1016_-_NAVEUR-NAVAF_Band_visits_Nigerian_National_Museum_and_University_of_Lagos.jpg',
    alt: 'Late night library study session',
    caption: 'Late-night library session, whole floor included.',
  },
]

function localFallback(text: string): string {
  const t = text.toLowerCase()
  if (/start|sign ?up|register|join|account/.test(t))
    return 'To get started, hit "Get started" up top or go to /signup to create an account. Then head to #how to see how the feed works.'
  if (/note|share|post|upload/.test(t))
    return 'To share notes: open your class feed, post your notes, and classmates can reply, like and save them. The best notes become the class default.'
  if (/slide|lecturer|reading|past paper|material/.test(t))
    return 'Lecturer slides, readings and past papers live in the same class feed — check #users for the lecturer view, or ask here and lecturers reply directly.'
  if (/where|navigate|find|how it works|contact|whatsapp/.test(t))
    return 'Quick tour: How it works -> #how, Campus life -> #moments, Students & lecturers -> #audience, Contact via WhatsApp -> #contact, Signup -> /signup.'
  if (/tip|study|exam|motivat|focus|prepare/.test(t))
    return 'Study tip: use 25-min focused sprints (Pomodoro), then quiz yourself from your notes instead of re-reading. Post your summary to the feed — teaching it locks it in.'
  if (/hello|hi|hey/.test(t))
    return 'Hello! Ask me how to use Talma, where anything lives on this page, or for a study tip to get going.'
  return 'Great question! In demo mode I cover app help, navigation (#how, #audience, #moments, #contact) and study tips. Add an OpenAI API key above for full AI answers.'
}

function Stat({ to, suffix, label, decimals = 0 }: { to: number; suffix?: string; label: string; decimals?: number }) {
  const { ref, inView } = useInView<HTMLSpanElement>()
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!inView) return
    const duration = 1600
    const start = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const progress = Math.min((now - start) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(to * eased)
      if (progress < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [inView, to])

  const formatted = value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })

  return (
    <div className="stat">
      <div className="stat__num">
        <span ref={ref}>{formatted}</span>
        {suffix ? <sup>{suffix}</sup> : null}
      </div>
      <div className="stat__label">{label}</div>
    </div>
  )
}

function Reveal({ children, className = '', delay = 0 }: { children: ReactNode; className?: string; delay?: number }) {
  const { ref, inView } = useInView()
  return (
    <div
      ref={ref}
      className={`reveal ${inView ? 'is-visible' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  )
}

/** Landing page body — Green / Gold / Black / White social learning experience. */
export function LandingContent() {
  /* ---------- Campus moments carousel ---------- */
  const [momentIndex, setMomentIndex] = useState(0)
  const nextMoment = () => setMomentIndex((index) => (index + 1) % moments.length)
  const prevMoment = () => setMomentIndex((index) => (index - 1 + moments.length) % moments.length)

  /* ---------- AI Study Assistant ---------- */
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', text: "Hi! I'm LINT — Learning Intelligence. Ask me how Talma works, where to find things, or for a study tip to get going." },
  ])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const messagesRef = useRef<HTMLDivElement>(null)

  const scrollChat = () => {
    window.requestAnimationFrame(() => {
      const element = messagesRef.current
      if (element) element.scrollTop = element.scrollHeight
    })
  }

  const sendMessage = (explicitText?: string) => {
    const text = (explicitText ?? input).trim()
    if (!text || isTyping) return

    const nextMessages: ChatMessage[] = [...messages, { role: 'user', text }]
    setMessages(nextMessages)
    setInput('')
    setIsTyping(true)
    scrollChat()

    window.setTimeout(() => {
      setMessages([...nextMessages, { role: 'assistant', text: localFallback(text) }])
      setIsTyping(false)
      scrollChat()
    }, 450)
  }

  const askQuick = (question: string) => {
    setInput(question)
    void sendMessage(question)
  }

  const activeMoment = moments[momentIndex] ?? moments[0]

  /* ---------- Render ---------- */
  return (
    <div className="landing-page">
      {/* Ticker */}
      <div className="ticker" aria-hidden="true">
        <div className="ticker__track">
          {[0, 1].map((group) => (
            <div className="ticker__group" key={group}>
              {tickerItems.map((item) => (
                <span className="ticker__item" key={`${group}-${item}`}>
                  <i className="bi bi-star-fill" />
                  {item}
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Hero */}
      <section className="hero">
        <div className="hero__glow hero__glow--green" />
        <div className="hero__glow hero__glow--gold" />
        <div className="hero__inner">
          <div className="hero__copy">
            <span className="hero__badge">
              <i />
              Teaching &amp; Learning · For primary, secondary &amp; university students
            </span>
            <h1 className="hero__title">
              <span className="line">
                <span className="line-inner gold">Where teaching</span>
              </span>
              <span className="line">
                <span className="line-inner">
                  <span className="gold">becomes</span> <em className="hl">learning</em>.
                </span>
              </span>
            </h1>
            <p className="hero__lede">
              Talma is the social learning platform where primary, secondary and university students
              share notes, ask questions mid-lecture and get slides the moment they are posted — all
              in one feed for the class.
            </p>
            <div className="hero__actions">
              <Link to="/signup" className="btn btn--green">
                Start learning <i className="bi bi-arrow-right" />
              </Link>
              <a href="#how">
                <button type="button" className="btn btn--ghost">
                  Explore how it works
                </button>
              </a>
            </div>
          </div>

          <div className="hero__visual" aria-hidden="true">
            <div className="float-card float-card--1">
              <span className="float-card__tag">Notes · Week 12</span>
              <h3>Calculus notes, shared</h3>
              <p>3 pages · posted minutes ago</p>
            </div>
            <div className="float-card float-card--2">
              <span className="float-card__tag float-card__tag--gold">Question</span>
              <h3>“Where did we diverge?”</h3>
              <p>Asked during the lecture</p>
            </div>
            <div className="float-card float-card--3">
              <span className="float-card__tag float-card__tag--green">Lecturer · Slides</span>
              <h3>Week 12 deck uploaded</h3>
              <p>Waiting in the class feed</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="stats">
        <div className="stats__grid">
          {stats.map((stat) => (
            <Reveal key={stat.label} className="stat-wrap">
              <Stat to={stat.to} suffix={stat.suffix} label={stat.label} decimals={stat.decimals ?? 0} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* Audience */}
      <section id="audience" className="audience">
        <div className="section__head">
          <h2>One platform for every stage of learning</h2>
          <p>From the youngest classroom to the lecture hall</p>
        </div>

        <div className="audience__grid">
          {audiences.map((audience, index) => (
            <Reveal key={audience.id} delay={index * 120}>
              <article
                className="audience-card"
                style={{ '--accent': audience.accent, '--tag': audience.tag, '--icon': audience.iconInk } as CSSProperties}
              >
                <div className="audience-card__icon">
                  <i className={`bi ${audience.icon}`} />
                </div>
                <h3>{audience.name}</h3>
                <p>{audience.desc}</p>
                <span className="audience-card__tag">Learning · {audience.id}</span>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="how">
        <div className="section__head">
          <h2>How it works</h2>
          <p>Everything built for social learning</p>
        </div>

        <div className="how__grid">
          {steps.map((step, index) => (
            <Reveal key={step.n} delay={index * 100}>
              <article className="how-card">
                <div className="how-card__num">{step.n}</div>
                <h3>{step.title}</h3>
                <p>{step.desc}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Campus moments */}
      <section id="moments" className="moments">
        <div className="section__head">
          <h2>Campus moments</h2>
          <p>What social learning looks like day to day</p>
        </div>

        <div className="carousel">
          <button type="button" className="carousel__nav carousel__nav--prev" onClick={prevMoment} aria-label="Previous photo">
            <i className="bi bi-chevron-left" />
          </button>

          <div className="carousel__viewport">
            <img src={activeMoment?.src} alt={activeMoment?.alt} className="carousel__img" />
            <div className="carousel__caption">
              <span className="carousel__index">
                {String(momentIndex + 1).padStart(2, '0')} / {String(moments.length).padStart(2, '0')}
              </span>
              <p>{activeMoment?.caption}</p>
            </div>
          </div>

          <button type="button" className="carousel__nav carousel__nav--next" onClick={nextMoment} aria-label="Next photo">
            <i className="bi bi-chevron-right" />
          </button>
        </div>

        <div className="carousel__dots">
          {moments.map((moment, index) => (
            <button
              key={moment.src}
              type="button"
              className={`dot ${index === momentIndex ? 'dot--active' : ''}`}
              onClick={() => setMomentIndex(index)}
              aria-label={`Go to photo ${index + 1}`}
            />
          ))}
        </div>
      </section>

      {/* AI Study Assistant */}
      <section id="assistant" className="assistant">
        <div className="section__head">
          <h2>Ask LINT</h2>
          <p>AI-powered help with notes, navigation &amp; study tips</p>
        </div>

        <div className="assistant__card">
          <div className="assistant__header">
            <span className="assistant__dot" />
            <div>
              <strong>LINT</strong>
              <p>Learning Intelligence · Guided demo — sign in for full AI</p>
            </div>
          </div>

          <div ref={messagesRef} className="assistant__messages">
            {messages.map((message, index) => (
              <div key={`${message.role}-${index}`} className={`msg ${message.role === 'user' ? 'msg--user' : 'msg--bot'}`}>
                <p>{message.text}</p>
              </div>
            ))}
            {isTyping && (
              <div className="msg msg--bot msg--typing">
                <span />
                <span />
                <span />
              </div>
            )}
          </div>

          <div className="assistant__chips">
            {QUICK_PROMPTS.map((prompt) => (
              <button key={prompt} type="button" onClick={() => askQuick(prompt)}>
                {prompt}
              </button>
            ))}
          </div>

          <form
            className="assistant__form"
            onSubmit={(event) => {
              event.preventDefault()
              void sendMessage()
            }}
          >
            <input
              value={input}
              placeholder="Ask about notes, lecturers, signup..."
              disabled={isTyping}
              onChange={(event) => setInput(event.target.value)}
            />
            <button type="submit" disabled={!input.trim() || isTyping} aria-label="Send message">
              <i className="bi bi-send" />
            </button>
          </form>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="contact">
        <h2>Get in touch</h2>
        <p>Have questions? We&rsquo;d love to hear from you.</p>
        <a
          href="https://wa.me/2348137628419?text=Hello%20%F0%9F%91%8B%20I%20have%20questions%20about%20Talma"
          target="_blank"
          rel="noopener noreferrer"
          className="whatsapp-btn"
        >
          <i className="bi bi-whatsapp" />
          <span>Message on WhatsApp</span>
        </a>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="footer__grid">
          <div>
            <h3>Talma</h3>
            <p className="footer__text">
              Teaching &amp; learning, beautifully simple. A social learning platform connecting
              students and lecturers, one class at a time.
            </p>
            <p className="footer__contact">
              <i className="bi bi-envelope" /> support@talma.app
            </p>
          </div>

          <div>
            <h3>Explore</h3>
            <p className="footer__text">
              <a href="#how">How it works</a>
              <a href="#audience">Who it&rsquo;s for</a>
              <a href="#moments">Campus moments</a>
              <a href="#assistant">LINT</a>
            </p>
          </div>

          <div>
            <h3>About</h3>
            <p className="footer__text">
              Copyright © 2026. All rights reserved.
              <span className="footer__credit">Made by Ifedollars.</span>
              <span className="footer__credit">Campus photos via Wikimedia Commons contributors.</span>
            </p>
          </div>
        </div>

        <div className="footer__bottom">
          <p>Talma — Social Learning Platform</p>
        </div>
      </footer>
    </div>
  )
}

export default LandingContent
