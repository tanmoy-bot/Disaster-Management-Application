import { useState, useEffect } from 'react'
import { supabase } from './supabase'
import { makePdf } from './pdf'
const STATUSES = ['received', 'team assigned', 'on the way', 'rescued']

export default function Admin() {
  const [session, setSession] = useState(null), [rows, setRows] = useState([]), [em, setEm] = useState(''), [pw, setPw] = useState(''), [err, setErr] = useState('')
  const [fType, setFType] = useState(''), [fStatus, setFStatus] = useState('')
  useEffect(() => { supabase.auth.getSession().then(({ data }) => setSession(data.session)) }, [])
  const load = async () => { const { data } = await supabase.from('reports').select('*').order('priority', { ascending: false }).order('created_at', { ascending: false }); setRows(data || []) }
  useEffect(() => {
    if (!session) return
    load()
    const ch = supabase.channel('reports-live').on('postgres_changes', { event: '*', schema: 'public', table: 'reports' }, load).subscribe()
    return () => supabase.removeChannel(ch)
  }, [session])
  const login = async e => { e.preventDefault(); const { data, error } = await supabase.auth.signInWithPassword({ email: em, password: pw }); error ? setErr(error.message) : setSession(data.session) }
  const setStatus = async (id, status) => { await supabase.from('reports').update({ status }).eq('id', id); load() }
  if (!session) return (<form onSubmit={login}><h2>Rescue team login</h2><p className="lead">Only authorised team members.</p>
    <div className="panel"><label className="f">Email<input value={em} onChange={e => setEm(e.target.value)} /></label>
      <label className="f">Password<input type="password" value={pw} onChange={e => setPw(e.target.value)} /></label>
      <button className="btn dark">Login</button>{err && <p className="notice">{err}</p>}</div></form>)
  const shown = rows.filter(r => (!fType || r.disaster_type === fType) && (!fStatus || r.status === fStatus))
  const lvl = p => p >= 15 ? 'hi' : p >= 7 ? 'mid' : ''
  const lbl = p => p >= 15 ? 'Critical' : p >= 7 ? 'High' : 'Normal'
  return (<div><h2>Live reports</h2>
    <div className="stats">
      <div className="stat"><b>{rows.length}</b><span>Total</span></div>
      <div className="stat"><b>{rows.filter(r => r.status === 'received').length}</b><span>Waiting</span></div>
      <div className="stat"><b>{rows.filter(r => r.status === 'rescued').length}</b><span>Rescued</span></div></div>
    <h3>Filter</h3>
    <div className="chips">{['', ...new Set(rows.map(r => r.disaster_type))].map(t => <button key={t} className={'chip ' + (fType === t ? 'sel' : '')} onClick={() => setFType(t)}>{t || 'All types'}</button>)}</div>
    <div className="chips" style={{ marginTop: 8 }}>{['', ...STATUSES].map(s => <button key={s} className={'chip need ' + (fStatus === s ? 'sel' : '')} onClick={() => setFStatus(s)}>{s || 'All status'}</button>)}</div>
    {shown.map(r => (<div key={r.id} className={'rep ' + lvl(r.priority)}>
      <h4><span>{r.disaster_type}, {lbl(r.priority)}</span><span className={'badge ' + r.status.split(' ')[0]}>{r.status}</span></h4>
      <div className="meta"><b>{r.report_code}</b> · score {r.priority} · {new Date(r.created_at).toLocaleString()}<br />
        {r.name}, <a href={`tel:${r.phone}`}>{r.phone}</a><br />
        {r.adults} adults, {r.children} children, {r.elderly} elderly, {r.injured} injured<br />
        Needs: {(r.needs || []).join(', ') || '-'}{r.special_needs?.length > 0 && ` · Special: ${r.special_needs.join(', ')}`}
        {r.message && <><br />"{r.message}"</>}</div>
      <div className="acts">
        <select value={r.status} onChange={e => setStatus(r.id, e.target.value)}>{STATUSES.map(s => <option key={s}>{s}</option>)}</select>
        {r.lat && <a className="btn line sm" href={`https://maps.google.com/?q=${r.lat},${r.lng}`} target="_blank" rel="noreferrer">Map</a>}
        <button className="btn dark sm" onClick={() => makePdf(r)}>PDF</button></div></div>))}
    {shown.length === 0 && <p className="lead">No reports yet.</p>}</div>)
}
