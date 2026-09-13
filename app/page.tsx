'use client'

import { useMemo, useState } from 'react'
import { clients, growthPackage } from '../lib/data'

type Task = {
  id: number
  text: string
  client: string
  due: string
  priority: 'high' | 'medium' | 'normal'
  done: boolean
}

const initialTasks: Task[] = [
  { id: 1, text: 'إكمال وتسليم الويبسايت', client: 'GOLDEN MOBILE', due: '2026-09-20', priority: 'high', done: false },
  { id: 2, text: 'تجهيز خطة إطلاق + أول محتوى', client: 'WATAD BUILDING', due: '2026-09-14', priority: 'high', done: false },
  { id: 3, text: 'تجهيز خطة إطلاق + أول محتوى', client: 'MILK THERAPY', due: '2026-09-14', priority: 'high', done: false },
  { id: 4, text: 'متابعة الحملات اليومية', client: 'ALL ACTIVE CLIENTS', due: '2026-09-13', priority: 'medium', done: false },
  { id: 5, text: 'تحصيل الدفعة المتبقية', client: 'WATAD BUILDING', due: '2026-09-15', priority: 'medium', done: false },
  { id: 6, text: 'تحصيل الدفعة المتبقية', client: 'MILK THERAPY', due: '2026-09-15', priority: 'medium', done: false },
]

function daysBetween(a: string, b: string) {
  return Math.ceil((new Date(b).getTime() - new Date(a).getTime()) / 86400000)
}

function health(client: (typeof clients)[number]) {
  let score = 100
  if (client.status === 'launch') score -= 18
  if (client.status === 'website') score -= 10
  if (client.outstanding > 0) score -= 10
  const daysLeft = daysBetween('2026-09-13', client.end)
  if (daysLeft <= 7) score -= 8
  return Math.max(0, score)
}

