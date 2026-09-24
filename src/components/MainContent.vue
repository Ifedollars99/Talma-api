<!--
  Photos are hotlinked from Wikimedia Commons (University of Lagos campus and events).
  Most are CC BY-SA / public domain (US Navy photos) — credited in the footer below.
  Swap any src for a different Commons file by keeping the same URL pattern and
  changing only the width number (e.g. /1920px-) to resize.
-->
<template>
  <div class="page">
    <!-- Top ticker -->
    <div class="ticker">
      <span class="ticker__tag">Study Social</span>
      <p class="ticker__msg">
        A feed where students trade notes, ask questions, and study together — built for class, not for scrolling.
      </p>
    </div>

    <!-- Hero -->
    <section class="hero">
      <div class="hero__inner">
        <div class="hero__copy">
          <p class="hero__kicker">For students and lecturers</p>
          <h1 class="hero__title">
            Social learning,<br />
            made <span class="highlight">simple</span>.
          </h1>
          <p class="hero__lede">
            Share notes, ask questions mid-lecture, and get slides the moment
            they're posted — all in one feed for your class.
          </p>
          <div class="hero__actions">
            <router-link to="/signup">
              <button class="btn btn--solid">Get started</button>
            </router-link>
            <a href="#how"><button class="btn btn--outline">See how it works</button></a>
          </div>
        </div>

        <div class="hero__frame">
          <div class="hero__photos">
            <img
              v-for="(img, i) in heroImages"
              :key="img.src"
              :src="img.src"
              :alt="img.alt"
              class="hero__img"
              :class="{ 'is-active': i === heroIndex }"
            />
          </div>
          <p class="hero__caption">{{ heroImages[heroIndex].caption }}</p>
        </div>
      </div>
    </section>

    <!-- How it works -->
    <section id="how" class="how">
      <div class="section__head">
        <h2>How it works</h2>
        <p>Everything built for social learning</p>
      </div>

      <div class="marquee">
        <div class="marquee__track">
          <article
            v-for="(f, i) in loopedFeatures"
            :key="i + '-' + f.title"
            class="note-card"
          >
            <div class="note-card__photo">
              <img :src="f.image" :alt="f.title" />
            </div>
            <div class="note-card__body">
              <i :class="['bi', f.icon]"></i>
              <h3>{{ f.title }}</h3>
              <p>{{ f.desc }}</p>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- Campus moments carousel -->
    <section class="moments">
      <div class="section__head">
        <h2>Campus moments</h2>
        <p>What social learning looks like day to day</p>
      </div>

      <div class="carousel">
        <button class="carousel__nav carousel__nav--prev" @click="prevMoment" aria-label="Previous photo">
          <i class="bi bi-chevron-left"></i>
        </button>

        <div class="carousel__viewport">
          <img
            :src="moments[momentIndex].src"
            :alt="moments[momentIndex].alt"
            class="carousel__img"
          />
          <div class="carousel__caption">
            <span class="carousel__index">
              {{ String(momentIndex + 1).padStart(2, '0') }} / {{ String(moments.length).padStart(2, '0') }}
            </span>
            <p>{{ moments[momentIndex].caption }}</p>
          </div>
        </div>

        <button class="carousel__nav carousel__nav--next" @click="nextMoment" aria-label="Next photo">
          <i class="bi bi-chevron-right"></i>
        </button>
      </div>

      <div class="carousel__dots">
        <button
          v-for="(m, i) in moments"
          :key="i"
          class="dot"
          :class="{ 'dot--active': i === momentIndex }"
          @click="momentIndex = i"
          :aria-label="'Go to photo ' + (i + 1)"
        ></button>
      </div>
    </section>

    <!-- For students & lecturers -->
    <section id="users" class="users">
      <div class="section__head">
        <h2>Built for everyone in the room</h2>
        <p>Whether you're taking the class or teaching it</p>
      </div>

      <article class="user-card">
        <div class="user-card__media">
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Adetokunbo_Sofoluwe_Park%2C_Unilag.jpg/960px-Adetokunbo_Sofoluwe_Park%2C_Unilag.jpg" alt="Students studying together" />
        </div>
        <div class="user-card__copy">
          <h3>For students</h3>
          <p>
            Post your notes and make them the class default. Ask a question during
            the lecture and get an answer before it ends. Everything a lecturer shares
            lives in the same feed as your classmates' notes — no group chat archaeology required.
          </p>
        </div>
      </article>

      <article class="user-card user-card--reverse">
        <div class="user-card__copy">
          <h3>For lecturers</h3>
          <p>
            Upload slides, readings, and past papers once. Answer student questions
            directly instead of by email. See what's actually confusing the class
            in real time, not at the end of term.
          </p>
        </div>
        <div class="user-card__media">
          <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Department_of_Radiology%2C_University_of_Lagos.jpg/960px-Department_of_Radiology%2C_University_of_Lagos.jpg" alt="Lecturer teaching a class" />
        </div>
      </article>
    </section>

    <!-- AI Study Assistant -->
    <section id="assistant" class="assistant">
      <div class="section__head">
        <h2>Ask Study Assistant</h2>
        <p>AI-powered help with notes, navigation &amp; study tips</p>
      </div>

      <div class="assistant__card">
        <div class="assistant__header">
          <span class="assistant__dot"></span>
          <div>
            <strong>Study Assistant</strong>
            <p>{{ apiKey ? 'AI online' : 'Demo mode — add API key for AI' }}</p>
          </div>
          <button class="assistant__key-btn" @click="showKeyInput = !showKeyInput" type="button">
            <i class="bi bi-key"></i> {{ showKeyInput ? 'Hide' : 'API key' }}
          </button>
        </div>

        <div v-if="showKeyInput" class="assistant__keybox">
          <input
            v-model="apiKey"
            type="password"
            placeholder="Paste OpenAI API key (sk-...) — stored only in your browser"
            @change="saveKey"
          />
          <small>Or set <code>VUE_APP_OPENAI_API_KEY</code> in a <code>.env</code> file. Without a key, the bot uses built-in answers.</small>
        </div>

        <div ref="messagesRef" class="assistant__messages">
          <div
            v-for="(m, i) in messages"
            :key="i"
            class="msg"
            :class="m.role === 'user' ? 'msg--user' : 'msg--bot'"
          >
            <p>{{ m.text }}</p>
          </div>
          <div v-if="isTyping" class="msg msg--bot msg--typing">
            <span></span><span></span><span></span>
          </div>
        </div>

        <div class="assistant__chips">
          <button
            v-for="q in quickPrompts"
            :key="q"
            type="button"
            @click="askQuick(q)"
          >
            {{ q }}
          </button>
        </div>

        <form class="assistant__form" @submit.prevent="sendMessage">
          <input
            v-model="input"
            placeholder="Ask about notes, lecturers, signup..."
            :disabled="isTyping"
          />
          <button type="submit" :disabled="!input.trim() || isTyping" aria-label="Send message">
            <i class="bi bi-send"></i>
          </button>
        </form>
      </div>
    </section>

    <!-- Contact -->
    <section id="contact" class="contact">
      <h2>Get in touch</h2>
      <p>Have questions? We'd love to hear from you.</p>
      <a
        href="https://wa.me/2348137628419?text=Hello%20%F0%9F%91%8B%20I%20have%20questions%20about%20Study%20Social"
        target="_blank"
        rel="noopener noreferrer"
        class="whatsapp-btn"
      >
        <i class="bi bi-whatsapp"></i>
        <span>Message on WhatsApp</span>
      </a>
    </section>

    <!-- Footer -->
    <footer class="footer">
      <div class="footer__grid">
        <div>
          <h3>Study Social</h3>
          <p class="footer__text">
            A social learning platform connecting students and lecturers, one class at a time.
          </p>
          <p class="footer__contact"><i class="bi bi-envelope"></i> support@studysocial.com</p>
        </div>

        <div class="footer__calendar">
          <h3>Calendar</h3>
          <div class="calendar">
            <div class="calendar__header">
              <button @click="previousMonth" aria-label="Previous month"><i class="bi bi-chevron-left"></i></button>
              <span>{{ monthName }} {{ currentYear }}</span>
              <button @click="nextMonth" aria-label="Next month"><i class="bi bi-chevron-right"></i></button>
            </div>
            <div class="calendar__weekdays">
              <span v-for="day in dayHeaders" :key="day">{{ day }}</span>
            </div>
            <div class="calendar__days">
              <button
                v-for="(day, index) in calendarDays"
                :key="index"
                class="calendar__day"
                :class="getDayClasses(day)"
                @click="selectDate(day)"
              >
                {{ day.date }}
              </button>
            </div>
          </div>
          <p v-if="selectedDate" class="calendar__selected">{{ formatSelectedDate }}</p>
        </div>

        <div>
          <h3>About</h3>
          <p class="footer__text">
            Copyright © 2026. All rights reserved.
            <span class="footer__credit">Made by Ifedollars.</span>
          </p>
          <p class="footer__credit">Campus photos via Wikimedia Commons contributors.</p>
        </div>
      </div>

      <div class="footer__bottom">
        <p>Study Social — Social Learning Platform</p>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'

