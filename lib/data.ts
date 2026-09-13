export type Client = {
  name: string
  packageName: string
  start: string
  end: string
  status: 'active' | 'launch' | 'website'
  outstanding: number
  notes: string
}

export const clients: Client[] = [
  { name: 'VELVET WEDDING', packageName: 'DH GROWTH', start: '2026-09-06', end: '2026-11-06', status: 'active', outstanding: 0, notes: 'إدارة يومية + حملات ومتابعة' },
  { name: 'GOLDEN MOBILE', packageName: 'WEBSITE', start: '2026-09-13', end: '2026-09-20', status: 'website', outstanding: 0, notes: 'تسليم الويبسايت بالموعد' },
  { name: 'WATAD BUILDING', packageName: 'DH GROWTH', start: '2026-09-12', end: '2026-10-12', status: 'launch', outstanding: 50, notes: 'لم يبدأ التنفيذ بعد' },
  { name: 'TARAF AMMAN', packageName: 'DH GROWTH', start: '2026-09-13', end: '2026-10-13', status: 'active', outstanding: 0, notes: 'إدارة يومية + حملات ومتابعة' },
  { name: 'MILK THERAPY', packageName: 'DH GROWTH', start: '2026-09-12', end: '2026-10-12', status: 'launch', outstanding: 65, notes: 'لم يبدأ التنفيذ بعد' },
  { name: 'ELEGANCE WEDDING', packageName: 'DH GROWTH', start: '2026-09-09', end: '2026-11-09', status: 'active', outstanding: 0, notes: 'إدارة يومية + حملات ومتابعة' },
  { name: 'PRESS WEDDING', packageName: 'DH GROWTH', start: '2026-09-09', end: '2026-11-09', status: 'active', outstanding: 0, notes: 'إدارة يومية + حملات ومتابعة' },
  { name: 'H&Z MOBILE', packageName: 'DH GROWTH', start: '2026-08-29', end: '2026-09-29', status: 'active', outstanding: 0, notes: 'إدارة يومية + حملات ومتابعة' },
  { name: 'SHEK ALKAR', packageName: 'DH STARTER', start: '2026-09-11', end: '2026-10-11', status: 'active', outstanding: 0, notes: 'إدارة + حملات + تقارير دورية' },
]

export const growthPackage = {
  posts: 10,
  reels: 5,
  storiesPerDay: 1,
}
