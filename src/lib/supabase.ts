import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

export const isConfigured = Boolean(url && anonKey && !url.includes('DEIN-PROJEKT'))

if (!isConfigured) {
  // Deutliche Warnung in der Konsole, damit der Setup-Schritt nicht vergessen wird.
  console.warn(
    '[Supabase] Nicht konfiguriert. Bitte .env aus .env.example anlegen und ' +
      'VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY setzen.',
  )
}

// Fallback-Werte verhindern einen harten Crash, wenn .env fehlt — die UI
// zeigt stattdessen einen Konfigurations-Hinweis (siehe isConfigured).
export const supabase = createClient(
  url || 'https://placeholder.supabase.co',
  anonKey || 'placeholder-anon-key',
  {
    realtime: { params: { eventsPerSecond: 20 } },
  },
)
