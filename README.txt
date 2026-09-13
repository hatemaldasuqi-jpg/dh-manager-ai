AI UPDATE — 2 files + 3 small inserts

Upload:
app/api/ai/route.ts
components/DHAIManager.tsx

In app/page.tsx add at top:
import DHAIManager from '../components/DHAIManager'

Inside Home(), after financial totals/goal variables, add:
const aiContext={today,clients,packages,tasks,contentProgress:progress,financialTransactions:txs,appointments:appts,summary:{income,expenses,netProfit:profit,outstanding,savingsGoal:goal}}

Inside the overview section, before Client Health, add:
<DHAIManager context={aiContext}/>

At the end of app/globals.css add:
.aiManager p{margin:5px 0 0}.aiQuick{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0}.aiAsk{display:grid;grid-template-columns:1fr auto;gap:9px}.aiAsk textarea{width:100%;resize:vertical;background:#0a111f;color:white;border:1px solid #263651;border-radius:12px;padding:12px;font:inherit}.aiAnswer{white-space:pre-wrap;line-height:1.9;background:#08111f;border:1px solid #23436d;border-radius:14px;padding:15px;margin-top:12px}@media(max-width:720px){.aiAsk{grid-template-columns:1fr}.aiAsk button{width:100%}}

Keep OPENAI_API_KEY only in Vercel Secret Environment Variables. Never put it in GitHub or NEXT_PUBLIC_.