/* ---------- AI Study Assistant (embedded, AI-powered w/ offline fallback) ---------- */
const SYSTEM_PROMPT = `You are the Study Assistant for "Study Social", a social learning feed where students trade notes, ask questions mid-lecture, and get lecturer slides.
Help with: (1) Navigation — Get started -> /signup, How it works -> #how, Campus moments is a photo carousel, For students/lecturers -> #users, Contact/WhatsApp -> #contact.
(2) App FAQs — how to share notes, ask & answer, lecturer uploads (slides/readings/past papers), like & save.
(3) Study helper — study tips, exam prep guidance, motivation.
Keep answers short (under 90 words), friendly, student-focused. If asked something unrelated, gently steer back to studying or app help.`

const messages = ref([
  { role: 'assistant', text: "Hi! I'm the Study Assistant. Ask me how Study Social works, where to find things, or for a study tip to get going." },
])
const input = ref('')
const isTyping = ref(false)
const apiKey = ref('')
const showKeyInput = ref(false)
const messagesRef = ref(null)
const quickPrompts = [
  'How do I get started?',
  'How do I share notes?',
  'Where are lecturer slides?',
  'Give me a study tip',
]

onMounted(() => {
  const stored = localStorage.getItem('study-assistant-key')
  const envKey = process.env.VUE_APP_OPENAI_API_KEY
  if (stored) apiKey.value = stored
  else if (envKey) apiKey.value = envKey
})
function saveKey() {
  localStorage.setItem('study-assistant-key', apiKey.value.trim())
}
function scrollChat() {
  nextTick(() => {
    if (messagesRef.value) messagesRef.value.scrollTop = messagesRef.value.scrollHeight
  })
}
function askQuick(q) {
  input.value = q
  sendMessage()
}
async function sendMessage() {
  const text = input.value.trim()
  if (!text || isTyping.value) return
  messages.value.push({ role: 'user', text })
  input.value = ''
  scrollChat()
  isTyping.value = true
  try {
    const reply = apiKey.value.trim() ? await callAI() : localFallback(text)
    messages.value.push({ role: 'assistant', text: reply })
  } catch (e) {
    messages.value.push({ role: 'assistant', text: 'Sorry, the AI service failed. ' + localFallback(text) })
  } finally {
    isTyping.value = false
    scrollChat()
  }
}
async function callAI() {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ' + apiKey.value.trim(),
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages.value.slice(-10).map((m) => ({ role: m.role, content: m.text })),
      ],
      temperature: 0.7,
      max_tokens: 300,
    }),
  })
  if (!res.ok) throw new Error('AI request failed: ' + res.status)
  const data = await res.json()
  return data.choices?.[0]?.message?.content?.trim() || "Hmm, I didn't get that — try again."
}
function localFallback(text) {
  const t = text.toLowerCase()
  if (/start|sign ?up|register|join|account/.test(t)) return 'To get started, hit "Get started" up top or go to /signup to create an account. Then head to #how to see how the feed works.'
  if (/note|share|post|upload/.test(t)) return 'To share notes: open your class feed, post your notes, and classmates can reply, like and save them. The best notes become the class default.'
  if (/slide|lecturer|reading|past paper|material/.test(t)) return "Lecturer slides, readings and past papers live in the same class feed — check #users for the lecturer view, or ask here and lecturers reply directly."
  if (/where|navigate|find|how it works|contact|whatsapp/.test(t)) return 'Quick tour: How it works -> #how, Campus life -> campus moments carousel, Students & lecturers -> #users, Contact via WhatsApp -> #contact, Signup -> /signup.'
  if (/tip|study|exam|motivat|focus|prepare/.test(t)) return 'Study tip: use 25-min focused sprints (Pomodoro), then quiz yourself from your notes instead of re-reading. Post your summary to the feed — teaching it locks it in.'
  if (/hello|hi|hey/.test(t)) return 'Hello! Ask me how to use Study Social, where anything lives on this page, or for a study tip.'
  return 'Great question! In demo mode I cover app help, navigation (#how, #users, #contact, /signup) and study tips. Add an OpenAI API key above for full AI answers.'
}

