import { useState } from 'react'
import TabBar from './components/TabBar.jsx'
import Onboarding from './components/Onboarding.jsx'
import Heute from './screens/Heute.jsx'
import Verlauf from './screens/Verlauf.jsx'
import Wachstum from './screens/Wachstum.jsx'

export default function App() {
  const [activeTab, setActiveTab] = useState('heute')
  const [profile, setProfile] = useState(() => {
    try {
      const stored = localStorage.getItem('userProfile')
      return stored ? JSON.parse(stored) : null
    } catch { return null }
  })

  const handleOnboardingDone = (data) => {
    localStorage.setItem('userProfile', JSON.stringify(data))
    setProfile(data)
  }

  if (!profile) {
    return <Onboarding onDone={handleOnboardingDone} />
  }

  const screens = {
    heute: <Heute />,
    wachstum: <Wachstum />,
    verlauf: <Verlauf />,
  }

  return (
    <>
      {screens[activeTab]}
      <TabBar active={activeTab} onChange={setActiveTab} />
    </>
  )
}
