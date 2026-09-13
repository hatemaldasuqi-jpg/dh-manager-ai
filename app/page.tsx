'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'
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
  {
    id: 1,
    text: 'إكمال وتسليم الويبسايت',
    client: 'GOLDEN MOBILE',
    due: '2026-09-20',
    priority: 'high',
    done: false,
  },
  {
    id: 2,
    text: 'تجهيز خطة إطلاق + أول محتوى',
    client: 'WATAD BUILDING',
    due: '2026-09-14',
    priority: 'high',
    done: false,
  },
  {
    id: 3,
    text: 'تجهيز خطة إطلاق + أول محتوى',
    client: 'MILK THERAPY',
    due: '2026-09-14',
    priority: 'high',
    done: false,
  },
  {
    id: 4,
    text: 'متابعة الحملات اليومية',
    client: 'ALL ACTIVE CLIENTS',
    due: '2026-09-14',
    priority: 'medium',
    done: false,
  },
  {
    id: 5,
    text: 'تحصيل الدفعة المتبقية',
    client: 'WATAD BUILDING',
    due: '2026-09-15',
    priority: 'medium',
    done: false,
  },
  {
    id: 6,
    text: 'تحصيل الدفعة المتبقية',
    client: 'MILK THERAPY',
    due: '2026-09-15',
    priority: 'medium',
    done: false,
  },
]

