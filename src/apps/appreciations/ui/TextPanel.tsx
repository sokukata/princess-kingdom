import { useState } from 'react'
import { nextReroll } from '../core/generate.ts'
import type { Tone } from '../core/model.ts'
import { statusLabels, type Appreciation } from './appreciation.ts'
import { copyText } from './browser.ts'

const TONES: { tone: Tone; icon: string; label: string; hint: string }[] = [
  { tone: 'praising', icon: '🌟', label: 'Élogieux', hint: 'Uniquement les points forts' },
  { tone: 'encouraging', icon: '🌱', label: 'Encourageant', hint: 'Les points forts d’abord, même en difficulté' },
  { tone: 'balanced', icon: '⚖️', label: 'Équilibré', hint: 'Le bilan, nuancé par un point dans l’autre sens' },
  { tone: 'demanding', icon: '🎯', label: 'Exigeant', hint: 'Ce qui est à améliorer d’abord, même pour un bon élève' },
  { tone: 'severe', icon: '⚠️', label: 'Sévère', hint: 'Uniquement les points à améliorer' },
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
          <div className="tones" role="radiogroup" aria-label="Ton de l’appréciation">
            <span className="tones-label">Ton</span>
            {TONES.map(({ tone, icon, label, hint }) => (
              <button
                key={tone}
                className="chip tone"
                role="radio"
                aria-checked={(source.tone ?? 'balanced') === tone}
                aria-pressed={(source.tone ?? 'balanced') === tone}
                title={hint}
                disabled={status === 'edited'}
                onClick={() => onTone(tone)}
              >
                <span aria-hidden="true">{icon} </span>
                {label}
              </button>
            ))}
          </div>
          {status === 'edited' && (
            <p className="hint">Le ton s’applique au texte généré : clique sur Regénérer pour l’utiliser.</p>
          )}
        </>
      )}
    </section>
  )
}
