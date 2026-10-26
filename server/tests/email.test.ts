import { describe, expect, it } from 'vitest'
import {
  creatorVerificationEmail,
  creatorWelcomeEmail,
  passwordResetEmail,
} from '../src/common/email/templates.js'

describe('Transactional email templates', () => {
  it('renders a branded creator verification email', () => {
    const email = creatorVerificationEmail({
      username: 'AdaCreates',
      code: '123456',
      expiresMinutes: 10,
    })

    expect(email.subject).toBe('Verify your Talma creator account')
    expect(email.html).toContain('123456')
    expect(email.html).toContain('Talma')
    expect(email.html).toContain('This code expires in 10 minutes')
    expect(email.text).toContain('123456')
    expect(email.text).toContain('expires in 10 minutes')
    expect(email.html).not.toContain('http://localhost:4000')
  })

  it('escapes user-controlled content in the HTML', () => {
    const email = creatorVerificationEmail({
      username: '<script>alert(1)</script>',
      code: '654321',
    })

    expect(email.html).not.toContain('<script>alert(1)</script>')
    expect(email.html).toContain('&lt;script&gt;')
  })

  it('renders the creator welcome email with a profile link', () => {
    const email = creatorWelcomeEmail({
      username: 'AdaCreates',
      profileUrl: 'https://talma.app/u/AdaCreates',
    })

    expect(email.subject).toBe('Welcome to Talma Creators')
    expect(email.html).toContain('AdaCreates')
    expect(email.html).toContain('https://talma.app/u/AdaCreates')
    expect(email.text).toContain('Open Talma')
  })

  it('renders a password reset email with the reset link', () => {
    const email = passwordResetEmail({
      username: 'AdaCreates',
      resetUrl: 'https://talma.app/reset-password?token=abc123',
      expiresMinutes: 60,
    })

    expect(email.subject).toBe('Reset your Talma password')
    expect(email.html).toContain('https://talma.app/reset-password?token=abc123')
    expect(email.html).toContain('expires in 60 minutes')
    expect(email.text).toContain('https://talma.app/reset-password?token=abc123')
  })
})
