'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../lib/supabase'
import { growthPackage } from '../lib/data'

type Client = {
  id: string
  name: string
  package_name: string | null
  project_type: string | null
  start_date: string | null
  end_date: string | null
  outstanding: number | null
  status: string | null
  notes: string | null
}

type DbTask = {
  id: string
  client_id: string | null
  title: string
  description: string | null
  due_date: string | null
  priority: string | null
  status: string | null
}

type Task = {
  id: string
  text: string
  client: string
  clientId: string | null
  due: string
  priority: 'high' | 'medium' | 'normal'
  done: boolean
}

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

function health(client: Client, today: string) {
  let score = 100

  if (client.status === 'launch') score -= 18
  if (client.status === 'website') score -= 10
  if ((client.outstanding ?? 0) > 0) score -= 10

  if (client.end_date) {
    const daysLeft = daysBetween(today, client.end_date)

    if (daysLeft <= 7) {
      score -= 8
    }
  }

  return Math.max(0, score)
}

function normalizePriority(
  priority: string | null
): 'high' | 'medium' | 'normal' {
  if (priority === 'high') return 'high'
  if (priority === 'medium') return 'medium'
  return 'normal'
}

export default function Home() {
  const router = useRouter()

  const [checkingAuth, setCheckingAuth] = useState(true)
  const [loadingData, setLoadingData] = useState(true)

  const [clients, setClients] = useState<Client[]>([])
  const [tasks, setTasks] = useState<Task[]>([])

  const [quickTask, setQuickTask] = useState('')
  const [addingTask, setAddingTask] = useState(false)

  const [filter, setFilter] =
    useState<'all' | 'today' | 'urgent'>('all')

  const today = localDateISO()

  useEffect(() => {
    const start = async () => {
      const { data: authData } =
        await supabase.auth.getSession()

      if (!authData.session) {
        router.replace('/login')
        return
      }

      setCheckingAuth(false)

      const [
        { data: clientsData, error: clientsError },
        { data: tasksData, error: tasksError },
      ] = await Promise.all([
        supabase
          .from('clients')
          .select('*')
          .order('created_at', { ascending: true }),

        supabase
          .from('tasks')
          .select('*')
          .order('due_date', { ascending: true }),
      ])

      if (clientsError) {
        console.error('CLIENTS ERROR:', clientsError)
      }

      if (tasksError) {
        console.error('TASKS ERROR:', tasksError)
      }

      const loadedClients: Client[] =
        clientsData || []

      setClients(loadedClients)

      const clientMap = new Map(
        loadedClients.map(client => [
          client.id,
          client.name,
        ])
      )

      const loadedTasks: Task[] = (
        (tasksData || []) as DbTask[]
      ).map(task => ({
        id: task.id,
        text: task.title,
        client: task.client_id
          ? clientMap.get(task.client_id) || 'GENERAL'
          : 'GENERAL',

        clientId: task.client_id,

        due: task.due_date || today,

        priority: normalizePriority(
          task.priority
        ),

        done:
          task.status === 'completed' ||
          task.status === 'done',
      }))

      setTasks(loadedTasks)
      setLoadingData(false)
    }

    start()
  }, [router, today])

  const outstanding = clients.reduce(
    (sum, client) =>
      sum + Number(client.outstanding ?? 0),
    0
  )

  const urgentCount = tasks.filter(
    task =>
      !task.done &&
      task.priority === 'high'
  ).length

  const activeSocial = clients.filter(
    client =>
      client.package_name !== 'WEBSITE'
  ).length

  const websiteCount =
    clients.length - activeSocial

  const growthClients = clients.filter(
    client =>
      client.package_name === 'DH GROWTH'
  ).length

  const visibleTasks = useMemo(() => {
    return tasks.filter(task => {
      if (filter === 'urgent') {
        return (
          !task.done &&
          task.priority === 'high'
        )
      }

      if (filter === 'today') {
        return (
          !task.done &&
          task.due <= today
        )
      }

      return true
    })
  }, [tasks, filter, today])

  const aiBrief = useMemo(() => {
    const high = tasks
      .filter(
        task =>
          !task.done &&
          task.priority === 'high'
      )
      .slice(0, 3)
      .map(
        task =>
          `${task.client}: ${task.text}`
      )

    return high.length
      ? high
      : [
          'لا توجد مهام حرجة الآن. ركّز على المتابعة اليومية والحملات.',
        ]
  }, [tasks])

  const addTask = async () => {
    const title = quickTask.trim()

    if (!title || addingTask) return

    setAddingTask(true)

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        client_id: null,
        title,
        description: null,
        due_date: today,
        priority: 'normal',
        status: 'pending',
      })
      .select()
      .single()

    if (error) {
      console.error(
        'ADD TASK ERROR:',
        error
      )

      alert('صار خطأ أثناء إضافة المهمة.')
      setAddingTask(false)
      return
    }

    const newTask: Task = {
      id: data.id,
      text: data.title,
      client: 'GENERAL',
      clientId: null,
      due: data.due_date || today,
      priority: normalizePriority(
        data.priority
      ),
      done: false,
    }

    setTasks(prev => [
      newTask,
      ...prev,
    ])

    setQuickTask('')
    setAddingTask(false)
  }

  const toggle = async (id: string) => {
    const currentTask =
      tasks.find(task => task.id === id)

    if (!currentTask) return

    const newDone = !currentTask.done

    setTasks(prev =>
      prev.map(task =>
        task.id === id
          ? {
              ...task,
              done: newDone,
            }
          : task
      )
    )

    const { error } = await supabase
      .from('tasks')
      .update({
        status: newDone
          ? 'completed'
          : 'pending',
      })
      .eq('id', id)

    if (error) {
      console.error(
        'UPDATE TASK ERROR:',
        error
      )

      setTasks(prev =>
        prev.map(task =>
          task.id === id
            ? {
                ...task,
                done: !newDone,
              }
            : task
        )
      )

      alert(
        'صار خطأ أثناء تحديث المهمة.'
      )
    }
  }

  if (checkingAuth || loadingData) {
    return (
      <main className="shell">
        <div className="panel">
          جاري تحميل بيانات DH Manager AI...
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
              لوحة تشغيل يومية تمنع التراكم
              قبل ما يصير مشكلة.
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
          <small>
            العملاء / المشاريع
          </small>

          <strong>
            {clients.length}
          </strong>

          <span>
            {activeSocial} سوشال +{' '}
            {websiteCount} ويبسايت
          </span>
        </div>

        <div className="metric danger">
          <small>مهام حرجة</small>

          <strong>
            {urgentCount}
          </strong>

          <span>
            تحتاج انتباه سريع
          </span>
        </div>

        <div className="metric warn">
          <small>مستحقات</small>

          <strong>
            {outstanding} JD
          </strong>

          <span>
            المستحقات المسجلة حالياً
          </span>
        </div>

        <div className="metric">
          <small>
            هدفك المالي
          </small>

          <strong>
            3000 JD
          </strong>

          <span>
            قبل شهر 11
          </span>
        </div>
      </section>

      <section className="grid2">
        <div className="panel ai">
          <div className="panelHead">
            <h2>
              AI Operations Brief
            </h2>

            <span className="pill">
              LIVE PRIORITY
            </span>
          </div>

          <p className="muted">
            أهم 3 أشياء لازم تضل قدامك:
          </p>

          <ol className="brief">
            {aiBrief.map(
              (item, index) => (
                <li key={index}>
                  {item}
                </li>
              )
            )}
          </ol>

          <div className="quick">
            <input
              value={quickTask}
              onChange={e =>
                setQuickTask(
                  e.target.value
                )
              }
              onKeyDown={e => {
                if (
                  e.key === 'Enter'
                ) {
                  addTask()
                }
              }}
              placeholder="مثال: تصوير WATAD الخميس"
            />

            <button
              onClick={addTask}
              disabled={addingTask}
            >
              {addingTask
                ? 'جاري الإضافة...'
                : '+ أضف مهمة'}
            </button>
          </div>
        </div>

        <div className="panel">
          <div className="panelHead">
            <h2>
              الضغط التشغيلي
            </h2>

            <span className="pill orange">
              LOAD
            </span>
          </div>

          <div className="loadrow">
            <span>
              بوستات DH GROWTH شهرياً
            </span>

            <b>
              {growthClients *
                growthPackage.posts}
            </b>
          </div>

          <div className="loadrow">
            <span>
              ريلز DH GROWTH شهرياً
            </span>

            <b>
              {growthClients *
                growthPackage.reels}
            </b>
          </div>

          <div className="loadrow">
            <span>
              ستوري يومي
            </span>

            <b>
              {growthClients} حسابات
            </b>
          </div>

          <div className="loadrow">
            <span>
              إدارة حملات ومتابعة
            </span>

            <b>يومي</b>
          </div>

          <p className="note">
            الأرقام محسوبة تلقائياً من
            العملاء الموجودين في قاعدة
            البيانات.
          </p>
        </div>
      </section>

      <section className="panel">
        <div className="panelHead">
          <h2>المهام</h2>

          <div className="filters">
            <button
              className={
                filter === 'all'
                  ? 'active'
                  : ''
              }
              onClick={() =>
                setFilter('all')
              }
            >
              الكل
            </button>

            <button
              className={
                filter === 'today'
                  ? 'active'
                  : ''
              }
              onClick={() =>
                setFilter('today')
              }
            >
              اليوم
            </button>

            <button
              className={
                filter === 'urgent'
                  ? 'active'
                  : ''
              }
              onClick={() =>
                setFilter('urgent')
              }
            >
              حرجة
            </button>
          </div>
        </div>

        <div className="tasks">
          {visibleTasks.length === 0 && (
            <p className="muted">
              لا توجد مهام بهذا التصنيف.
            </p>
          )}

          {visibleTasks.map(task => (
            <label
              key={task.id}
              className={`task ${
                task.done
                  ? 'done'
                  : ''
              }`}
            >
              <input
                type="checkbox"
                checked={task.done}
                onChange={() =>
                  toggle(task.id)
                }
              />

              <div className="taskText">
                <b>{task.text}</b>

                <span>
                  {task.client} •{' '}
                  {task.due}
                </span>
              </div>

              <span
                className={`priority ${task.priority}`}
              >
                {task.priority ===
                'high'
                  ? 'HIGH'
                  : task.priority ===
                    'medium'
                  ? 'MED'
                  : 'NORMAL'}
              </span>
            </label>
          ))}
        </div>
      </section>

      <section className="panel">
        <div className="panelHead">
          <h2>
            العملاء والعقود
          </h2>

          <span className="pill">
            CLIENT HEALTH
          </span>
        </div>

        <div className="clients">
          {clients.map(client => {
            const clientHealth =
              health(client, today)

            return (
              <article
                className="client"
                key={client.id}
              >
                <div className="clientTop">
                  <div>
                    <h3>
                      {client.name}
                    </h3>

                    <span>
                      {client.package_name ||
                        'بدون باقة'}
                    </span>
                  </div>

                  <div
                    className={`score ${
                      clientHealth < 80
                        ? 'low'
                        : ''
                    }`}
                  >
                    {clientHealth}
                  </div>
                </div>

                <p>
                  {client.notes ||
                    'لا توجد ملاحظات'}
                </p>

                <div className="dates">
                  <span>
                    من{' '}
                    {client.start_date ||
                      'غير محدد'}
                  </span>

                  <span>
                    إلى{' '}
                    {client.end_date ||
                      'غير محدد'}
                  </span>
                </div>

                {(client.outstanding ??
                  0) > 0 && (
                  <div className="money">
                    متبقي{' '}
                    {client.outstanding}{' '}
                    JD
                  </div>
                )}

                {client.package_name ===
                  'DH GROWTH' && (
                  <div className="quota">
                    {
                      growthPackage.posts
                    }{' '}
                    Posts •{' '}
                    {
                      growthPackage.reels
                    }{' '}
                    Reels • Daily Story
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

          <small>
            DH AGENCY
          </small>
        </div>
      </footer>
    </main>
  )
}
