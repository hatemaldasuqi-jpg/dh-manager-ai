'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const login = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError('الإيميل أو كلمة المرور غير صحيحة')
      setLoading(false)
      return
    }

    router.push('/')
    router.refresh()
  }

  return (
    <main className="loginShell">
      <form className="loginCard" onSubmit={login}>
        <img
          src="/dh-agency-logo.jpeg"
          alt="DH Agency"
          className="loginLogo"
        />

        <h1>DH Manager AI</h1>
        <p>تسجيل دخول المالك</p>

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
        />

        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          required
        />

        {error && <div className="loginError">{error}</div>}

        <button type="submit" disabled={loading}>
          {loading ? 'جاري الدخول...' : 'دخول'}
        </button>
      </form>
    </main>
  )
}
