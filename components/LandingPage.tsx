'use client'

interface LandingPageProps {
  onStart: () => void
}

export default function LandingPage({ onStart }: LandingPageProps) {
  return (
    <div className="landing-page">
      <div className="snowflakes">
        {[...Array(20)].map((_, i) => (
          <div key={i} className="snowflake">❄</div>
        ))}
      </div>
      
      <div className="landing-content">
        <div className="logo-container">
          <h1 className="logo">HEMA</h1>
        </div>
        
        <div className="hero-section">
          <h2 className="hero-title">Feestelijk Rad</h2>
          <p className="hero-subtitle">Draai aan het rad en win fantastische prijzen!</p>
          
          <div className="prizes-preview">
            <div className="prize-badge">🧥 Regenponcho</div>
            <div className="prize-badge">💰 €50 - €250</div>
            <div className="prize-badge">🏷️ 15% Korting</div>
          </div>
        </div>
        
        <button className="start-button" onClick={onStart}>
          <span className="button-text">Start Nu</span>
          <span className="button-icon">→</span>
        </button>
        
        <p className="terms-text">
          Door deel te nemen ga je akkoord met de actievoorwaarden.
        </p>
      </div>
      
      <div className="decorations">
        <div className="decoration decoration-1">🎄</div>
        <div className="decoration decoration-2">⭐</div>
        <div className="decoration decoration-3">🎁</div>
        <div className="decoration decoration-4">✨</div>
      </div>
    </div>
  )
}

