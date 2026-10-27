import { jsPDF } from 'jspdf'
export function makePdf(r) {
  const d = new jsPDF(); let y = 20
  d.setFontSize(18); d.text('SOS Disaster Report', 14, y); y += 10; d.setFontSize(11)
  const rows = [
    ['Report ID', r.report_code], ['Time', new Date(r.created_at || Date.now()).toLocaleString()],
    ['Disaster', r.disaster_type], ['Name', r.name], ['Phone', r.phone], ['Alt phone', r.alt_phone],
    ['Location', r.lat ? `${r.lat}, ${r.lng}` : 'Not captured'],
    ['Map', r.lat ? `https://maps.google.com/?q=${r.lat},${r.lng}` : '-'],
    ['Adults', r.adults], ['Children', r.children], ['Elderly', r.elderly], ['Injured', r.injured],
    ['Special needs', (r.special_needs || []).join(', ')], ['Needs', (r.needs || []).join(', ')],
    ['Priority score', r.priority], ['Message', r.message]
  ]
  rows.forEach(([k, v]) => { const t = d.splitTextToSize(`${k}: ${v || '-'}`, 180); d.text(t, 14, y); y += 8 * t.length })
  d.save(`${r.report_code}.pdf`)
}
