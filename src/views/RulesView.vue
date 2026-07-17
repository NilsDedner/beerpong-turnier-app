<script setup lang="ts">
import NavMenu from '@/components/NavMenu.vue'

interface Rule {
  title: string
  body: string
}

const rules: Rule[] = [
  {
    title: 'Direktwurf',
    body: 'Der Ball wird direkt ohne Tischberührung geworfen. Abwehren ist verboten, Verstöße führen zu drei Strafwürfen. Wenn der Ball in einem getroffenen Becher „herumkreiselt", darf dieser nicht durch Pusten oder mit den Fingern abgewehrt werden. Wird ein Becher durch einen Wurf umgestoßen, wird dieser erneut aufgefüllt und bleibt im Spiel.',
  },
  {
    title: 'Gleichzeitiger Treffer – zwei Becher',
    body: 'Treffen zwei Spieler gleichzeitig, werden beide Becher ausgetrunken und entfernt. „Balls Back" folgt.',
  },
  {
    title: 'Gleichzeitiger Treffer – ein Becher',
    body: 'Treffen beide Spieler denselben Becher, müssen auch alle angrenzenden Becher getrunken werden. „Balls Back" folgt.',
  },
  {
    title: 'Bounce',
    body: 'Der Ball springt auf dem Tisch auf, bevor er den Becher trifft. Das Abwehren ist erlaubt. Gelingt der Treffer, müssen zwei Becher getrunken werden. Fallen Becher um, werden sie entfernt.',
  },
  {
    title: 'Trickshot',
    body: 'Rollt der Ball über die Mittellinie zurück und berührt dabei die eigene Tischhälfte, darf ein Trickshot geworfen werden. Bei einem Treffer müssen zwei Becher getrunken werden.',
  },
  {
    title: 'Zusammenstellen',
    body: 'Einmal pro Runde darf das Team die Becher zusammenstellen. Dies ist nicht beim „Balls Back" erlaubt.',
  },
  {
    title: 'Fair Play!',
    body: 'Kommt es während dem Spiel zu einer strittigen Situation, sollten beide Teams versuchen, eine Lösung zu finden, die für beide Seiten akzeptabel ist.',
  },
]
</script>

<template>
  <div class="min-h-screen">
    <header class="flex items-center gap-3 px-6 py-4 border-b border-neutral-900">
      <NavMenu />
      <span class="text-3xl">📖</span>
      <h1 class="font-display text-4xl tracking-wide text-beer-400">Spielregeln</h1>
    </header>

    <main class="max-w-3xl mx-auto px-6 py-8">
      <div class="bg-beer-500/10 border border-beer-600/40 rounded-xl px-5 py-4 mb-8 text-center">
        <div class="text-neutral-300 text-sm uppercase tracking-widest mb-1">Grundregel bei jedem Wurf</div>
        <div class="font-display text-2xl tracking-wide text-beer-300">
          Der Ellenbogen bleibt hinter der Platte!
        </div>
      </div>

      <div class="space-y-4">
        <section
          v-for="rule in rules"
          :key="rule.title"
          class="bg-neutral-900 border border-neutral-800 rounded-xl p-5"
        >
          <h2 class="font-display text-2xl tracking-wide text-beer-400 mb-1.5">{{ rule.title }}</h2>
          <p class="text-neutral-200 leading-relaxed">{{ rule.body }}</p>
        </section>
      </div>

      <p class="text-center text-neutral-600 text-sm mt-8">🍻 Viel Erfolg &amp; trinkt verantwortungsvoll.</p>
    </main>
  </div>
</template>
