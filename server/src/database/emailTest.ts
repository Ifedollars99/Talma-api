/**
 * Sends a sample creator verification email so you can check the provider and
 * template without going through the whole app flow.
 *
 *   npm run email:test --workspace server -- you@example.com
 */
import { getEmailStatus, sendCreatorVerificationEmail } from '../common/email/mailer.js'

const recipient = process.argv[2]?.trim()

if (!recipient || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recipient)) {
  console.error('Usage: npm run email:test --workspace server -- you@example.com')
  process.exit(1)
}

const status = getEmailStatus()
console.log('Talma email test')
console.log(`  Provider: ${status.provider}`)
console.log(`  From:     ${status.from}`)
console.log(`  To:       ${recipient}`)

if (!status.configured) {
  console.warn(
    '\nNo email provider is configured. Set EMAIL_PROVIDER=ethereal for a local preview, or add RESEND_API_KEY / SMTP_HOST to server/.env.',
  )
  process.exit(1)
}

console.log('\nSending…')
const result = await sendCreatorVerificationEmail(recipient, 'Talma Creator', '123456')

if (result.delivered && result.provider === 'ethereal') {
  console.log('\nEthereal captured this message for preview only.')
  console.log('It was NOT delivered to the recipient’s real inbox.')
  if (result.previewUrl) {
    console.log(`\nPreview it here:\n  ${result.previewUrl}`)
  }
  console.log('\nTo deliver real email, run:')
  console.log('  npm run email:setup')
} else if (result.delivered) {
  console.log(`Email accepted by ${result.provider}. Check the inbox (and spam folder).`)
} else {
  console.error(
    `The provider did not accept the email.${result.error ? `\nReason: ${result.error}` : ' Check the server logs above.'}`,
  )
  if (result.provider === 'console') {
    console.error('No real provider is configured. Run: npm run email:setup')
  }
  process.exitCode = 1
}
