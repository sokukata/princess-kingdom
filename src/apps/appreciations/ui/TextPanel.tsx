import { useState, type CSSProperties } from 'react'
import { nextReroll } from '../core/generate.ts'
import type { Tone } from '../core/model.ts'
import { statusLabels, type Appreciation } from './appreciation.ts'
import { copyText } from './browser.ts'

// From the most positive to the most severe: the order of the slider.
const TONES: { tone: Tone; icon: string; label: string; hint: string }[] = [
  { tone: 'praising', icon: '🌟', label: 'Élogieux', hint: 'uniquement les points forts' },
  {
    tone: 'demanding',
    icon: '🎯',
    label: 'Exigeant',
    hint: 'surtout des points forts, et au moins un point à améliorer',
  },
  { tone: 'balanced', icon: '⚖️', label: 'Équilibré', hint: 'le bilan, nuancé par un point dans l’autre sens' },
  {
    tone: 'encouraging',
    icon: '🌱',
    label: 'Encourageant',
    hint: 'surtout des points à améliorer, et au moins un point fort',
  },
  { tone: 'severe', icon: '⚠️', label: 'Sévère', hint: 'uniquement les points à améliorer' },
]

interface Props {
  appreciation: Appreciation
  onReroll: (reroll: number) => void
  onEdit: (text: string) => void
  onRegenerate: () => void
  onTone: (tone: Tone) => void
}

export function TextPanel({ appreciation, onReroll, onEdit, onRegenerate, onTone }: Props) {
  const [copied, setCopied] = useState<string>()
  const { status, text, source, reroll } = appreciation
  const tooLong = text.length > source.maxLength

  const copy = async () => setCopied((await copyText(text)) ? text : undefined)

  return (
    <section className="panel appreciation-text">
      <h2>
        Appréciation <small className={`status ${status}`}>{statusLabels[status]}</small>
      </h2>
      {status === 'unrated' ? (
        <p className="hint">Évalue au moins un critère pour que la plume écrive l’appréciation.</p>
      ) : (
        <>
          <textarea
            aria-label="Appréciation"
            rows={5}
            value={text}
            onChange={(e) => onEdit(e.target.value)}
          />
          <p className={tooLong ? 'counter over' : 'counter'}>
            {text.length} / {source.maxLength} caractères
          </p>
          <div className="plan-actions">
            {status === 'edited' ? (
              <button onClick={onRegenerate} title="Remplacer ta version par un texte généré">
                Regénérer
              </button>
            ) : (
              <button onClick={() => onReroll(nextReroll(source, reroll))}>Autre formulation</button>
            )}
            <button className="primary" onClick={copy}>
              {copied === text ? 'Copié' : 'Copier'}
            </button>
          </div>
          <ToneSlider tone={source.tone ?? 'balanced'} disabled={status === 'edited'} onChange={onTone} />
          {status === 'edited' && (
            <p className="hint">Le ton s’applique au texte généré : clique sur Regénérer pour l’utiliser.</p>
          )}
        </>
      )}
    </section>
  )
}

interface ToneSliderProps {
  tone: Tone
  disabled: boolean
  onChange: (tone: Tone) => void
}

// A native range input, so that it works with the keyboard and on touch screens; the notches below are clickable too.
function ToneSlider({ tone, disabled, onChange }: ToneSliderProps) {
  const index = TONES.findIndex((t) => t.tone === tone)
  const current = TONES[index]
  return (
    <div className={disabled ? 'tones disabled' : 'tones'}>
      <label className="tones-label" htmlFor="tone-slider">
        Ton : <strong>{current.label}</strong> <span className="tones-hint">— {current.hint}</span>
      </label>
      <input
        id="tone-slider"
        className="tone-slider"
        type="range"
        min={0}
        max={TONES.length - 1}
        step={1}
        value={index}
        disabled={disabled}
        aria-valuetext={current.label}
        onChange={(e) => onChange(TONES[Number(e.target.value)].tone)}
      />
      <div className="tone-notches" aria-hidden="true">
        {TONES.map((t, i) => (
          <button
            key={t.tone}
            className={i === index ? 'tone-notch current' : 'tone-notch'}
            style={{ '--i': i } as CSSProperties}
            tabIndex={-1}
            disabled={disabled}
            title={`${t.label} : ${t.hint}`}
            onClick={() => onChange(t.tone)}
          >
            <span className="tone-icon">{t.icon}</span>
            <span className="tone-name">{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
