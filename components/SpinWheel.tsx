'use client'

import { useState, useRef } from 'react'
import type { Prize, SpinResult } from '@/types'

const PRIZES: Prize[] = [
  { name: 'HEMA regenponcho', color: '#FF6B6B', icon: '🧥' },
  { name: '€50 shoptegoed', color: '#4ECDC4', icon: '💰' },
  { name: '€250 shoptegoed', color: '#FFE66D', icon: '💎' },
  { name: '15% korting', color: '#95E1D3', icon: '🏷️' },
  { name: '€100 shoptegoed', color: '#F38181', icon: '🎁' }
]

interface SpinWheelProps {
  email: string
  onSpinComplete: (result: SpinResult) => void
}

export default function SpinWheel({ email, onSpinComplete }: SpinWheelProps) {
  const [isSpinning, setIsSpinning] = useState<boolean>(false)
  const [rotation, setRotation] = useState<number>(0)
  const [error, setError] = useState<string>('')
  const wheelRef = useRef<SVGSVGElement>(null)

  const spinWheel = async () => {
    if (isSpinning) return

    setIsSpinning(true)
    setError('')

    try {
      const response = await fetch('/api/spin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Er is iets misgegaan.')
      }

      // Calculate rotation to land on the winning prize
      const segmentAngle = 360 / PRIZES.length
      const prizeIndex = data.prizeIndex
      
      // Calculate the angle to the center of the winning segment
      // Add extra rotations for dramatic effect (5-8 full rotations)
      const extraRotations = (5 + Math.random() * 3) * 360
      const targetAngle = 360 - (prizeIndex * segmentAngle) - (segmentAngle / 2)
      const finalRotation = rotation + extraRotations + targetAngle + (Math.random() * 20 - 10)

      setRotation(finalRotation)

      // Wait for animation to complete (doubled duration), then add delay before showing modal
      setTimeout(() => {
        setIsSpinning(false)
        // Additional delay before showing the prize modal
        setTimeout(() => {
          onSpinComplete(data)
        }, 2000)
      }, 10000)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Er is iets misgegaan.')
      setIsSpinning(false)
    }
  }

  const segmentAngle = 360 / PRIZES.length

  return (
    <div className="spin-wheel-page">
      <div className="wheel-container">
        <div className="step-indicator wheel-step">
          <span className="step-number">stap 2:</span>
          <span className="step-text">draai aan het rad!</span>
        </div>

        <div className="wheel-wrapper">
          <div className="wheel-pointer">▼</div>
          
          <svg
            ref={wheelRef}
            className="wheel"
            viewBox="0 0 300 300"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: isSpinning ? 'transform 10s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none'
            }}
          >
            <defs>
              <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.3"/>
              </filter>
            </defs>
            
            {PRIZES.map((prize, index) => {
              const startAngle = index * segmentAngle - 90
              const endAngle = startAngle + segmentAngle
              const startRad = (startAngle * Math.PI) / 180
              const endRad = (endAngle * Math.PI) / 180
              
              const x1 = 150 + 140 * Math.cos(startRad)
              const y1 = 150 + 140 * Math.sin(startRad)
              const x2 = 150 + 140 * Math.cos(endRad)
              const y2 = 150 + 140 * Math.sin(endRad)
              
              const largeArcFlag = segmentAngle > 180 ? 1 : 0
              
              const pathData = `
                M 150 150
                L ${x1} ${y1}
                A 140 140 0 ${largeArcFlag} 1 ${x2} ${y2}
                Z
              `
              
              // Calculate text position
              const midAngle = startAngle + segmentAngle / 2
              const midRad = (midAngle * Math.PI) / 180
              const textX = 150 + 85 * Math.cos(midRad)
              const textY = 150 + 85 * Math.sin(midRad)
              
              return (
                <g key={index}>
                  <path
                    d={pathData}
                    fill={prize.color}
                    stroke="#fff"
                    strokeWidth="2"
                  />
                  <text
                    x={textX}
                    y={textY}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#333"
                    fontSize="11"
                    fontWeight="bold"
                    transform={`rotate(${midAngle + 90}, ${textX}, ${textY})`}
                  >
                    <tspan x={textX} dy="-6">{prize.icon}</tspan>
                    <tspan x={textX} dy="14" fontSize="9">{prize.name.split(' ')[0]}</tspan>
                  </text>
                </g>
              )
            })}
            
            <circle cx="150" cy="150" r="25" fill="#00a0a0" stroke="#fff" strokeWidth="3"/>
            <text x="150" y="150" textAnchor="middle" dominantBaseline="middle" fill="#fff" fontSize="10" fontWeight="bold">
              HEMA
            </text>
          </svg>
        </div>

        {error && <div className="error-message">{error}</div>}

        <button 
          className="spin-button"
          onClick={spinWheel}
          disabled={isSpinning}
        >
          {isSpinning ? '🎰 Draaien...' : '🎡 Draai het rad!'}
        </button>

        <p className="spin-hint">
          Klik op de knop om het rad te draaien en je prijs te winnen!
        </p>
      </div>
    </div>
  )
}

