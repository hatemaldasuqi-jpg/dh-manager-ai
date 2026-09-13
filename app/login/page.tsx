'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '../../lib/supabase'
export default function Login(){
 const router=useRouter(); const [email,setEmail]=useState('');const [password,setPassword]=useState('');const [busy,setBusy]=useState(false)
 const login=async()=>{setBusy(true);const {error}=await supabase.auth.signInWithPassword({email,password});setBusy(false);if(error)return alert(error.message);router.replace('/')}
 return <main className="shell" style={{maxWidth:460,paddingTop:80}}><div className="panel" style={{textAlign:'center'}}><img className="brandLogo" src="/dh-agency-logo.jpeg" alt="DH Agency"/><h1>DH Manager <span>AI</span></h1><p>Owner Login</p><div className="form" style={{gridTemplateColumns:'1fr'}}><input placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)}/><input type="password" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==='Enter'&&login()}/><button onClick={login} disabled={busy}>{busy?'جاري الدخول...':'تسجيل الدخول'}</button></div></div></main>
}