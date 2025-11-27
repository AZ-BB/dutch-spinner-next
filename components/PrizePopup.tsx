'use client'

import { useState, useEffect } from 'react'
import type { ConfettiPiece } from '@/types'

interface PrizePopupProps {
  prize: string
  voucherCode: string
  userName: string
  onClose: () => void
}

export default function PrizePopup({ prize, voucherCode, userName, onClose }: PrizePopupProps) {
  const [copied, setCopied] = useState<boolean>(false)
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([])

  useEffect(() => {
    // Generate confetti pieces
    const pieces: ConfettiPiece[] = []
    for (let i = 0; i < 50; i++) {
      pieces.push({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 2,
        duration: 2 + Math.random() * 2,
        color: ['#FF6B6B', '#4ECDC4', '#FFE66D', '#95E1D3', '#F38181', '#00a0a0'][Math.floor(Math.random() * 6)]
      })
    }
    setConfetti(pieces)
  }, [])

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(voucherCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const getPrizeEmoji = (): string => {
    if (prize.includes('poncho')) return '🧥'
    if (prize.includes('250')) return '💎'
    if (prize.includes('100')) return '🎁'
    if (prize.includes('50')) return '💰'
    if (prize.includes('korting')) return '🏷️'
    return '🎉'
  }

  return (
    <div className="prize-popup-overlay">
      <div className="confetti-container">
        {confetti.map(piece => (
          <div
            key={piece.id}
            className="confetti-piece"
            style={{
              left: `${piece.left}%`,
              animationDelay: `${piece.delay}s`,
              animationDuration: `${piece.duration}s`,
              backgroundColor: piece.color
            }}
          />
        ))}
      </div>

      <div className="prize-popup">
        <div className="prize-header">
          <div className="prize-emoji">{getPrizeEmoji()}</div>
          <h2>Gefeliciteerd{userName ? `, ${userName}` : ''}!</h2>
        </div>

        <div className="prize-content">
          <p className="prize-intro">Je hebt gewonnen:</p>
          <div className="prize-name">{prize}</div>
        </div>

        <div className="voucher-section">
          <p className="voucher-label">Jouw persoonlijke vouchercode:</p>
          <div className="voucher-code-container">
            <code className="voucher-code">{voucherCode}</code>
            <button 
              className="copy-button"
              onClick={copyToClipboard}
              title="Kopieer code"
            >
              {copied ? '✓' : '📋'}
            </button>
          </div>
          {copied && <span className="copied-message">Gekopieerd!</span>}
        </div>

        <div className="prize-instructions">
          <h3>Hoe gebruik je de code?</h3>
          <ol>
            <li>Ga naar <strong>hema.nl</strong></li>
            <li>Voeg producten toe aan je winkelwagen</li>
            <li>Vul de vouchercode in bij het afrekenen</li>
            <li>Geniet van je korting! 🎉</li>
          </ol>
        </div>

        <button className="close-button" onClick={onClose}>
          Sluiten
        </button>

        <p className="terms-note">
          Voorwaarden zijn van toepassing. Code is geldig tot 31 december 2024.
        </p>
      </div>
    </div>
  )
}

