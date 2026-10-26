import crypto from 'node:crypto'
import { env } from '../../config/env.js'
import { AppError } from '../../common/errors/AppError.js'

/**
 * Thin Paystack client.
 *
 * The secret key stays on the server: the browser is only ever given the
 * `authorization_url` Paystack generates for a specific transaction.
 */
const PAYSTACK_BASE_URL = 'https://api.paystack.co'

interface PaystackEnvelope<T> {
  status: boolean
  message: string
  data?: T
}

export interface InitializeTransactionInput {
  email: string
  /** Amount in the smallest currency unit — kobo for NGN. */
  amountKobo: number
  reference: string
  currency?: string
  callbackUrl?: string
  metadata?: Record<string, unknown>
  /** Paystack subaccount that receives the creator's share. */
  subaccount?: string
  /** Who bears Paystack's processing fee. Defaults to the main account. */
  bearer?: 'account' | 'subaccount'
}

export interface InitializedTransaction {
  authorizationUrl: string
  accessCode: string
  reference: string
}

export interface VerifiedTransaction {
  id: number
  status: string
  reference: string
  /** Amount in kobo (or the currency's smallest unit). */
  amount: number
  currency: string
  paidAt?: Date
  channel?: string
}

export interface PaystackBank {
  name: string
  code: string
  slug?: string
  country?: string
  currency?: string
  type?: string
}

export interface ResolvedBankAccount {
  accountNumber: string
  accountName: string
}

export interface CreatedSubaccount {
  subaccountCode: string
  accountName: string
  /** The settlement bank code Paystack echoes back. */
  settlementBank: string
  accountNumber: string
  percentageCharge: number
}

async function callPaystack<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const secretKey = env.PAYSTACK_SECRET_KEY.trim()
  if (!secretKey) {
    throw AppError.serviceUnavailable(
      'Paystack is not configured on this server yet. Add PAYSTACK_SECRET_KEY to the API environment.',
    )
  }

  let response: Response
  try {
    response = await fetch(`${PAYSTACK_BASE_URL}${path}`, {
      ...init,
      signal: AbortSignal.timeout(15_000),
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
        ...(init.headers ?? {}),
      },
    })
  } catch {
    throw AppError.badGateway('Could not reach Paystack. Please try again in a moment.')
  }

  let payload: PaystackEnvelope<T>
  try {
    payload = (await response.json()) as PaystackEnvelope<T>
  } catch {
    throw AppError.badGateway('Paystack returned an unexpected response.')
  }

  if (!response.ok || !payload.status || payload.data === undefined) {
    throw AppError.badGateway(payload.message || 'Paystack rejected the request.')
  }

  return payload.data
}

/** Starts a hosted Paystack checkout and returns the URL to redirect to. */
export async function initializeTransaction(
  input: InitializeTransactionInput,
): Promise<InitializedTransaction> {
  const data = await callPaystack<{
    authorization_url: string
    access_code: string
    reference: string
  }>('/transaction/initialize', {
    method: 'POST',
    body: JSON.stringify({
      email: input.email,
      amount: input.amountKobo,
      reference: input.reference,
      currency: input.currency ?? env.PAYSTACK_CURRENCY,
      ...(input.callbackUrl ? { callback_url: input.callbackUrl } : {}),
      ...(input.metadata ? { metadata: input.metadata } : {}),
      ...(input.subaccount ? { subaccount: input.subaccount } : {}),
      ...(input.bearer ? { bearer: input.bearer } : {}),
    }),
  })

  return {
    authorizationUrl: data.authorization_url,
    accessCode: data.access_code,
    reference: data.reference,
  }
}

/** Confirms a transaction with Paystack — never trust the browser callback alone. */
export async function verifyTransaction(reference: string): Promise<VerifiedTransaction> {
  const data = await callPaystack<{
    id: number
    status: string
    reference: string
    amount: number
    currency: string
    paid_at?: string | null
    channel?: string
  }>(`/transaction/verify/${encodeURIComponent(reference)}`)

  return {
    id: data.id,
    status: data.status,
    reference: data.reference,
    amount: data.amount,
    currency: data.currency,
    ...(data.paid_at ? { paidAt: new Date(data.paid_at) } : {}),
    ...(data.channel ? { channel: data.channel } : {}),
  }
}

/** Lists settlement banks so a creator can pick one by name/code. */
export async function listBanks(currency = 'NGN'): Promise<PaystackBank[]> {
  const data = await callPaystack<PaystackBank[]>(
    `/bank?currency=${encodeURIComponent(currency)}`,
  )
  return data
    .filter((bank) => bank.code && bank.name)
    .map((bank) => ({
      name: bank.name,
      code: bank.code,
      ...(bank.slug ? { slug: bank.slug } : {}),
      ...(bank.country ? { country: bank.country } : {}),
      ...(bank.currency ? { currency: bank.currency } : {}),
      ...(bank.type ? { type: bank.type } : {}),
    }))
}

/** Confirms that a bank account number belongs to the supplied bank code. */
export async function resolveBankAccount(
  accountNumber: string,
  bankCode: string,
): Promise<ResolvedBankAccount> {
  const data = await callPaystack<{ account_number: string; account_name: string }>(
    `/bank/resolve?account_number=${encodeURIComponent(accountNumber)}&bank_code=${encodeURIComponent(bankCode)}`,
  )
  return {
    accountNumber: data.account_number,
    accountName: data.account_name,
  }
}

/**
 * Creates a Paystack subaccount for a creator.
 *
 * `percentageCharge` is the platform's cut — Paystack pays the remainder to
 * the creator's bank account on its normal settlement schedule.
 */
export async function createSubaccount(input: {
  businessName: string
  bankCode: string
  accountNumber: string
  percentageCharge: number
  email?: string
}): Promise<CreatedSubaccount> {
  const data = await callPaystack<{
    subaccount_code: string
    account_name: string
    settlement_bank: string
    account_number: string
    percentage_charge: number
  }>('/subaccount', {
    method: 'POST',
    body: JSON.stringify({
      business_name: input.businessName,
      settlement_bank: input.bankCode,
      account_number: input.accountNumber,
      percentage_charge: input.percentageCharge,
      ...(input.email ? { primary_contact_email: input.email } : {}),
    }),
  })

  return {
    subaccountCode: data.subaccount_code,
    accountName: data.account_name,
    settlementBank: data.settlement_bank,
    accountNumber: data.account_number,
    percentageCharge: data.percentage_charge,
  }
}

/** Updates the platform/creator split on an existing subaccount. */
export async function updateSubaccount(
  subaccountCode: string,
  input: { businessName: string; percentageCharge: number },
): Promise<void> {
  await callPaystack<unknown>(`/subaccount/${encodeURIComponent(subaccountCode)}`, {
    method: 'PUT',
    body: JSON.stringify({
      business_name: input.businessName,
      percentage_charge: input.percentageCharge,
    }),
  })
}

/**
 * Validates the `x-paystack-signature` header. Paystack signs the exact raw
 * request body with HMAC-SHA512 using the secret key.
 */
export function isValidPaystackSignature(rawBody: Buffer, signature: string): boolean {
  const secretKey = env.PAYSTACK_SECRET_KEY.trim()
  if (!secretKey || !signature) return false

  const expected = crypto.createHmac('sha512', secretKey).update(rawBody).digest('hex')
  const expectedBuffer = Buffer.from(expected, 'utf8')
  const providedBuffer = Buffer.from(signature, 'utf8')

  if (expectedBuffer.length !== providedBuffer.length) return false
  return crypto.timingSafeEqual(expectedBuffer, providedBuffer)
}