function localDateISO() {
  const now = new Date()

  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

function daysBetween(a: string, b: string) {
  return Math.ceil(
    (new Date(b).getTime() - new Date(a).getTime()) / 86400000
  )
}

function health(client: (typeof clients)[number], today: string) {
  let score = 100

  if (client.status === 'launch') score -= 18
  if (client.status === 'website') score -= 10
  if (client.outstanding > 0) score -= 10

  const daysLeft = daysBetween(today, client.end)

  if (daysLeft <= 7) score -= 8

  return Math.max(0, score)
}

export default function Home() {
  const router = useRouter()

  const [checkingAuth, setCheckingAuth] = useState(true)
  const [tasks, setTasks] = useState(initialTasks)
  const [quickTask, setQuickTask] = useState('')
  const [filter, setFilter] = useState<'all' | 'today' | 'urgent'>('all')

  const today = localDateISO()

  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession()

      if (!data.session) {
        router.replace('/login')
        return
      }

      setCheckingAuth(false)
    }

    checkAuth()
  }, [router])

  const outstanding = clients.reduce(
    (sum, client) => sum + client.outstanding,
    0
  )

  const urgentCount = tasks.filter(
    task => !task.done && task.priority === 'high'
  ).length

  const activeSocial = clients.filter(
    client => client.packageName !== 'WEBSITE'
  ).length

  const visibleTasks = useMemo(() => {
    return tasks.filter(task => {
      if (filter === 'urgent') {
        return !task.done && task.priority === 'high'
      }

      if (filter === 'today') {
        return !task.done && task.due <= today
      }

      return true
    })
  }, [tasks, filter, today])

  const aiBrief = useMemo(() => {
    const high = tasks.filter(
      task => !task.done && task.priority === 'high'
    )

    const next = high
      .slice(0, 3)
      .map(task => `${task.client}: ${task.text}`)

    return next.length
      ? next
      : ['لا توجد مهام حرجة الآن. ركّز على المتابعة اليومية والحملات.']
  }, [tasks])

  const addTask = () => {
    if (!quickTask.trim()) return

    setTasks(prev => [
      {
        id: Date.now(),
        text: quickTask.trim(),
        client: 'GENERAL',
        due: today,
        priority: 'normal',
        done: false,
      },
      ...prev,
    ])

    setQuickTask('')
  }

  const toggle = (id: number) => {
    setTasks(prev =>
      prev.map(task =>
        task.id === id
          ? { ...task, done: !task.done }
          : task
      )
    )
  }

  if (checkingAuth) {
    return (
      <main className="shell">
        <div className="panel">
          جاري التحقق من تسجيل الدخول...
        </div>
      </main>
    )
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brandWrap">
          <img
            className="brandLogo"
            src="/dh-agency-logo.jpeg"
            alt="DH Agency logo"
          />

          <div>
            <div className="eyebrow">
              DH AGENCY • OPERATIONS
            </div>

            <h1>
              DH Manager <span>AI</span>
            </h1>

            <p>
              لوحة تشغيل يومية تمنع التراكم قبل ما يصير مشكلة.
            </p>
          </div>
        </div>

        <div className="datebox">
          <b>{today}</b>
          <span>اليوم</span>
        </div>
      </header>

      <section className="metrics">
        <div className="metric">
          <small>العملاء / المشاريع</small>
          <strong>{clients.length}</strong>
          <span>{activeSocial} سوشال + 1 ويبسايت</span>
        </div>

        <div className="metric danger">
          <small>مهام حرجة</small>
          <strong>{urgentCount}</strong>
          <span>تحتاج انتباه سريع</span>
        </div>

        <div className="metric warn">
          <small>مستحقات</small>
          <strong>{outstanding} JD</strong>
          <span>المستحقات المسجلة حالياً</span>
        </div>

        <div className="metric">
          <small>هدفك المالي</small>
          <strong>3000 JD</strong>
          <span>قبل شهر 11</span>
        </div>
      </section>

      <section className="grid2">
        <div className="panel ai">
          <div className="panelHead">
            <h2>AI Operations Brief</h2>
            <span className="pill">LIVE PRIORITY</span>
          </div>

          <p className="muted">
            أهم 3 أشياء لازم تضل قدامك:
          </p>

          <ol className="brief">
            {aiBrief.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ol>

          <div className="quick">
            <input
              value={quickTask}
              onChange={e => setQuickTask(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') addTask()
              }}
              placeholder="مثال: تصوير WATAD الخميس"
            />

            <button onClick={addTask}>
              + أضف مهمة
            </button>
          </div>
        </div>

        <div className="panel">
          <div className="panelHead">
            <h2>الضغط التشغيلي</h2>
            <span className="pill orange">LOAD</span>
          </div>

          <div className="loadrow">
            <span>بوستات DH GROWTH شهرياً</span>
            <b>70</b>
          </div>

          <div className="loadrow">
            <span>ريلز DH GROWTH شهرياً</span>
            <b>35</b>
          </div>

          <div className="loadrow">
            <span>ستوري يومي</span>
            <b>7 حسابات</b>
          </div>

          <div className="loadrow">
            <span>إدارة حملات ومتابعة</span>
            <b>يومي</b>
          </div>

          <p className="note">
            الرقم هذا يوضح ليش لازم التشغيل يصير بنظام، مش بالذاكرة.
          </p>
        </div>
      </section>

      <section className="panel">
        <div className="panelHead">
          <h2>المهام</h2>

          <div className="filters">
            <button
              className={filter === 'all' ? 'active' : ''}
              onClick={() => setFilter('all')}
            >
              الكل
            </button>

            <button
              className={filter === 'today' ? 'active' : ''}
              onClick={() => setFilter('today')}
            >
              اليوم
            </button>

            <button
              className={filter === 'urgent' ? 'active' : ''}
              onClick={() => setFilter('urgent')}
            >
              حرجة
            </button>
          </div>
        </div>

        <div className="tasks">
          {visibleTasks.map(task => (
            <label
              key={task.id}
              className={`task ${task.done ? 'done' : ''}`}
            >
              <input
                type="checkbox"
                checked={task.done}
                onChange={() => toggle(task.id)}
              />

              <div className="taskText">
                <b>{task.text}</b>
                <span>
                  {task.client} • {task.due}
                </span>
              </div>

              <span
                className={`priority ${task.priority}`}
              >
                {task.priority === 'high'
                  ? 'HIGH'
                  : task.priority === 'medium'
                  ? 'MED'
                  : 'NORMAL'}
              </span>
            </label>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panelHead">
          <h2>العملاء والعقود</h2>
          <span className="pill">
            CLIENT HEALTH
          </span>
        </div>

        <div className="clients">
          {clients.map(client => {
            const clientHealth = health(client, today)

            return (
              <article
                className="client"
                key={client.name}
              >
                <div className="clientTop">
                  <div>
                    <h3>{client.name}</h3>
                    <span>{client.packageName}</span>
                  </div>

                  <div
                    className={`score ${
                      clientHealth < 80 ? 'low' : ''
                    }`}
                  >
                    {clientHealth}
                  </div>
                </div>

                <p>{client.notes}</p>

                <div className="dates">
                  <span>من {client.start}</span>
                  <span>إلى {client.end}</span>
                </div>

                {client.outstanding > 0 && (
                  <div className="money">
                    متبقي {client.outstanding} JD
                  </div>
                )}

                {client.packageName === 'DH GROWTH' && (
                  <div className="quota">
                    {growthPackage.posts} Posts •{' '}
                    {growthPackage.reels} Reels • Daily Story
                  </div>
                )}
              </article>
            )
          })}
        </div>
      </section>

      <footer className="ownerFooter">
        <div className="signatureBlock">
          <span className="signatureLabel">
            Founder & Owner
          </span>

          <div className="signature">
            Hatem Al Dasuqi
          </div>

          <div className="signatureName">
            HATEM AL DASUQI
          </div>

          <div className="signatureLine" />

          <small>DH AGENCY</small>
        </div>
      </footer>
    </main>
  )
}
