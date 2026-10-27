import { supabase } from './supabase'
const KEY = 'sos_queue'
export const getQueue = () => JSON.parse(localStorage.getItem(KEY) || '[]')
const setQueue = q => localStorage.setItem(KEY, JSON.stringify(q))
export async function sendOrQueue(r) {
  try {
    if (!navigator.onLine) throw new Error('offline')
    const { error } = await supabase.from('reports').insert(r)
    if (error) throw error
    return 'sent'
  } catch { setQueue([...getQueue(), r]); return 'queued' }
}
export async function syncQueue() {
  const q = getQueue()
  if (!q.length || !navigator.onLine) return 0
  const left = []
  for (const r of q) {
    const { error } = await supabase.from('reports').insert(r)
    if (error && error.code !== '23505') left.push(r)
  }
  setQueue(left)
  return q.length - left.length
}
