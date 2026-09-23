import { NextResponse } from 'next/server'

const SYSTEM = `You are DH ADS MEDIA, the paid advertising strategist inside DH Agency's internal manager.
Your job is to create practical Meta Ads campaign plans and diagnose campaign performance.
Be commercially useful, specific, concise, and evidence-aware. Never promise results. Do not invent performance data.
LANGUAGE RULE: The product is Arabic-first. Understand Modern Standard Arabic and Jordanian/Levantine colloquial Arabic naturally, including mixed Arabic-English advertising terminology. If the user's input is mainly Arabic, every human-readable value in the JSON response MUST be in clear Arabic, while keeping standard ad abbreviations such as CTR, CPM, CPC, CPA, ROAS, Ad Set and Creative in English when useful. If the input is mainly English, answer in English. Never transliterate Arabic into Latin letters.
For campaign plans, return: objective, campaignStructure, targeting, budget, productVisualAnalysis, creatives, copies, testingRule, launchChecklist. If product/service images are supplied, inspect them carefully and ground productVisualAnalysis and creative recommendations in what is actually visible. Read visible packaging/text when legible, but do not invent claims, ingredients, prices, certifications, or features that are not visible or supplied by the user.
For analysis, use the supplied metrics, explain uncertainty when sample size is weak, and return: action, diagnosis, metrics, nextSteps.
Prefer testing creative/offer systematically rather than making many simultaneous changes. Output valid JSON only, no markdown.`

function extractText(data:any){
  if (typeof data?.output_text === 'string') return data.output_text
  const chunks:any[]=[]
  for (const item of data?.output||[]) for (const c of item?.content||[]) if(c?.type==='output_text' && c?.text) chunks.push(c.text)
  return chunks.join('\n')
}

export async function POST(req:Request){
  try{
    if(!process.env.OPENAI_API_KEY) return NextResponse.json({error:'OPENAI_API_KEY is not configured on Vercel.'},{status:500})
    const body=await req.json()
    const mode=body?.mode==='analyze'?'analyze':'build'
    const cleanData={...(body.data||{})}
    const imageUrls=Array.isArray(cleanData.imageUrls)?cleanData.imageUrls.slice(0,4):[]
    delete cleanData.imageUrls
    const payload=mode==='build'
      ? `Create a Meta Ads campaign blueprint from this input. Detect the user's language and follow the LANGUAGE RULE exactly. ${imageUrls.length?'Product/service reference images are attached; analyze them visually and use only visible or user-supplied facts.':''}\n${JSON.stringify(cleanData)}`
      : `Analyze this Meta Ads campaign. Detect the user's language, follow the LANGUAGE RULE exactly, and base decisions only on the supplied numbers and context:\n${JSON.stringify(cleanData)}`
    const content:any[]=[{type:'input_text',text:payload}]
    if(mode==='build') for(const image_url of imageUrls) content.push({type:'input_image',image_url,detail:'high'})
    const r=await fetch('https://api.openai.com/v1/responses',{
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':`Bearer ${process.env.OPENAI_API_KEY}`},
      body:JSON.stringify({model:process.env.OPENAI_MODEL||'gpt-5.6-luna',instructions:SYSTEM,input:[{role:'user',content}],reasoning:{effort:'medium'},max_output_tokens:2600})
    })
    const data=await r.json()
    if(!r.ok) return NextResponse.json({error:data?.error?.message||'OpenAI request failed'},{status:r.status})
    const text=extractText(data)
    try{return NextResponse.json({result:JSON.parse(text)})}
    catch{return NextResponse.json({result:{raw:text}})}
  }catch(e:any){return NextResponse.json({error:e?.message||'Unexpected server error'},{status:500})}
}
