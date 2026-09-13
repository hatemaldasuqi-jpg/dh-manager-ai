import { NextResponse } from 'next/server'
export const runtime='nodejs'
export async function POST(req:Request){
 try{
  const key=process.env.OPENAI_API_KEY
  if(!key)return NextResponse.json({error:'OPENAI_API_KEY غير موجود في Vercel.'},{status:500})
  const {question,context}=await req.json()
  if(!question?.trim())return NextResponse.json({error:'اكتب سؤالك أولاً.'},{status:400})
  const r=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({
   model:'gpt-5.6-luna',
   instructions:'أنت مدير العمليات الذكي لشركة DH Agency. أجب بالعربية بشكل مباشر ومهني. اعتمد فقط على بيانات النظام المرسلة ولا تخترع دفعات أو مواعيد أو أرصدة. رتّب الأولويات حسب التأخير والمواعيد والمهام والمستحقات وتقدم المحتوى ونهاية العقود. إذا كانت معلومة غير مسجلة فقل ذلك.',
   input:`السؤال:\n${question}\n\nبيانات DH Manager AI:\n${JSON.stringify(context)}`,
   reasoning:{effort:'low'},max_output_tokens:1200
  })})
  const d=await r.json()
  if(!r.ok)return NextResponse.json({error:d?.error?.code==='insufficient_quota'?'رصيد OpenAI API غير كافٍ. أضف Credits من OpenAI Platform.':d?.error?.message||'تعذر الاتصال بـ OpenAI.'},{status:r.status})
  const answer=d.output_text||d?.output?.flatMap((x:any)=>x.content||[]).filter((x:any)=>x.type==='output_text').map((x:any)=>x.text).join('\n')||'لم يصل رد نصي.'
  return NextResponse.json({answer})
 }catch(e){return NextResponse.json({error:'حدث خطأ في DH AI.'},{status:500})}
}