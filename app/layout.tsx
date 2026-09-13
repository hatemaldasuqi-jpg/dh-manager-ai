import './globals.css'
export const metadata = { title: 'DH Manager AI', description: 'DH Agency Operations Manager' }
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="ar" dir="rtl"><body>{children}</body></html>
}
