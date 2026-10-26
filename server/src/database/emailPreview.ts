/**
 * Renders the transactional email templates to local HTML files so you can
 * review the design in a browser without sending anything.
 *
 *   npm run email:preview --workspace server
 */
import fs from 'node:fs/promises'
import path from 'node:path'
import {
  creatorVerificationEmail,
  creatorWelcomeEmail,
  passwordResetEmail,
} from '../common/email/templates.js'

const outputDir = path.resolve(process.cwd(), 'email-previews')

const previews = [
  {
    file: 'creator-verification.html',
    email: creatorVerificationEmail({
      username: 'AdaCreates',
      code: '482916',
      expiresMinutes: 10,
    }),
  },
  {
    file: 'creator-welcome.html',
    email: creatorWelcomeEmail({
      username: 'AdaCreates',
      profileUrl: 'http://localhost:5173/u/AdaCreates',
    }),
  },
  {
    file: 'password-reset.html',
    email: passwordResetEmail({
      username: 'AdaCreates',
      resetUrl: 'http://localhost:5173/reset-password?token=demo-token',
      expiresMinutes: 60,
    }),
  },
]

await fs.mkdir(outputDir, { recursive: true })
await Promise.all(
  previews.map((preview) =>
    fs.writeFile(path.join(outputDir, preview.file), preview.email.html, 'utf8'),
  ),
)

console.log('Rendered email previews:')
for (const preview of previews) {
  console.log(`  ${path.join(outputDir, preview.file)}`)
}
console.log('\nOpen either file in a browser to review the design.')
