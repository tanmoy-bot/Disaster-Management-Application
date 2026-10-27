import { useState, useEffect } from 'react'
import { sendOrQueue } from './offline'
import { makePdf } from './pdf'
const TYPES = ['Flood', 'Earthquake', 'Fire', 'Landslide', 'Cyclone', 'Medical', 'Other']
const SPECIAL = ['Pregnant woman', 'Disabled person', 'Serious patient', 'Needs oxygen', 'Needs medicine']
const NEEDS = ['Food', 'Water', 'Medicine', 'Boat', 'Shelter', 'Rescue']
const toggle = (a, v) => a.includes(v) ? a.filter(x => x !== v) : [...a, v]
const Counter = ({ label, v, on }) => (<div className="counter"><span>{label}</span><div>
  <button type="button" aria-label={'less ' + label} onClick={() => on(Math.max(0, v - 1))}>−</button><b>{v}</b>
  <button type="button" aria-label={'more ' + label} onClick={() => on(v + 1)}>+</button></div></div>)
const Chips = ({ list, val, on, cls }) => (<div className="chips">{list.map(x =>
  <button type="button" key={x} className={`chip ${cls || ''} ${val.includes(x) ? 'sel' : ''}`} onClick={() => on(toggle(val, x))}>{x}</button>)}</div>)

export default function Report() {
  const [f, setF] = useState({ disaster_type: 'Flood', adults: 1, children: 0, elderly: 0, injured: 0, special_needs: [], needs: ['Rescue'], name: '', phone: '', alt_phone: '', message: '', lat: null, lng: null })
  const [done, setDone] = useState(null), [gps, setGps] = useState('Finding your location...')
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))
  const locate = () => {
    setGps('Finding your location...')
    navigator.geolocation.getCurrentPosition(
      p => { set('lat', +p.coords.latitude.toFixed(5)); set('lng', +p.coords.longitude.toFixed(5)); setGps('Location captured') },
      () => setGps('Location not found. Turn on GPS.'), { enableHighAccuracy: true, timeout: 15000 })
  }
  useEffect(() => { locate() }, [])
  const submit = async e => {
    e.preventDefault()
    const priority = f.injured * 5 + f.children * 2 + f.elderly * 2 + f.special_needs.length * 3 + f.adults
    const r = { ...f, priority, report_code: 'SOS-' + Date.now().toString(36).toUpperCase().slice(-6) }
    setDone({ r, state: await sendOrQueue(r) })
  }
  if (done) {
    const { r, state } = done, sent = state === 'sent'
    const sms = `SOS ${r.disaster_type.toUpperCase()} ${r.lat},${r.lng} A${r.adults} C${r.children} E${r.elderly} INJ${r.injured} PH${r.phone} ${r.report_code}`
    return (<div><h2>{sent ? 'Help is on the way' : 'Saved on your phone'}</h2>
      <div className={'panel receipt ' + (sent ? '' : 'q')}>
        <div className="meta">Your report ID</div><div className="code">{r.report_code}</div>
        <p className="notice">{sent ? 'Your report has reached the rescue team.' : 'No network. It will send automatically when signal returns.'}</p>
        <button className="btn dark" onClick={() => makePdf(r)}>Download PDF</button>
        <a className="btn line" href={`sms:${import.meta.env.VITE_SMS_NUMBER}?body=${encodeURIComponent(sms)}`}>Send by SMS (works without internet)</a>
        <button className="btn line" onClick={() => setDone(null)}>New report</button></div></div>)
  }
  return (<form onSubmit={submit}>
    <h2>Need help?</h2><p className="lead">Press the button. Your location is sent with it.</p>
    <button type="button" className="sosbtn" onClick={submit}>SOS<small>Send emergency alert now</small></button>
    <div className={'gps ' + (f.lat ? 'ok' : '')}><span>{gps}{f.lat && ` (${f.lat}, ${f.lng})`}</span><button type="button" onClick={locate}>Retry</button></div>
    <p className="or">or fill details so rescuers can prepare</p>
    <h3>What happened?</h3><Chips list={TYPES} val={[f.disaster_type]} on={a => set('disaster_type', a.filter(x => x !== f.disaster_type)[0] || f.disaster_type)} />
    <h3>How many people?</h3>
    <div className="panel">{['adults', 'children', 'elderly', 'injured'].map(k => <Counter key={k} label={k[0].toUpperCase() + k.slice(1)} v={f[k]} on={v => set(k, v)} />)}</div>
    <h3>Anyone with special needs?</h3><Chips cls="warn" list={SPECIAL} val={f.special_needs} on={v => set('special_needs', v)} />
    <h3>What do you need?</h3><Chips cls="need" list={NEEDS} val={f.needs} on={v => set('needs', v)} />
    <h3>Your contact</h3>
    <div className="panel">
      <label className="f">Name<input value={f.name} onChange={e => set('name', e.target.value)} required /></label>
      <label className="f">Phone<input type="tel" value={f.phone} onChange={e => set('phone', e.target.value)} required /></label>
      <label className="f">Alternate phone<input type="tel" value={f.alt_phone} onChange={e => set('alt_phone', e.target.value)} /></label>
      <label className="f">Anything else?<textarea value={f.message} onChange={e => set('message', e.target.value)} /></label></div>
    <button type="submit" className="btn red">Submit full report</button></form>)
}
