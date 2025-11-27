'use client'

import { useState, ChangeEvent, FormEvent } from 'react'
import type { RegistrationFormData } from '@/types'

interface RegistrationFormProps {
  onSuccess: (email: string, name: string) => void
  onBack: () => void
}

export default function RegistrationForm({ onSuccess, onBack }: RegistrationFormProps) {
  const [formData, setFormData] = useState<RegistrationFormData>({
    voornaam: '',
    achternaam: '',
    email: '',
    newsletter: false
  })
  const [error, setError] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
    setError('')
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Er is iets misgegaan.')
      }

      onSuccess(formData.email, formData.voornaam)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is iets misgegaan.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="registration-page">
      <div className="form-container">
        <button className="back-button" onClick={onBack}>
          ← Terug
        </button>
        
        <div className="form-header">
          <div className="step-indicator">
            <span className="step-number">stap 1:</span>
            <span className="step-text">vul je gegevens in en druk op de knop</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="registration-form">
          <div className="form-group">
            <label htmlFor="voornaam">voornaam*:</label>
            <div className="input-wrapper">
              <input
                type="text"
                id="voornaam"
                name="voornaam"
                value={formData.voornaam}
                onChange={handleChange}
                placeholder="Voornaam"
                required
              />
              {formData.voornaam && <span className="check-icon">✓</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="achternaam">achternaam:</label>
            <div className="input-wrapper">
              <input
                type="text"
                id="achternaam"
                name="achternaam"
                value={formData.achternaam}
                onChange={handleChange}
                placeholder="Achternaam"
                required
              />
              {formData.achternaam && <span className="check-icon">✓</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">e-mailadres*:</label>
            <div className="input-wrapper">
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="email@voorbeeld.nl"
                required
              />
              {formData.email && formData.email.includes('@') && <span className="check-icon">✓</span>}
            </div>
          </div>

          <div className="form-group checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="newsletter"
                checked={formData.newsletter}
                onChange={handleChange}
              />
              <span className="checkbox-custom"></span>
              <span className="checkbox-text">
                Ja, ik ontvang graag wekelijks de nieuwsbrief van HEMA en ga akkoord met het{' '}
                <a href="#" className="privacy-link">privacy statement</a>. Afmelden kan altijd.
              </span>
            </label>
          </div>

          {error && <div className="error-message">{error}</div>}

          <button 
            type="submit" 
            className="submit-button"
            disabled={loading}
          >
            {loading ? 'Bezig...' : 'draai aan het rad »'}
          </button>

          <p className="required-note">* verplicht.</p>
        </form>
      </div>
    </div>
  )
}

