'use client'

import { useState } from 'react'
import LandingPage from '@/components/LandingPage'
import RegistrationForm from '@/components/RegistrationForm'
import SpinWheel from '@/components/SpinWheel'
import PrizePopup from '@/components/PrizePopup'
import type { SpinResult } from '@/types'

type Step = 'landing' | 'form' | 'wheel' | 'prize'

export default function Home() {
  const [step, setStep] = useState<Step>('landing')
  const [userEmail, setUserEmail] = useState<string>('')
  const [userName, setUserName] = useState<string>('')
  const [prizeResult, setPrizeResult] = useState<SpinResult | null>(null)

  const handleStartClick = () => {
    setStep('form')
  }

  const handleRegistrationSuccess = (email: string, name: string) => {
    setUserEmail(email)
    setUserName(name)
    setStep('wheel')
  }

  const handleSpinComplete = (result: SpinResult) => {
    setPrizeResult(result)
    setStep('prize')
  }

  const handleClose = () => {
    setStep('landing')
    setUserEmail('')
    setUserName('')
    setPrizeResult(null)
  }

  return (
    <div className="app">
      {step === 'landing' && (
        <LandingPage onStart={handleStartClick} />
      )}
      
      {step === 'form' && (
        <RegistrationForm 
          onSuccess={handleRegistrationSuccess}
          onBack={() => setStep('landing')}
        />
      )}
      
      {step === 'wheel' && (
        <SpinWheel 
          email={userEmail}
          onSpinComplete={handleSpinComplete}
        />
      )}
      
      {step === 'prize' && prizeResult && (
        <PrizePopup 
          prize={prizeResult.prize}
          voucherCode={prizeResult.voucherCode}
          userName={userName}
          onClose={handleClose}
        />
      )}
    </div>
  )
}
