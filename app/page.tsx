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

type ContentProgress = {
  id: string
  client_id: string
  posts_done: number
  reels_done: number
  stories_done: number
}

type Priority = 'high' | 'medium' | 'normal'

type Task = {
  id: string
  text: string
  client: string
  clientId: string | null
  due: string
  priority: Priority
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
): Priority {
  if (priority === 'high') return 'high'
  if (priority === 'medium') return 'medium'

  return 'normal'
}

export default function Home() {
  const router = useRouter()
  const today = localDateISO()

  const [checkingAuth, setCheckingAuth] =
    useState(true)

  const [loadingData, setLoadingData] =
    useState(true)

  const [clients, setClients] =
    useState<Client[]>([])

  const [tasks, setTasks] =
    useState<Task[]>([])

  const [contentProgress, setContentProgress] =
    useState<ContentProgress[]>([])

  const [taskTitle, setTaskTitle] =
    useState('')

  const [taskClientId, setTaskClientId] =
    useState('general')

  const [taskDate, setTaskDate] =
    useState(today)

  const [taskPriority, setTaskPriority] =
    useState<Priority>('normal')

  const [savingTask, setSavingTask] =
    useState(false)

  const [editingTaskId, setEditingTaskId] =
    useState<string | null>(null)

  const [filter, setFilter] =
    useState<'all' | 'today' | 'urgent'>('all')

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
        clientsResponse,
        tasksResponse,
        contentResponse,
      ] = await Promise.all([
        supabase
          .from('clients')
          .select('*'),

        supabase
          .from('tasks')
          .select('*')
          .order('due_date', {
            ascending: true,
          }),

        supabase
          .from('content_progress')
          .select('*'),
      ])

      if (clientsResponse.error) {
        alert(
          `Clients Error:\n${clientsResponse.error.message}`
        )
      }

      if (tasksResponse.error) {
        alert(
          `Tasks Error:\n${tasksResponse.error.message}`
        )
      }

      if (contentResponse.error) {
        alert(
          `Content Tracker Error:\n${contentResponse.error.message}`
        )
      }

      const loadedClients: Client[] =
        clientsResponse.data || []

      setClients(loadedClients)

      setContentProgress(
        (contentResponse.data || []) as ContentProgress[]
      )

      const clientMap = new Map(
        loadedClients.map(client => [
          String(client.id),
          client.name,
        ])
      )

      const loadedTasks: Task[] = (
        (tasksResponse.data || []) as DbTask[]
      ).map(task => ({
        id: String(task.id),

        text: task.title,

        client: task.client_id
          ? clientMap.get(
              String(task.client_id)
            ) || 'GENERAL'
          : 'GENERAL',

        clientId: task.client_id
          ? String(task.client_id)
          : null,

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
  }, [router])

  const outstanding = clients.reduce(
    (sum, client) =>
      sum +
      Number(client.outstanding ?? 0),
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
  )

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
    const priorityTasks = tasks
      .filter(
        task =>
          !task.done &&
          task.priority === 'high'
      )
      .sort((a, b) =>
        a.due.localeCompare(b.due)
      )
      .slice(0, 3)
      .map(
        task =>
          `${task.client}: ${task.text}`
      )

    return priorityTasks.length
      ? priorityTasks
      : [
          'لا توجد مهام حرجة حالياً. تابع الحملات والمحتوى اليومي.',
        ]
  }, [tasks])

  const resetTaskForm = () => {
    setTaskTitle('')
    setTaskClientId('general')
    setTaskDate(today)
    setTaskPriority('normal')
    setEditingTaskId(null)
  }

  const saveTask = async () => {
    const title = taskTitle.trim()

    if (!title || savingTask) return

    setSavingTask(true)

    const payload = {
      client_id:
        taskClientId === 'general'
          ? null
          : taskClientId,

      title,

      description: null,

      due_date: taskDate,

      priority: taskPriority,

      status: 'pending',
    }

    if (editingTaskId) {
      const { data, error } =
        await supabase
          .from('tasks')
          .update({
            client_id:
              payload.client_id,

            title: payload.title,

            due_date:
              payload.due_date,

            priority:
              payload.priority,
          })
          .eq('id', editingTaskId)
          .select()
          .single()

      if (error) {
        alert(
          `Update Error:\n${error.message}`
        )

        setSavingTask(false)
        return
      }

      const clientName =
        payload.client_id
          ? clients.find(
              client =>
                String(client.id) ===
                String(
                  payload.client_id
                )
            )?.name || 'GENERAL'
          : 'GENERAL'

      setTasks(prev =>
        prev.map(task =>
          task.id === editingTaskId
            ? {
                ...task,

                text: data.title,

                client: clientName,

                clientId:
                  data.client_id
                    ? String(
                        data.client_id
                      )
                    : null,

                due:
                  data.due_date ||
                  today,

                priority:
                  normalizePriority(
                    data.priority
                  ),
              }
            : task
        )
      )

      resetTaskForm()
      setSavingTask(false)
      return
    }

    const { data, error } =
      await supabase
        .from('tasks')
        .insert(payload)
        .select()
        .single()

    if (error) {
      alert(
        `Supabase Error:\n${error.message}`
      )

      setSavingTask(false)
      return
    }

    const clientName =
      data.client_id
        ? clients.find(
            client =>
              String(client.id) ===
              String(data.client_id)
          )?.name || 'GENERAL'
        : 'GENERAL'

    const newTask: Task = {
      id: String(data.id),

      text: data.title,

      client: clientName,

      clientId: data.client_id
        ? String(data.client_id)
        : null,

      due: data.due_date || today,

      priority:
        normalizePriority(
          data.priority
        ),

      done: false,
    }

    setTasks(prev => [
      newTask,
      ...prev,
    ])

    resetTaskForm()
    setSavingTask(false)
  }

  const startEditTask = (
    task: Task
  ) => {
    setEditingTaskId(task.id)
    setTaskTitle(task.text)

    setTaskClientId(
      task.clientId || 'general'
    )

    setTaskDate(task.due)
    setTaskPriority(task.priority)

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  const toggleTask = async (
    id: string
  ) => {
    const currentTask =
      tasks.find(
        task => task.id === id
      )

    if (!currentTask) return

    const newDone =
      !currentTask.done

    const { error } =
      await supabase
        .from('tasks')
        .update({
          status: newDone
            ? 'completed'
            : 'pending',
        })
        .eq('id', id)

    if (error) {
      alert(
        `Update Error:\n${error.message}`
      )

      return
    }

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
  }

  const deleteTask = async (
    task: Task
  ) => {
    const confirmed =
      window.confirm(
        `حذف المهمة؟\n\n${task.text}`
      )

    if (!confirmed) return

    const { error } =
      await supabase
        .from('tasks')
        .delete()
        .eq('id', task.id)

    if (error) {
      alert(
        `Delete Error:\n${error.message}`
      )

      return
    }

    setTasks(prev =>
      prev.filter(
        item =>
          item.id !== task.id
      )
    )

    if (
      editingTaskId === task.id
    ) {
      resetTaskForm()
    }
  }

  const getProgress = (
    clientId: string
  ) => {
    return (
      contentProgress.find(
        item =>
          String(item.client_id) ===
          String(clientId)
      ) || null
    )
  }

  const updateContent = async (
    clientId: string,
    field:
      | 'posts_done'
      | 'reels_done'
      | 'stories_done',
    change: number
  ) => {
    const current =
      getProgress(clientId)

    const currentPosts =
      current?.posts_done || 0

    const currentReels =
      current?.reels_done || 0

    const currentStories =
      current?.stories_done || 0

    let newPosts = currentPosts
    let newReels = currentReels
    let newStories = currentStories

    if (field === 'posts_done') {
      newPosts = Math.max(
        0,
        currentPosts + change
      )
    }

    if (field === 'reels_done') {
      newReels = Math.max(
        0,
        currentReels + change
      )
    }

    if (field === 'stories_done') {
      newStories = Math.max(
        0,
        currentStories + change
      )
    }

    if (current) {
      const { data, error } =
        await supabase
          .from('content_progress')
          .update({
            posts_done: newPosts,
            reels_done: newReels,
            stories_done: newStories,
            updated_at:
              new Date().toISOString(),
          })
          .eq('id', current.id)
          .select()
          .single()

      if (error) {
        alert(
          `Content Update Error:\n${error.message}`
        )

        return
      }

      setContentProgress(prev =>
        prev.map(item =>
          item.id === current.id
            ? data
            : item
        )
      )

      return
    }

    const { data, error } =
      await supabase
        .from('content_progress')
        .insert({
          client_id: clientId,
          posts_done: newPosts,
          reels_done: newReels,
          stories_done: newStories,
        })
        .select()
        .single()

    if (error) {
      alert(
        `Content Insert Error:\n${error.message}`
      )

      return
    }

    setContentProgress(prev => [
      ...prev,
      data,
    ])
  }

  const completionPercent = (
    progress: ContentProgress | null
  ) => {
    const posts =
      Math.min(
        progress?.posts_done || 0,
        growthPackage.posts
      )

    const reels =
      Math.min(
        progress?.reels_done || 0,
        growthPackage.reels
      )

    const totalTarget =
      growthPackage.posts +
      growthPackage.reels

    const completed =
      posts + reels

    return Math.round(
      (completed / totalTarget) *
        100
    )
  }

  const logout = async () => {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  if (
    checkingAuth ||
    loadingData
  ) {
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
              لوحة تشغيل يومية تمنع
              التراكم قبل ما يصير مشكلة.
            </p>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 10,
            alignItems: 'center',
          }}
        >
          <div className="datebox">
            <b>{today}</b>
            <span>اليوم</span>
          </div>

          <button
            onClick={logout}
          >
            تسجيل خروج
          </button>
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
          <small>
            مهام حرجة
          </small>

          <strong>
            {urgentCount}
          </strong>

          <span>
            تحتاج انتباه سريع
          </span>
        </div>

        <div className="metric warn">
          <small>
            مستحقات
          </small>

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
            الهدف المالي
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
            أهم المهام الحرجة الحالية:
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
              {growthClients.length *
                growthPackage.posts}
            </b>
          </div>

          <div className="loadrow">
            <span>
              ريلز DH GROWTH شهرياً
            </span>

            <b>
              {growthClients.length *
                growthPackage.reels}
            </b>
          </div>

          <div className="loadrow">
            <span>
              ستوري يومي
            </span>

            <b>
              {growthClients.length}{' '}
              حسابات
            </b>
          </div>

          <div className="loadrow">
            <span>
              إدارة حملات ومتابعة
            </span>

            <b>يومي</b>
          </div>
        </div>
      </section>

      <section className="panel">
        <div className="panelHead">
          <h2>
            Content Tracker
          </h2>

          <span className="pill">
            CONTENT PROGRESS
          </span>
        </div>

        <p className="muted">
          تابع إنجاز محتوى كل عميل
          DH GROWTH.
        </p>

        <div
          style={{
            display: 'grid',
            gap: 14,
            marginTop: 15,
          }}
        >
          {growthClients.map(
            client => {
              const progress =
                getProgress(
                  client.id
                )

              const posts =
                progress?.posts_done ||
                0

              const reels =
                progress?.reels_done ||
                0

              const stories =
                progress?.stories_done ||
                0

              const percent =
                completionPercent(
                  progress
                )

              return (
                <article
                  key={client.id}
                  className="client"
                >
                  <div className="clientTop">
                    <div>
                      <h3>
                        {client.name}
                      </h3>

                      <span>
                        DH GROWTH
                      </span>
                    </div>

                    <div className="score">
                      {percent}%
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns:
                        'repeat(auto-fit, minmax(150px, 1fr))',
                      gap: 12,
                      marginTop: 15,
                    }}
                  >
                    <div className="loadrow">
                      <span>
                        Posts
                      </span>

                      <b>
                        {posts}/
                        {
                          growthPackage.posts
                        }
                      </b>

                      <div
                        style={{
                          display:
                            'flex',
                          gap: 6,
                        }}
                      >
                        <button
                          onClick={() =>
                            updateContent(
                              client.id,
                              'posts_done',
                              -1
                            )
                          }
                        >
                          −
                        </button>

                        <button
                          onClick={() =>
                            updateContent(
                              client.id,
                              'posts_done',
                              1
                            )
                          }
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="loadrow">
                      <span>
                        Reels
                      </span>

                      <b>
                        {reels}/
                        {
                          growthPackage.reels
                        }
                      </b>

                      <div
                        style={{
                          display:
                            'flex',
                          gap: 6,
                        }}
                      >
                        <button
                          onClick={() =>
                            updateContent(
                              client.id,
                              'reels_done',
                              -1
                            )
                          }
                        >
                          −
                        </button>

                        <button
                          onClick={() =>
                            updateContent(
                              client.id,
                              'reels_done',
                              1
                            )
                          }
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="loadrow">
                      <span>
                        Stories
                      </span>

                      <b>
                        {stories}
                      </b>

                      <div
                        style={{
                          display:
                            'flex',
                          gap: 6,
                        }}
                      >
                        <button
                          onClick={() =>
                            updateContent(
                              client.id,
                              'stories_done',
                              -1
                            )
                          }
                        >
                          −
                        </button>

                        <button
                          onClick={() =>
                            updateContent(
                              client.id,
                              'stories_done',
                              1
                            )
                          }
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>

                  <div
                    style={{
                      marginTop: 15,
                      height: 10,
                      borderRadius: 20,
                      overflow: 'hidden',
                      background:
                        'rgba(255,255,255,0.08)',
                    }}
                  >
                    <div
                      style={{
                        width: `${percent}%`,
                        height: '100%',
                        background:
                          'linear-gradient(90deg,#1677ff,#51a3ff)',
                        transition:
                          '0.25s ease',
                      }}
                    />
                  </div>
                </article>
              )
            }
          )}
        </div>
      </section>

      <section className="panel">
        <div className="panelHead">
          <h2>
            {editingTaskId
              ? 'تعديل المهمة'
              : 'إضافة مهمة جديدة'}
          </h2>

          {editingTaskId && (
            <button
              onClick={
                resetTaskForm
              }
            >
              إلغاء التعديل
            </button>
          )}
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns:
              'repeat(auto-fit, minmax(160px, 1fr))',
            gap: 10,
            marginTop: 15,
          }}
        >
          <input
            value={taskTitle}
            onChange={e =>
              setTaskTitle(
                e.target.value
              )
            }
            placeholder="اسم المهمة"
          />

          <select
            value={taskClientId}
            onChange={e =>
              setTaskClientId(
                e.target.value
              )
            }
          >
            <option value="general">
              مهمة عامة
            </option>

            {clients.map(client => (
              <option
                key={client.id}
                value={client.id}
              >
                {client.name}
              </option>
            ))}
          </select>

          <input
            type="date"
            value={taskDate}
            onChange={e =>
              setTaskDate(
                e.target.value
              )
            }
          />

          <select
            value={taskPriority}
            onChange={e =>
              setTaskPriority(
                e.target.value as Priority
              )
            }
          >
            <option value="normal">
              Normal
            </option>

            <option value="medium">
              Medium
            </option>

            <option value="high">
              High
            </option>
          </select>

          <button
            onClick={saveTask}
            disabled={savingTask}
          >
            {savingTask
              ? 'جاري الحفظ...'
              : editingTaskId
              ? 'حفظ التعديل'
              : '+ إضافة المهمة'}
          </button>
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
          {visibleTasks.length ===
            0 && (
            <p className="muted">
              لا توجد مهام بهذا
              التصنيف.
            </p>
          )}

          {visibleTasks.map(
            task => (
              <div
                key={task.id}
                className={`task ${
                  task.done
                    ? 'done'
                    : ''
                }`}
              >
                <input
                  type="checkbox"
                  checked={
                    task.done
                  }
                  onChange={() =>
                    toggleTask(
                      task.id
                    )
                  }
                />

                <div className="taskText">
                  <b>
                    {task.text}
                  </b>

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

                <button
                  onClick={() =>
                    startEditTask(
                      task
                    )
                  }
                >
                  تعديل
                </button>

                <button
                  onClick={() =>
                    deleteTask(task)
                  }
                >
                  حذف
                </button>
              </div>
            )
          )}
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
              health(
                client,
                today
              )

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
                      clientHealth <
                      80
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
                    {
                      client.outstanding
                    }{' '}
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
