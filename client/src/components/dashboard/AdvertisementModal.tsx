import { useEffect, useState, type FormEvent } from 'react'
import { useCreateAdvertisement } from '../../hooks/useHome'
import { ApiError } from '../../lib/apiClient'
import type { AdvertisementKind } from '../../types'
import Modal from '../ui/Modal'

interface AdvertisementModalProps {
  open: boolean
  kind: AdvertisementKind
  onClose: () => void
}

interface AdvertisementForm {
  title: string
  subtitle: string
  description: string
  location: string
  ctaUrl: string
}

const EMPTY_FORM: AdvertisementForm = {
  title: '',
  subtitle: '',
  description: '',
  location: '',
  ctaUrl: '',
}

const COPY: Record<
  AdvertisementKind,
  {
    heading: string
    intro: string
    titleLabel: string
    titlePlaceholder: string
    subtitleLabel: string
    subtitlePlaceholder: string
    descriptionLabel: string
    descriptionPlaceholder: string
    locationLabel: string
    locationPlaceholder: string
    ctaLabel: string
    submit: string
  }
> = {
  school: {
    heading: 'Advertise a school',
    intro:
      'Tell students and parents what your school or college offers. The advert appears on Schools & colleges as soon as you post it.',
    titleLabel: 'School or college name',
    titlePlaceholder: 'Bright Future Academy',
    subtitleLabel: 'Headline',
    subtitlePlaceholder: 'Admissions open for the 2026/2027 session',
    descriptionLabel: 'About the school',
    descriptionPlaceholder:
      'Programmes, scholarships, facilities and anything else families should know.',
    locationLabel: 'Location',
    locationPlaceholder: 'Lekki, Lagos',
    ctaLabel: 'Website or WhatsApp link',
    submit: 'Post school advert',
  },
  teaching: {
    heading: 'Post a teaching job',
    intro:
      'Share a teaching or lecturer vacancy with the Talma community. The opportunity appears on Classes & revision as soon as you post it.',
    titleLabel: 'Job title or opportunity',
    titlePlaceholder: 'Physics Teacher (Senior Secondary)',
    subtitleLabel: 'School, college or employer',
    subtitlePlaceholder: 'Crown Heights College',
    descriptionLabel: 'Role details',
    descriptionPlaceholder:
      'Subjects, requirements, work type and how interested teachers should apply.',
    locationLabel: 'Location',
    locationPlaceholder: 'Abuja, FCT · Full-time',
    ctaLabel: 'Application link or contact',
    submit: 'Post job opportunity',
  },
}

/**
 * School and teaching-advert form. Every signed-in account can use it — the
 * server does not require an educator role for community adverts.
 */
export default function AdvertisementModal({
  open,
  kind,
  onClose,
}: AdvertisementModalProps) {
  const copy = COPY[kind]
  const createAdvertisement = useCreateAdvertisement()
  const [form, setForm] = useState<AdvertisementForm>(EMPTY_FORM)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setForm(EMPTY_FORM)
    setError(null)
  }, [open, kind])

  const update = (field: keyof AdvertisementForm, value: string) => {
    setForm((current) => ({ ...current, [field]: value }))
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setError(null)
    try {
      await createAdvertisement.mutateAsync({ kind, ...form })
      onClose()
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'We could not post your advert. Please try again.',
      )
    }
  }

  const labelClass = 'block text-sm font-medium text-[#4d554d] mb-1.5'
  const fieldClass =
    'w-full rounded-xl border border-[#e6e9e6] px-4 py-2.5 text-[#0a0a0a] placeholder-[#9ca59c] focus:outline-none focus:ring-2 focus:ring-[#f5c842]'
  const pending = createAdvertisement.isPending

  return (
    <Modal
      open={open}
      onClose={() => {
        if (!pending) onClose()
      }}
      closeOnBackdrop={!pending}
      className="w-full max-w-xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
      labelledBy="advertisement-title"
    >
      <form onSubmit={submit} className="space-y-4">
        <div>
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-[#fdf5d7] text-[#8a6d00]">
            <i className={`bi ${kind === 'school' ? 'bi-building' : 'bi-briefcase'} text-xl`} />
          </div>
          <h3
            id="advertisement-title"
            className="font-heading text-2xl font-semibold text-[#0a0a0a]"
          >
            {copy.heading}
          </h3>
          <p className="mt-1 text-sm text-[#4d554d]">{copy.intro}</p>
        </div>

        <div>
          <label htmlFor="advert-title" className={labelClass}>
            {copy.titleLabel}
          </label>
          <input
            id="advert-title"
            required
            minLength={2}
            maxLength={120}
            value={form.title}
            onChange={(event) => update('title', event.target.value)}
            placeholder={copy.titlePlaceholder}
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="advert-subtitle" className={labelClass}>
            {copy.subtitleLabel}
          </label>
          <input
            id="advert-subtitle"
            required
            minLength={2}
            maxLength={160}
            value={form.subtitle}
            onChange={(event) => update('subtitle', event.target.value)}
            placeholder={copy.subtitlePlaceholder}
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="advert-description" className={labelClass}>
            {copy.descriptionLabel}
          </label>
          <textarea
            id="advert-description"
            required
            minLength={10}
            maxLength={2000}
            rows={4}
            value={form.description}
            onChange={(event) => update('description', event.target.value)}
            placeholder={copy.descriptionPlaceholder}
            className={`${fieldClass} resize-none`}
          />
        </div>

        <div>
          <label htmlFor="advert-location" className={labelClass}>
            {copy.locationLabel}
          </label>
          <input
            id="advert-location"
            required
            minLength={2}
            maxLength={120}
            value={form.location}
            onChange={(event) => update('location', event.target.value)}
            placeholder={copy.locationPlaceholder}
            className={fieldClass}
          />
        </div>

        <div>
          <label htmlFor="advert-cta" className={labelClass}>
            {copy.ctaLabel}
          </label>
          <input
            id="advert-cta"
            type="url"
            required
            maxLength={500}
            pattern="https?://.+"
            title="The link must start with http:// or https://"
            value={form.ctaUrl}
            onChange={(event) => update('ctaUrl', event.target.value)}
            placeholder="https://…"
            className={fieldClass}
          />
          <p className="mt-1 text-xs text-[#7b857b]">
            Use an application page, your website or a WhatsApp group link.
          </p>
        </div>

        {error && (
          <div className="rounded-xl border border-[#fecaca] bg-[#fef2f2] px-4 py-3 text-sm text-[#991b1b]">
            {error}
          </div>
        )}

        <div className="flex gap-3 pt-1">
          <button
            type="button"
            onClick={onClose}
            disabled={pending}
            className="flex-1 rounded-xl border border-[#e6e9e6] px-4 py-2.5 font-semibold text-[#4d554d] disabled:opacity-60"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={pending}
            className="flex-1 rounded-xl bg-[#f5c842] px-4 py-2.5 font-semibold text-[#0a0a0a] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {pending ? 'Posting…' : copy.submit}
          </button>
        </div>
      </form>
    </Modal>
  )
}
