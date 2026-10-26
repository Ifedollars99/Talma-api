import { useTheme, type Theme } from '../../lib/theme'

const OPTIONS: {
  id: Theme
  label: string
  description: string
  icon: string
  preview: { shell: string; card: string; line: string; accent: string }
}[] = [
  {
    id: 'light',
    label: 'Light',
    description: 'Clean, bright and easy to read.',
    icon: 'bi-sun',
    preview: { shell: '#eef1ee', card: '#ffffff', line: '#dfe5df', accent: '#f5c842' },
  },
  {
    id: 'dark',
    label: 'Dark',
    description: 'Low-glare for late-night study.',
    icon: 'bi-moon-stars',
    preview: { shell: '#0b0f0c', card: '#161b17', line: '#303a31', accent: '#f5c842' },
  },
]

/** Light/dark picker. Kept in Settings so the rest of the app stays distraction-free. */
export default function ThemeSelector() {
  const { theme, setTheme } = useTheme()

  return (
    <div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {OPTIONS.map((option) => {
          const selected = theme === option.id
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => setTheme(option.id)}
              aria-pressed={selected}
              className={`rounded-2xl border p-3 text-left transition-all ${
                selected
                  ? 'border-[#f5c842] bg-[#fdf5d7] shadow-sm'
                  : 'border-[#e6e9e6] hover:border-[#f5c842]/60 hover:bg-[#f7f9f7]'
              }`}
            >
              <div
                className="relative h-20 overflow-hidden rounded-xl border"
                style={{ backgroundColor: option.preview.shell, borderColor: option.preview.line }}
              >
                <div
                  className="absolute left-3 right-3 top-3 rounded-lg border p-3"
                  style={{
                    backgroundColor: option.preview.card,
                    borderColor: option.preview.line,
                  }}
                >
                  <div className="h-2 w-16 rounded-full" style={{ backgroundColor: option.preview.accent }} />
                  <div className="mt-2 h-1.5 w-full rounded-full" style={{ backgroundColor: option.preview.line }} />
                  <div className="mt-1.5 h-1.5 w-3/4 rounded-full" style={{ backgroundColor: option.preview.line }} />
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <i className={`bi ${option.icon} text-[#8a6d00]`} />
                <span className="text-sm font-semibold text-[#0a0a0a]">{option.label}</span>
                {selected && (
                  <span className="ml-auto inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#0a0a0a] text-[10px] text-white">
                    <i className="bi bi-check2" />
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs text-[#7b857b]">{option.description}</p>
            </button>
          )
        })}
      </div>
      <p className="mt-3 text-xs text-[#7b857b]">
        The theme is saved on this device. Landing, sign-in and sign-up pages always stay light.
      </p>
    </div>
  )
}
