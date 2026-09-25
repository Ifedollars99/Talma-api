// Generates one study-outline PDF per catalog course into public/course-pdfs/.
// Usage: node scripts/generate-course-pdfs.mjs
// Parses src/data/universities.js (f() / deptN() / deptY() / c() calls) — no imports needed.
import { readFileSync, mkdirSync, writeFileSync, existsSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const dataPath = join(root, 'src', 'data', 'universities.js')
const outDir = join(root, 'public', 'course-pdfs')

const slug = (s) =>
    s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

const lines = readFileSync(dataPath, 'utf8').split('\n')
let faculty = ''
let dept = ''
const courses = []

for (const line of lines) {
    const fm = line.match(/f\('[^']+',\s*'([^']+)'/)
    if (fm && line.includes('deptN') === false && line.includes('deptY') === false && line.trimStart().startsWith('f(')) {
        faculty = fm[1]
    }
    const dm = line.trimStart().match(/^dept[NY]\(['"][^'"]+['"],\s*'([^']+)'/)
    if (dm) {
        dept = dm[1]
    }
    const re = /c\('([^']+)',\s*'([^']*)',\s*'([^']+)'\)/g
    let cm
    while ((cm = re.exec(line)) !== null) {
        courses.push({ id: cm[1], code: cm[2], title: cm[3], faculty, dept, fileName: `${slug(cm[2] + '-' + cm[3])}.pdf` })
    }
}

console.log(`Found ${courses.length} courses.`)

const navy = rgb(0.11, 0.17, 0.22)
const gold = rgb(0.78, 0.53, 0.18)
const grey = rgb(0.36, 0.4, 0.45)

let made = 0
for (const course of courses) {
    const doc = await PDFDocument.create()
    const page = doc.addPage([595, 842])
    const helv = await doc.embedFont(StandardFonts.Helvetica)
    const helvBold = await doc.embedFont(StandardFonts.HelveticaBold)
    let y = 790

    const text = (str, opts = {}) => {
        const { size = 12, font = helv, color = navy, gap = 18, maxWidth = 495 } = opts
        const words = str.split(' ')
        let line = ''
        for (const w of words) {
            const test = line ? line + ' ' + w : w
            if (font.widthOfTextAtSize(test, size) > maxWidth && line) {
                page.drawText(line, { x: 50, y, size, font, color })
                y -= gap
                line = w
            } else {
                line = test
            }
        }
        if (line) {
            page.drawText(line, { x: 50, y, size, font, color })
            y -= gap
        }
    }

    page.drawText('STUDY SOCIAL · COURSE OUTLINE', { x: 50, y, size: 11, font: helvBold, color: gold })
    y -= 30
    text(course.code ? `${course.code} — ${course.title}` : course.title, { size: 22, font: helvBold, gap: 30 })
    text(`${course.dept} · ${course.faculty}`, { size: 12, color: grey, gap: 26 })
    page.drawLine({ start: { x: 50, y }, end: { x: 545, y }, thickness: 1.5, color: gold })
    y -= 24

    text('About this outline', { size: 14, font: helvBold, gap: 20 })
    text(`This is a starter study outline for ${course.code || course.title}. Confirm the official syllabus, reading list and assessment weights with your department before exams.`, { size: 11, color: grey, gap: 16 })

    text('Learning objectives', { size: 14, font: helvBold, gap: 20 })
    text(`By the end of ${course.title}, you should be able to explain its core concepts, apply its standard methods to typical problems, and answer past questions under timed conditions.`, { size: 11, color: grey, gap: 16 })

    text('Study plan (6 weeks)', { size: 14, font: helvBold, gap: 20 })
    const weeks = [
        `Week 1 — Foundations: definitions, scope and key terms in ${course.title}.`,
        'Week 2 — Core concepts I: detailed notes plus one worked example per topic.',
        'Week 3 — Core concepts II: diagrams, derivations and short summaries.',
        'Week 4 — Application: past questions and problem sets, timed.',
        'Week 5 — Revision: condense everything to a 4-page cheat sheet.',
        'Week 6 — Mock exam: full past paper under exam conditions, then review.'
    ]
    weeks.forEach((w) => text(w, { size: 11, color: grey, gap: 16 }))

    y -= 8
    text('Exam tips', { size: 14, font: helvBold, gap: 20 })
    text('Attempt familiar questions first, define terms before discussing, and always conclude structured answers. Keep copies of every assignment and attendance record.', { size: 11, color: grey, gap: 16 })

    const bytes = await doc.save()
    if (!existsSync(outDir)) mkdirSync(outDir, { recursive: true })
    writeFileSync(join(outDir, course.fileName), bytes)
    made++
}

console.log(`Wrote ${made} PDFs to public/course-pdfs/.`)
