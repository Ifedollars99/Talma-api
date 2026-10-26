/**
 * Interactive Resend setup.
 *
 *   npm run email:setup
 *
 * Writes the API key and sender into `server/.env`, then optionally sends a
 * test email so the provider can be verified immediately.
 *
 * Paste the key when prompted. The script never prints the key itself.
 */
import { copyFileSync, existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { createInterface } from 'node:readline/promises'
import process from 'node:process'

const envPath = path.resolve(process.cwd(), '.env')
const examplePath = path.resolve(process.cwd(), '.env.example')

if (!existsSync(envPath)) {
  if (existsSync(examplePath)) {
    copyFileSync(examplePath, envPath)
    console.log('Created server/.env from server/.env.example.')
  } else {
    console.error('Could not find server/.env or server/.env.example.')
    process.exit(1)
  }
}

const terminal = Boolean(process.stdin.isTTY && process.stdout.isTTY)
const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal,
})

rl.on('SIGINT', () => {
  process.stdout.write('\nCancelled.\n')
  rl.close()
  process.exit(130)
})

function closePrompts(): void {
  rl.close()
}

async function ask(question: string, fallback = ''): Promise<string> {
  const answer = (await rl.question(question)).trim()
  return answer || fallback
}

function getEnvValue(lines: string[], key: string): string {
  const line = lines.find((entry) => new RegExp(`^\\s*${key}\\s*=`).test(entry))
  if (!line) return ''
  return line.replace(new RegExp(`^\\s*${key}\\s*=\\s*`), '').trim()
}

function setEnvValue(lines: string[], key: string, value: string): void {
  const index = lines.findIndex((entry) => new RegExp(`^\\s*${key}\\s*=`).test(entry))
  const serialized = `${key}=${value}`
  if (index >= 0) {
    lines[index] = serialized
  } else {
    lines.push(serialized)
  }
}

function quoteMailFrom(value: string): string {
  const trimmed = value.trim()
  if (!trimmed) return '"Talma <onboarding@resend.dev>"'
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) return trimmed
  return `"${trimmed.replace(/"/g, '')}"`
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

async function main(): Promise<void> {
  const original = readFileSync(envPath, 'utf8')
  const newline = original.includes('\r\n') ? '\r\n' : '\n'
  const lines = original.split(/\r?\n/)
  while (lines.length > 0 && lines[lines.length - 1] === '') lines.pop()

  console.log('\nTalma email setup')
  console.log('This writes Resend credentials to server/.env and can send a test email.')
  console.log('The key will be visible while you paste it, so use a private terminal.\n')

  const existingKey = getEnvValue(lines, 'RESEND_API_KEY')
  const existingFrom = getEnvValue(lines, 'MAIL_FROM') || 'Talma <onboarding@resend.dev>'

  let key = existingKey
  if (existingKey) {
    const replacement = await ask(
      'Paste a new Resend API key (leave blank to keep the existing key): ',
    )
    if (replacement) key = replacement
  } else {
    key = await ask('Paste your Resend API key (starts with re_): ')
  }

  while (!/^re_[A-Za-z0-9_-]{10,}$/.test(key)) {
    console.log('That does not look like a Resend API key. It should start with re_ and be copied in full.')
    key = await ask('Paste your Resend API key: ')
  }

  const from = await ask(
    `Sender address [${existingFrom}]: `,
    existingFrom,
  )

  setEnvValue(lines, 'EMAIL_PROVIDER', 'resend')
  setEnvValue(lines, 'RESEND_API_KEY', key)
  setEnvValue(lines, 'MAIL_FROM', quoteMailFrom(from))

  copyFileSync(envPath, `${envPath}.bak`)
  writeFileSync(envPath, `${lines.join(newline)}${newline}`, 'utf8')

  console.log('\nSaved Resend settings to server/.env.')
  console.log('The previous file was backed up as server/.env.bak.')

  const recipient = await ask(
    '\nSend a test email to (leave blank to skip): ',
  )

  if (!recipient) {
    console.log('\nSkipped the test email.')
    console.log('Run this later from the project root:')
    console.log('  npm run email:test --workspace server -- you@example.com')
    closePrompts()
    return
  }

  if (!isValidEmail(recipient)) {
    console.error('\nThat is not a valid email address. Nothing was sent.')
    closePrompts()
    process.exitCode = 1
    return
  }

  // Load the mail modules only after .env has been written so their startup
  // configuration sees the new Resend key.
  const { getEmailStatus, sendCreatorVerificationEmail } = await import(
    '../common/email/mailer.js'
  )
  const status = getEmailStatus()

  console.log(`\nProvider: ${status.provider}`)
  console.log(`From:     ${status.from}`)
  console.log(`To:       ${recipient}`)
  console.log('\nSending…')

  const result = await sendCreatorVerificationEmail(recipient, 'Talma Creator', '123456')

  if (result.delivered) {
    console.log(`\n${result.provider} accepted the email. Check the inbox and spam folder.`)
    if (result.previewUrl) console.log(`Preview: ${result.previewUrl}`)
  } else {
    const reason = result.error ?? ''
    console.error(`\nThe email was not delivered.${reason ? `\nReason: ${reason}` : ''}`)

    if (/api key is invalid|invalid api key/i.test(reason)) {
      console.error(
        '\nResend rejected the API key. Create a fresh key at https://resend.com/api-keys, then run npm run email:setup again.',
      )
    } else if (/verify a domain|domain is not verified|testing emails/i.test(reason)) {
      console.error(
        '\nThis sender/recipient pair is not allowed yet. Verify a domain at https://resend.com/domains, then use an address on that domain as MAIL_FROM. Until then, onboarding@resend.dev can only send to the email on your Resend account.',
      )
    } else {
      console.error('\nCheck the reason above, then rerun npm run email:setup.')
    }

    process.exitCode = 1
  }

  closePrompts()
}

await main()