export default function Home() {
  const [tasks, setTasks] = useState(initialTasks)
  const [quickTask, setQuickTask] = useState('')
  const [filter, setFilter] = useState<'all' | 'today' | 'urgent'>('all')

  const outstanding = clients.reduce((s, c) => s + c.outstanding, 0)
  const urgentCount = tasks.filter(t => !t.done && t.priority === 'high').length
  const activeSocial = clients.filter(c => c.packageName !== 'WEBSITE').length

  const visibleTasks = useMemo(() => tasks.filter(t => {
    if (filter === 'urgent') return !t.done && t.priority === 'high'
    if (filter === 'today') return !t.done && t.due <= '2026-09-13'
    return true
  }), [tasks, filter])

  const aiBrief = useMemo(() => {
    const high = tasks.filter(t => !t.done && t.priority === 'high')
    const next = high.slice(0, 3).map(t => `${t.client}: ${t.text}`)
    return next.length ? next : ['لا توجد مهام حرجة الآن. ركّز على المتابعة اليومية والحملات.']
  }, [tasks])

  const addTask = () => {
    if (!quickTask.trim()) return
    setTasks(prev => [{ id: Date.now(), text: quickTask.trim(), client: 'GENERAL', due: '2026-09-13', priority: 'normal', done: false }, ...prev])
    setQuickTask('')
  }

  const toggle = (id: number) => setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t))

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brandWrap">
          <img className="brandLogo" src="/dh-agency-logo.jpeg" alt="DH Agency logo" />
          <div>
            <div className="eyebrow">DH AGENCY • OPERATIONS</div>
            <h1>DH Manager <span>AI</span></h1>
            <p>لوحة تشغيل يومية تمنع التراكم قبل ما يصير مشكلة.</p>
          </div>
        </div>
        <div className="datebox"><b>13 SEP 2026</b><span>الأحد</span></div>
      </header>

      <section className="metrics">
        <div className="metric"><small>العملاء / المشاريع</small><strong>{clients.length}</strong><span>{activeSocial} سوشال + 1 ويبسايت</span></div>
        <div className="metric danger"><small>مهام حرجة</small><strong>{urgentCount}</strong><span>تحتاج انتباه سريع</span></div>
        <div className="metric warn"><small>مستحقات</small><strong>{outstanding} JD</strong><span>50 WATAD + 65 MILK</span></div>
        <div className="metric"><small>هدفك المالي</small><strong>3000 JD</strong><span>قبل شهر 11</span></div>
      </section>

      <section className="grid2">
        <div className="panel ai">
          <div className="panelHead"><h2>AI Operations Brief</h2><span className="pill">LIVE PRIORITY</span></div>
          <p className="muted">أهم 3 أشياء لازم تضل قدامك:</p>
          <ol className="brief">{aiBrief.map((x, i) => <li key={i}>{x}</li>)}</ol>
          <div className="quick">
            <input value={quickTask} onChange={e => setQuickTask(e.target.value)} onKeyDown={e => e.key === 'Enter' && addTask()} placeholder="مثال: تصوير WATAD الخميس" />
            <button onClick={addTask}>+ أضف مهمة</button>
          </div>
        </div>

        <div className="panel">
          <div className="panelHead"><h2>الضغط التشغيلي</h2><span className="pill orange">LOAD</span></div>
          <div className="loadrow"><span>بوستات DH GROWTH شهرياً</span><b>80</b></div>
          <div className="loadrow"><span>ريلز DH GROWTH شهرياً</span><b>40</b></div>
          <div className="loadrow"><span>ستوري يومي</span><b>8 حسابات</b></div>
          <div className="loadrow"><span>إدارة حملات ومتابعة</span><b>يومي</b></div>
          <p className="note">الرقم هذا يوضح ليش لازم التشغيل يصير بنظام، مش بالذاكرة.</p>
        </div>
      </section>

      <section className="panel">
        <div className="panelHead"><h2>المهام</h2><div className="filters">
          <button className={filter==='all'?'active':''} onClick={()=>setFilter('all')}>الكل</button>
          <button className={filter==='today'?'active':''} onClick={()=>setFilter('today')}>اليوم</button>
          <button className={filter==='urgent'?'active':''} onClick={()=>setFilter('urgent')}>حرجة</button>
        </div></div>
        <div className="tasks">{visibleTasks.map(t => (
          <label key={t.id} className={`task ${t.done ? 'done' : ''}`}>
            <input type="checkbox" checked={t.done} onChange={()=>toggle(t.id)} />
            <div className="taskText"><b>{t.text}</b><span>{t.client} • {t.due}</span></div>
            <span className={`priority ${t.priority}`}>{t.priority === 'high' ? 'HIGH' : t.priority === 'medium' ? 'MED' : 'NORMAL'}</span>
          </label>
        ))}</div>
      </section>

      <section className="panel">
        <div className="panelHead"><h2>العملاء والعقود</h2><span className="pill">CLIENT HEALTH</span></div>
        <div className="clients">
          {clients.map(c => {
            const h = health(c)
            return <article className="client" key={c.name}>
              <div className="clientTop"><div><h3>{c.name}</h3><span>{c.packageName}</span></div><div className={`score ${h<80?'low':''}`}>{h}</div></div>
              <p>{c.notes}</p>
              <div className="dates"><span>من {c.start}</span><span>إلى {c.end}</span></div>
              {c.outstanding > 0 && <div className="money">متبقي {c.outstanding} JD</div>}
              {c.packageName === 'DH GROWTH' && <div className="quota">{growthPackage.posts} Posts • {growthPackage.reels} Reels • Daily Story</div>}
            </article>
          })}
        </div>
      </section>

      <footer className="ownerFooter">
        <div className="signatureBlock">
          <span className="signatureLabel">Founder & Owner</span>
          <div className="signature">Hatem Al Dasuqi</div>
          <div className="signatureName">HATEM AL DASUQI</div>
          <div className="signatureLine" />
          <small>DH AGENCY</small>
        </div>
      </footer>
    </main>
  )
}