/* ---------- Hero crossfade carousel ---------- */
const heroImages = [
  { src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/230201-N-DK722-1002_-_NAVEUR-NAVAF_Band_visits_Nigerian_National_Museum_and_University_of_Lagos.jpg/1280px-230201-N-DK722-1002_-_NAVEUR-NAVAF_Band_visits_Nigerian_National_Museum_and_University_of_Lagos.jpg', alt: 'US Navy band visiting the University of Lagos and Nigerian National Museum', caption: 'Notes posted 12 minutes ago — already 8 replies.' },
  { src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Adetokunbo_Sofoluwe_Park%2C_Unilag.jpg/960px-Adetokunbo_Sofoluwe_Park%2C_Unilag.jpg', alt: 'Lecturer presenting slides', caption: "A lecturer's slides, live before class even ends." },
  { src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9b/Faculty_of_Art%2C_University_of_Lago.jpg/960px-Faculty_of_Art%2C_University_of_Lago.jpg', alt: 'Students reviewing notes together', caption: 'One feed. Every class.' },
]
const heroIndex = ref(0)
let heroTimer
onMounted(() => {
  heroTimer = setInterval(() => {
    heroIndex.value = (heroIndex.value + 1) % heroImages.length
  }, 4000)
})
onUnmounted(() => clearInterval(heroTimer))

/* ---------- Feature marquee ---------- */
const features = [
  { title: 'Share study notes', desc: 'Post your notes and make them the class default.', icon: 'bi-file-earmark-text', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Confucius_Institute%2C_University_of_Lagos.jpg/960px-Confucius_Institute%2C_University_of_Lagos.jpg' },
  { title: 'Ask & answer', desc: 'Ask a question mid-lecture, get a reply before it ends.', icon: 'bi-chat-left-text', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1e/A_match_among_Volley_ball_players_in_Lagos%2C_Nigeria.jpg/960px-A_match_among_Volley_ball_players_in_Lagos%2C_Nigeria.jpg' },
  { title: 'Lecturer uploads', desc: 'Slides, readings and past papers, in one feed.', icon: 'bi-book', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a1/Department_of_Radiology%2C_University_of_Lagos.jpg/960px-Department_of_Radiology%2C_University_of_Lagos.jpg' },
  { title: 'Like & save', desc: 'Bookmark the answers that actually explain it.', icon: 'bi-heart', image: 'https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/Afe_Babalola_Auditorium%2C_Unilag.jpg/960px-Afe_Babalola_Auditorium%2C_Unilag.jpg' },
]
const loopedFeatures = [...features, ...features]

/* ---------- Campus moments carousel ---------- */
const moments = [
  { src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f4/230201-N-DK722-1002_-_NAVEUR-NAVAF_Band_visits_Nigerian_National_Museum_and_University_of_Lagos.jpg/1280px-230201-N-DK722-1002_-_NAVEUR-NAVAF_Band_visits_Nigerian_National_Museum_and_University_of_Lagos.jpg', alt: 'US Navy band visiting the University of Lagos and Nigerian National Museum', caption: 'A visiting delegation at the University of Lagos.' },
  { src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b3/230201-N-DK722-1004_-_NAVEUR-NAVAF_Band_visits_Nigerian_National_Museum_and_University_of_Lagos.jpg/1920px-230201-N-DK722-1004_-_NAVEUR-NAVAF_Band_visits_Nigerian_National_Museum_and_University_of_Lagos.jpg', alt: 'Lecturer answering questions after class', caption: 'Questions answered after class, not just in it.' },
  { src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/58/230201-N-DK722-1005_-_NAVEUR-NAVAF_Band_visits_Nigerian_National_Museum_and_University_of_Lagos.jpg/1920px-230201-N-DK722-1005_-_NAVEUR-NAVAF_Band_visits_Nigerian_National_Museum_and_University_of_Lagos.jpg', alt: 'Students sharing notes on a phone', caption: 'Notes shared five minutes after lecture ends.' },
  { src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/230201-N-DK722-1016_-_NAVEUR-NAVAF_Band_visits_Nigerian_National_Museum_and_University_of_Lagos.jpg/1920px-230201-N-DK722-1016_-_NAVEUR-NAVAF_Band_visits_Nigerian_National_Museum_and_University_of_Lagos.jpg', alt: 'Late night library study session', caption: 'Late-night library session, whole floor included.' },
  { src: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Akintunde_Ojo_memorial_hall%2C_Unilag.jpg/1920px-Akintunde_Ojo_memorial_hall%2C_Unilag.jpg', alt: 'First years comparing notes in a hallway', caption: 'First-years comparing notes between lectures.' },
]
const momentIndex = ref(0)
function nextMoment() {
  momentIndex.value = (momentIndex.value + 1) % moments.length
}
function prevMoment() {
  momentIndex.value = (momentIndex.value - 1 + moments.length) % moments.length
}

/* ---------- Footer calendar (unchanged logic, restyled) ---------- */
const currentMonth = ref(new Date().getMonth())
const currentYear = ref(new Date().getFullYear())
const selectedDate = ref(null)
const today = ref(new Date())

const dayHeaders = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

const monthName = computed(() => monthNames[currentMonth.value])

const calendarDays = computed(() => {
  const firstDay = new Date(currentYear.value, currentMonth.value, 1)
  const startDate = new Date(firstDay)
  const dayOfWeek = firstDay.getDay()
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1
  startDate.setDate(firstDay.getDate() - mondayOffset)

  const days = []
  for (let i = 0; i < 35; i++) {
    const date = new Date(startDate)
    date.setDate(startDate.getDate() + i)
    days.push({
      date: date.getDate(),
      fullDate: new Date(date),
      isCurrentMonth: date.getMonth() === currentMonth.value,
      isToday: isSameDay(date, today.value),
      isSelected: selectedDate.value && isSameDay(date, selectedDate.value),
    })
  }
  return days
})

const formatSelectedDate = computed(() => {
  if (!selectedDate.value) return ''
  return selectedDate.value.toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })
})

function previousMonth() {
  if (currentMonth.value === 0) {
    currentMonth.value = 11
    currentYear.value--
  } else {
    currentMonth.value--
  }
}
function nextMonth() {
  if (currentMonth.value === 11) {
    currentMonth.value = 0
    currentYear.value++
  } else {
    currentMonth.value++
  }
}
function selectDate(day) {
  if (day.isCurrentMonth) selectedDate.value = new Date(day.fullDate)
}
function isSameDay(d1, d2) {
  return d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear()
}
function getDayClasses(day) {
  return {
    'calendar__day--muted': !day.isCurrentMonth,
    'calendar__day--today': day.isToday,
    'calendar__day--selected': day.isSelected && !day.isToday,
  }
}
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&family=Inter:wght@400;500;600&display=swap');

:root {
  --ink: #0a0a0a;
  --ink-soft: #4a4a46;
  --paper: #ffffff;
  --paper-warm: #f6f5f2;
  --rule: #dedbd4;
  --highlight: #f5c842;
}
</style>

<style scoped>
.page {
  font-family: 'Inter', sans-serif;
  color: var(--ink);
  background: var(--paper);
}

h1, h2, h3 {
  font-family: 'Fraunces', serif;
  color: var(--ink);
  margin: 0;
}

/* ---------- Ticker ---------- */
.ticker {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  background: var(--ink);
  color: var(--paper);
  padding: 0.85rem 1.5rem;
  flex-wrap: wrap;
}
.ticker__tag {
  font-family: 'Fraunces', serif;
  font-weight: 600;
  font-size: 0.95rem;
  border-right: 1px solid rgba(255, 255, 255, 0.25);
  padding-right: 1.25rem;
  white-space: nowrap;
}
.ticker__msg {
  margin: 0;
  font-size: 0.9rem;
  color: rgba(255, 255, 255, 0.8);
}

/* ---------- Hero ---------- */
.hero {
  max-width: 1200px;
  margin: 0 auto;
  padding: 4rem 1.5rem 5rem;
}
.hero__inner {
  display: grid;
  grid-template-columns: 1.1fr 0.9fr;
  gap: 3.5rem;
  align-items: center;
}
.hero__kicker {
  color: var(--ink-soft);
  font-size: 0.95rem;
  margin-bottom: 1rem;
}
.hero__title {
  font-size: clamp(2.5rem, 5vw, 3.75rem);
  line-height: 1.1;
  font-weight: 500;
  margin-bottom: 1.5rem;
}
.highlight {
  background: linear-gradient(transparent 62%, var(--highlight) 62%);
  padding: 0 0.1em;
}
.hero__lede {
  font-size: 1.15rem;
  color: var(--ink-soft);
  max-width: 46ch;
  line-height: 1.6;
  margin-bottom: 2.25rem;
}
.hero__actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}
.btn {
  font-family: 'Inter', sans-serif;
  font-weight: 600;
  font-size: 1rem;
  padding: 0.9rem 1.75rem;
  border-radius: 4px;
  cursor: pointer;
  border: 1.5px solid var(--ink);
  transition: transform 0.15s ease, background 0.15s ease, color 0.15s ease;
}
.btn--solid {
  background: var(--ink);
  color: var(--paper);
}
.btn--solid:hover {
  transform: translateY(-2px);
}
.btn--outline {
  background: transparent;
  color: var(--ink);
}
.btn--outline:hover {
  background: var(--ink);
  color: var(--paper);
}

.hero__frame {
  position: relative;
}
.hero__photos {
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 5;
  border-radius: 4px;
  overflow: hidden;
  clip-path: polygon(0 0, calc(100% - 32px) 0, 100% 32px, 100% 100%, 0 100%);
}
.hero__img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  opacity: 0;
  transition: opacity 1s ease;
}
.hero__img.is-active {
  opacity: 1;
}
.hero__caption {
  margin-top: 0.9rem;
  font-size: 0.9rem;
  color: var(--ink-soft);
  border-left: 2px solid var(--highlight);
  padding-left: 0.75rem;
}

/* ---------- Section heads ---------- */
.section__head {
  text-align: center;
  max-width: 640px;
  margin: 0 auto 3rem;
  padding: 0 1.5rem;
}
.section__head h2 {
  font-size: clamp(2rem, 3.5vw, 2.75rem);
  font-weight: 500;
  margin-bottom: 0.6rem;
}
.section__head p {
  color: var(--ink-soft);
  font-size: 1.05rem;
}

/* ---------- How it works: marquee of note cards ---------- */
.how {
  background: var(--paper-warm);
  padding: 5rem 0;
}
.marquee {
  overflow: hidden;
  width: 100%;
}
.marquee__track {
  display: flex;
  width: max-content;
  animation: scroll 32s linear infinite;
}
.marquee__track:hover {
  animation-play-state: paused;
}
@keyframes scroll {
  0% { transform: translateX(0); }
  100% { transform: translateX(-50%); }
}
.note-card {
  position: relative;
  flex-shrink: 0;
  width: 320px;
  margin: 0 1rem;
  background: var(--paper);
  border: 1px solid var(--rule);
  clip-path: polygon(0 0, calc(100% - 22px) 0, 100% 22px, 100% 100%, 0 100%);
}
.note-card::after {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 22px;
  height: 22px;
  background: var(--paper-warm);
  border-bottom: 1px solid var(--rule);
  border-left: 1px solid var(--rule);
  clip-path: polygon(0 0, 100% 0, 100% 100%);
}
.note-card__photo {
  width: 100%;
  height: 160px;
  overflow: hidden;
}
.note-card__photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.note-card__body {
  padding: 1.5rem;
}
.note-card__body i {
  font-size: 1.4rem;
  color: var(--ink);
}
.note-card__body h3 {
  font-size: 1.2rem;
  font-weight: 500;
  margin: 0.6rem 0 0.4rem;
}
.note-card__body p {
  font-size: 0.92rem;
  color: var(--ink-soft);
  line-height: 1.5;
  margin: 0;
}

/* ---------- Campus moments carousel ---------- */
.moments {
  padding: 5rem 1.5rem;
  max-width: 1100px;
  margin: 0 auto;
}
.carousel {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 1.25rem;
}
.carousel__nav {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 1.5px solid var(--ink);
  background: var(--paper);
  color: var(--ink);
  font-size: 1.1rem;
  cursor: pointer;
  transition: background 0.15s ease, color 0.15s ease;
}
.carousel__nav:hover {
  background: var(--ink);
  color: var(--paper);
}
.carousel__viewport {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 8;
  overflow: hidden;
  border-radius: 4px;
}
.carousel__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.carousel__caption {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 1.25rem 1.5rem;
  background: linear-gradient(to top, rgba(10, 10, 10, 0.75), transparent);
  color: var(--paper);
  display: flex;
  align-items: baseline;
  gap: 1rem;
}
.carousel__index {
  font-family: 'Fraunces', serif;
  font-size: 0.9rem;
  opacity: 0.75;
  flex-shrink: 0;
}
.carousel__caption p {
  margin: 0;
  font-size: 1rem;
}
.carousel__dots {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-top: 1.5rem;
}
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  border: none;
  background: var(--rule);
  cursor: pointer;
  padding: 0;
}
.dot--active {
  background: var(--ink);
}

/* ---------- Users section ---------- */
.users {
  background: var(--paper-warm);
  padding: 5rem 1.5rem;
}
.user-card {
  max-width: 1100px;
  margin: 0 auto 2.5rem;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 3rem;
  align-items: center;
}
.user-card--reverse .user-card__media {
  order: 2;
}
.user-card__media img {
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  border-radius: 4px;
}
.user-card__copy h3 {
  font-size: 1.75rem;
  font-weight: 500;
  margin-bottom: 0.75rem;
}
.user-card__copy p {
  color: var(--ink-soft);
  line-height: 1.65;
  font-size: 1.02rem;
}

/* ---------- Contact ---------- */
.contact {
  text-align: center;
  padding: 5rem 1.5rem;
  max-width: 600px;
  margin: 0 auto;
}
.contact p {
  color: var(--ink-soft);
  margin: 0.6rem 0 2rem;
}
.whatsapp-btn {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  background: var(--ink);
  color: var(--paper);
  padding: 1rem 2rem;
  border-radius: 4px;
  text-decoration: none;
  font-weight: 600;
  transition: transform 0.15s ease;
}
.whatsapp-btn:hover {
  transform: translateY(-2px);
}
.whatsapp-btn i {
  font-size: 1.3rem;
}

/* ---------- Footer ---------- */
.footer {
  background: var(--ink);
  color: var(--paper);
}
.footer__grid {
  max-width: 1200px;
  margin: 0 auto;
  padding: 4rem 1.5rem;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr;
  gap: 3rem;
}
.footer h3 {
  color: var(--paper);
  font-size: 1.3rem;
  margin-bottom: 1.25rem;
}
.footer__text {
  color: rgba(255, 255, 255, 0.65);
  line-height: 1.6;
  font-size: 0.95rem;
}
.footer__contact {
  margin-top: 1rem;
  color: rgba(255, 255, 255, 0.65);
  font-size: 0.95rem;
}
.footer__credit {
  display: block;
  margin-top: 0.5rem;
  color: rgba(255, 255, 255, 0.4);
}
.footer__bottom {
  border-top: 1px solid rgba(255, 255, 255, 0.15);
  padding: 1.25rem 1.5rem;
  text-align: center;
  font-size: 0.85rem;
  color: rgba(255, 255, 255, 0.5);
}

/* ---------- Calendar ---------- */
.calendar {
  background: var(--paper);
  border-radius: 4px;
  overflow: hidden;
  color: var(--ink);
}
.calendar__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.9rem 1rem;
  background: var(--paper-warm);
  font-weight: 600;
  font-size: 0.95rem;
}
.calendar__header button {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--ink);
  font-size: 1rem;
}
.calendar__weekdays {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  border-bottom: 1px solid var(--rule);
}
.calendar__weekdays span {
  text-align: center;
  font-size: 0.7rem;
  color: var(--ink-soft);
  padding: 0.5rem 0;
}
.calendar__days {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}
.calendar__day {
  border: none;
  background: none;
  padding: 0.55rem 0;
  font-size: 0.85rem;
  cursor: pointer;
  color: var(--ink);
}
.calendar__day--muted {
  color: var(--rule);
}
.calendar__day--today {
  background: var(--ink);
  color: var(--paper);
  font-weight: 600;
}
.calendar__day--selected {
  background: var(--highlight);
  font-weight: 600;
}
.calendar__selected {
  margin-top: 0.75rem;
  background: rgba(255, 255, 255, 0.08);
  padding: 0.75rem;
  border-radius: 4px;
  text-align: center;
  font-size: 0.9rem;
}

/* ---------- AI Assistant ---------- */
.assistant {
  padding: 5rem 1.5rem;
  max-width: 760px;
  margin: 0 auto;
}
.assistant__card {
  background: var(--paper-warm);
  border: 1px solid var(--rule);
  border-radius: 8px;
  overflow: hidden;
}
.assistant__header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  background: var(--ink);
  color: var(--paper);
}
.assistant__header strong {
  font-family: 'Fraunces', serif;
  font-size: 1.05rem;
}
.assistant__header p {
  margin: 0;
  font-size: 0.8rem;
  color: rgba(255, 255, 255, 0.65);
}
.assistant__dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #4ade80;
  flex-shrink: 0;
}
.assistant__key-btn {
  margin-left: auto;
  background: transparent;
  border: 1px solid rgba(255, 255, 255, 0.3);
  color: var(--paper);
  border-radius: 4px;
  padding: 0.35rem 0.7rem;
  font-size: 0.8rem;
  cursor: pointer;
}
.assistant__keybox {
  padding: 0.9rem 1.25rem;
  border-bottom: 1px solid var(--rule);
}
.assistant__keybox input {
  width: 100%;
  padding: 0.65rem 0.8rem;
  border: 1.5px solid var(--ink);
  border-radius: 4px;
  font-size: 0.9rem;
}
.assistant__keybox small {
  display: block;
  margin-top: 0.4rem;
  color: var(--ink-soft);
}
.assistant__messages {
  height: 320px;
  overflow-y: auto;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.7rem;
}
.msg {
  max-width: 85%;
  padding: 0.7rem 0.95rem;
  border-radius: 12px;
  font-size: 0.93rem;
  line-height: 1.5;
}
.msg p {
  margin: 0;
}
.msg--bot {
  align-self: flex-start;
  background: var(--paper);
  border: 1px solid var(--rule);
  border-bottom-left-radius: 3px;
}
.msg--user {
  align-self: flex-end;
  background: var(--ink);
  color: var(--paper);
  border-bottom-right-radius: 3px;
}
.msg--typing {
  display: flex;
  gap: 5px;
  padding: 1rem;
}
.msg--typing span {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--ink-soft);
  animation: blink 1.2s infinite;
}
.msg--typing span:nth-child(2) { animation-delay: 0.2s; }
.msg--typing span:nth-child(3) { animation-delay: 0.4s; }
@keyframes blink {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}
.assistant__chips {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  padding: 0 1.25rem 0.75rem;
}
.assistant__chips button {
  background: var(--paper);
  border: 1px solid var(--rule);
  border-radius: 20px;
  padding: 0.4rem 0.85rem;
  font-size: 0.82rem;
  cursor: pointer;
  transition: border-color 0.15s ease;
}
.assistant__chips button:hover {
  border-color: var(--ink);
}
.assistant__form {
  display: flex;
  gap: 0.6rem;
  padding: 0 1.25rem 1.25rem;
}
.assistant__form input {
  flex: 1;
  padding: 0.8rem 1rem;
  border: 1.5px solid var(--ink);
  border-radius: 4px;
  font-size: 0.95rem;
  font-family: 'Inter', sans-serif;
}
.assistant__form button {
  width: 48px;
  border-radius: 4px;
  border: none;
  background: var(--ink);
  color: var(--paper);
  font-size: 1.1rem;
  cursor: pointer;
}
.assistant__form button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* ---------- Responsive ---------- */
@media (max-width: 900px) {
  .hero__inner,
  .user-card,
  .user-card--reverse {
    grid-template-columns: 1fr;
  }
  .user-card--reverse .user-card__media {
    order: 0;
  }
  .footer__grid {
    grid-template-columns: 1fr;
  }
  .carousel {
    grid-template-columns: 1fr;
  }
  .carousel__nav {
    display: none;
  }
}
</style>