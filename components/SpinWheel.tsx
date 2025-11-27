'use client'

import { useState, useRef, useEffect } from 'react'
import type { SpinResult } from '@/types'

// Color palette for wheel segments
const COLORS = [
  '#FF6B6B',
  '#4ECDC4',
  '#FFE66D',
  '#95E1D3',
  '#F38181',
  '#AA96DA',
  '#FCBAD3',
  '#A8D8EA'
]

// Icons for different prize types
const getIconForPrize = (type: string): string => {
  const lowerType = type.toLowerCase()
  if (lowerType.includes('poncho') || lowerType.includes('regen')) return '🧥'
  if (lowerType.includes('250')) return '💎'
  if (lowerType.includes('100')) return '🎁'
  if (lowerType.includes('50')) return '💰'
  if (lowerType.includes('off') || lowerType.includes('korting')) return '🏷️'
  return '🎉'
}

interface Prize {
  type: string
  name: string
  color: string
  icon: string
}

interface SpinWheelProps {
  email: string
  onSpinComplete: (result: SpinResult) => void
}

export default function SpinWheel({ email, onSpinComplete }: SpinWheelProps) {
  const [isSpinning, setIsSpinning] = useState<boolean>(false)
  const [hasSpun, setHasSpun] = useState<boolean>(false)
  const [rotation, setRotation] = useState<number>(0)
  const [error, setError] = useState<string>('')
  const [prizes, setPrizes] = useState<Prize[]>([])
  const [loading, setLoading] = useState<boolean>(true)
  const wheelRef = useRef<SVGSVGElement>(null)

  // Fetch prizes from API on component mount
  useEffect(() => {
    const fetchPrizes = async () => {
      try {
        const response = await fetch('/api/prizes')
        const data = await response.json()
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to load prizes')
        }

        // Map prize data to Prize objects with colors and icons
        const prizeList: Prize[] = data.prizes.map((prize: { type: string; name: string }, index: number) => ({
          type: prize.type,
          name: prize.name,
          color: COLORS[index % COLORS.length],
          icon: getIconForPrize(prize.type)
        }))

        setPrizes(prizeList)
      } catch (err) {
        console.error('Error fetching prizes:', err)
        setError('Kon prijzen niet laden. Vernieuw de pagina.')
      } finally {
        setLoading(false)
      }
    }

    fetchPrizes()
  }, [])

  const spinWheel = async () => {
    if (isSpinning || hasSpun || prizes.length === 0) return

    setIsSpinning(true)
    setHasSpun(true)
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

      // Find the prize index by type in our current prizes array
      const prizeIndex = prizes.findIndex(p => p.type === data.prizeType)
      
      if (prizeIndex === -1) {
        console.error('Prize type not found in wheel:', data.prizeType)
        console.error('Looking for:', data.prizeType)
        console.error('Available types:', prizes.map(p => p.type))
        throw new Error('Er is iets misgegaan met de prijsbepaling.')
      }

      // Calculate rotation to land on the winning prize
      const segmentAngle = 360 / prizes.length
      
      // The wheel is drawn with segment 0 starting at the top (-90 degrees in SVG)
      // The pointer is fixed at the top
      // At rotation=0, the START of segment 0 is at the pointer
      // We need to rotate so the CENTER of the winning segment aligns with the pointer
      
      // Segment N's center is at: N * segmentAngle + segmentAngle/2 degrees from the start
      // To bring this to the top, we rotate BACKWARDS (which means positive rotation in CSS)
      const segmentCenterOffset = prizeIndex * segmentAngle + (segmentAngle / 2)
      const targetAngle = 360 - segmentCenterOffset
      
      // Add full rotations for dramatic effect (6-9 full spins)
      const fullRotations = (6 + Math.floor(Math.random() * 4)) * 360
      
      // Final rotation: full spins + target angle
      const finalRotation = fullRotations + targetAngle

      console.log('Spin calculation:', {
        prizeIndex,
        prizeType: data.prizeType,
        segmentAngle,
        segmentCenterOffset,
        targetAngle,
        fullRotations,
        finalRotation
      })

      setRotation(finalRotation)

      // Wait for animation to complete, then show result
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
      setHasSpun(false) // Allow retry on error
    }
  }

  if (loading) {
    return (
      <div className="spin-wheel-page">
        <div className="wheel-container">
          <div className="loading-spinner">Laden...</div>
        </div>
      </div>
    )
  }

  if (prizes.length <= 1) {
    return (
      <div className="spin-wheel-page">
        <div className="wheel-container">
          <div className="no-coupons-message">
            <div className="no-coupons-icon">🎟️</div>
            <h2>Geen coupons beschikbaar</h2>
            <p>Er zijn op dit moment helaas geen coupons beschikbaar. Kom later nog eens terug!</p>
          </div>
          <style jsx>{`
            .no-coupons-message {
              background: rgba(255, 255, 255, 0.95);
              border-radius: 20px;
              padding: 2.5rem 2rem;
              text-align: center;
              box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
              max-width: 400px;
            }
            .no-coupons-icon {
              font-size: 4rem;
              margin-bottom: 1rem;
            }
            .no-coupons-message h2 {
              color: #1a1a2e;
              font-size: 1.5rem;
              font-weight: 700;
              margin: 0 0 0.75rem 0;
            }
            .no-coupons-message p {
              color: #666;
              font-size: 1rem;
              margin: 0;
              line-height: 1.5;
            }
          `}</style>
        </div>
      </div>
    )
  }

  const segmentAngle = 360 / prizes.length

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
            
            {prizes.map((prize, index) => {
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
                    fontSize="18"
                    fontWeight="bold"
                    transform={`rotate(${midAngle + 90}, ${textX}, ${textY})`}
                  >
                    <tspan x={textX} dy="-10">{prize.icon}</tspan>
                    <tspan x={textX} dy="22" fontSize="13">{prize.name.split(' ')[0]}</tspan>
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
          disabled={isSpinning || hasSpun || prizes.length === 0}
        >
          {isSpinning ? '🎰 Draaien...' : hasSpun ? '✓ Je hebt gedraaid!' : '🎡 Draai het rad!'}
        </button>

        <p className="spin-hint">
          Klik op de knop om het rad te draaien en je prijs te winnen!
        </p>
      </div>
    </div>
  )
}
