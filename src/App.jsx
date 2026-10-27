import { useState, useEffect } from 'react'
import Report from './Report'
import Admin from './Admin'
import { supabase } from './supabase'
import { syncQueue, getQueue } from './offline'

function Track() {
  const [code, setCode] = useState(''), [status, setStatus] = useState('')
  const check = async () => {
    const { data, error } = await supabase.rpc('get_status', { code: code.trim().toUpperCase() })
    setStatus(error ? 'Network issue, try again' : data || 'Report not found yet')
  }
  return (<div><h2>Track your report</h2><p className="lead">Enter the report ID you got after submitting.</p>
    <div className="panel"><input placeholder="SOS-XXXXXX" value={code} onChange={e => setCode(e.target.value)} />
      <button className="btn dark" onClick={check}>Check status</button>
      {status && <p className="notice">Status: {status}</p>}</div></div>)
}

export default function App() {
  const [tab, setTab] = useState('report'), [online, setOnline] = useState(navigator.onLine), [pending, setPending] = useState(getQueue().length)
  useEffect(() => {
    const sync = async () => { setOnline(navigator.onLine); await syncQueue(); setPending(getQueue().length) }
    window.addEventListener('online', sync); window.addEventListener('offline', sync); sync()
    return () => { window.removeEventListener('online', sync); window.removeEventListener('offline', sync) }
  }, [])
  return (<div className="app">
    <header className="top"><div className="brand"><span className="mark" />SOS Report</div>
      <span className={'pill ' + (online ? 'on' : 'off')}>{online ? 'Online' : 'Offline'}{pending > 0 && ` · ${pending} waiting`}</span></header>
    {tab === 'report' && <Report />}{tab === 'track' && <Track />}{tab === 'admin' && <Admin />}
    <p className="foot">Emergency 112 · Ambulance 108 · Fire 101 · NDRF 011-24363260</p>
    <nav className="tabs">{[['report', 'Report'], ['track', 'Track'], ['admin', 'Team']].map(([k, l]) => <button key={k} className={tab === k ? 'act' : ''} onClick={() => setTab(k)}>{l}</button>)}</nav>
  </div>)
}
