import { useState, useEffect } from 'react'
import TabBar from './components/TabBar.jsx'
import Onboarding from './components/Onboarding.jsx'
import MeinTag from './screens/MeinTag.jsx'
import Fortschritt from './screens/Fortschritt.jsx'
import Jobtracker from './screens/Jobtracker.jsx'
import Wachstum from './screens/Wachstum.jsx'
import Ideen from './screens/Ideen.jsx'

export default function App() {
  const [activeTab, setActiveTab] = useState('tag')
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
    tag: <MeinTag />,
    fortschritt: <Fortschritt />,
    jobs: <Jobtracker />,
    wachstum: <Wachstum />,
    ideen: <Ideen />,
  }

  return (
    <>
      {screens[activeTab]}
      <TabBar active={activeTab} onChange={setActiveTab} />
    </>
  )
}
