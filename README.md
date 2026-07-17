# 🍺🏓 Beer Pong Turnier-App

Verwaltet ein Beerpong-Turnier mit **32 Teams à 2 Personen**:

- **Championship** (KO): 32 → 16 → 8 → 4 → 2 → Sieger
- **Best of the Rest** (KO): die 16 Verlierer der ersten Runde spielen ihr eigenes Turnier
- **Admin-Bereich** (`/admin`): Teams anlegen, auslosen, Ergebnisse eintragen
- **Display-Bereich** (`/display`): Turnierbaum + Ergebnis-Ticker für den Beamer
- **Echtzeit-Sync** über Supabase — Admin am Laptop, Display am Beamer, sofort synchron

Stack: Vue 3 · Vite · TypeScript · Tailwind CSS · Pinia · Supabase · Cloudflare.

> **Sofort ausprobieren ohne Setup:** `npm install && npm run dev` — ohne
> `.env` läuft die App im **lokalen Modus** (Daten im Browser, Sync zwischen
> Tabs). Für getrennte Geräte (Beamer) folgt unten das Supabase-Setup.

---

## 1. Lokal starten

```bash
npm install
npm run dev
```

Läuft auf `http://localhost:5173` (plus Netzwerk-Adresse für ein zweites Gerät).

- Admin: `http://localhost:5173/#/admin`  (Passcode aus `.env`, Default `beerpong`)
- Display: `http://localhost:5173/#/display`

## 2. Supabase einrichten (für Echtzeit-Sync über mehrere Geräte)

1. Auf [supabase.com](https://supabase.com) ein **neues Projekt** anlegen.
2. **DB-Schema ausrollen** — zwei Wege:

   **a) Per Supabase CLI** (empfohlen, wie im RYE-Projekt)
   ```bash
   cp .env.example .env          # SUPABASE_ACCESS_TOKEN + SUPABASE_PROJECT_REF eintragen
   supabase link --project-ref <DEIN-PROJEKT-REF>
   supabase db push              # spielt supabase/migrations/ ein
   ```

   **b) Oder manuell:** Inhalt von
   [`supabase/migrations/20260717000000_init.sql`](supabase/migrations/20260717000000_init.sql)
   im Supabase **SQL-Editor** einfügen und ausführen.

3. `.env` befüllen (Dashboard → **Project Settings → API**):
   - **Project URL** → `VITE_SUPABASE_URL`
   - **Publishable / anon key** → `VITE_SUPABASE_ANON_KEY`
   - `VITE_ADMIN_PASSCODE` frei wählen
4. `npm run dev` neu starten — der blaue „Lokaler Modus"-Banner verschwindet,
   die App synchronisiert jetzt über Supabase.

## 3. Deployment auf Cloudflare (auto-deploy bei Git-Push)

Wie beim RYE-Projekt: **Cloudflare baut & veröffentlicht automatisch bei jedem
Push** auf `main`.

**Einmalige Einrichtung (Cloudflare-Dashboard):**

1. [dash.cloudflare.com](https://dash.cloudflare.com) → **Workers & Pages** →
   **Create** → **Import a repository** → GitHub-Repo `beerpong-turnier-app` wählen.
2. Build-Einstellungen:
   - **Build command:** `npm run build`
   - **Output directory:** `dist`
3. **Environment Variables** setzen (unter Settings → Variables):
   `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_ADMIN_PASSCODE`.
4. **Deploy** — ab jetzt löst jeder `git push` automatisch ein neues Deployment
   aus (Production von `main`, Preview von anderen Branches).

**Alternativ manuell per CLI** (mit `CLOUDFLARE_API_TOKEN` in `.env`):
```bash
npm run build
npx wrangler deploy
```

## 4. Ablauf am Event

1. **Admin öffnen**, Passcode eingeben.
2. Tab **Teams**: 32 Teams anlegen (oder „Demo-Teams auffüllen" zum Testen).
3. **„Auslosen & Turnier starten"** → 16 Erstrunden-Matches erscheinen.
4. Tab **Ergebnisse**: das Sieger-Team antippen. Sieger rücken im Championship
   auf, Verlierer der ersten Runde landen automatisch im „Best of the Rest".
5. **Display** am Beamer öffnen — aktualisiert sich in Echtzeit und wechselt
   automatisch zwischen den beiden Bäumen.

**Fehler korrigieren:** Ein Ergebnis lässt sich ändern, solange kein Folgespiel
entschieden ist. Kompletter Neustart über **Einstellungen → Turnier zurücksetzen**
(Teams bleiben erhalten).

---

## Projektstruktur

```
src/
  lib/bracket.ts       Turnier-Logik (Baum-Generierung, Fortschritts-Zeiger)
  lib/backend.ts       Datenschicht: Supabase (Cloud) oder LocalBackend (offline)
  stores/tournament.ts Pinia-Store: State, Realtime, Aktionen
  views/               Home / Admin / Display
  components/          TeamManager, MatchQueue, BracketView, RecentResults …
supabase/
  config.toml          Supabase-CLI-Konfiguration
  migrations/          DB-Schema (Tabellen, RLS, Realtime)
wrangler.jsonc         Cloudflare-Deploy-Konfiguration
```

## Hinweise

- **Sicherheit:** Der Admin-Passcode ist ein Bequemlichkeitsschutz im Browser,
  keine echte Absicherung. Der Supabase Publishable-/anon-Key ist öffentlich und
  durch Row Level Security abgesichert.
- **Lokaler Modus** (ohne `.env`) speichert alles nur im Browser und synchronisiert
  nur zwischen Tabs desselben Geräts — praktisch zum Ausprobieren.
