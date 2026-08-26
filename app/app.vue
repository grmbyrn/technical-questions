<script setup lang="ts">
const { data: sections } = await useSections();

const route = useRoute();
const router = useRouter();
const navOpen = ref(false);

/** Sidebar entries with a group heading inserted whenever the group changes. */
const navItems = computed(() => {
  const out: Array<{ heading?: string; section?: any }> = [];
  let group: string | null = null;
  for (const s of sections.value ?? []) {
    if (s.group !== group) {
      group = s.group;
      out.push({ heading: group });
    }
    out.push({ section: s });
  }
  return out;
});

const answered = computed(
  () => (sections.value ?? []).filter((s) => s.status === "answered").length,
);
const total = computed(() => (sections.value ?? []).length);
const pct = computed(() =>
  total.value ? ((answered.value / total.value) * 100).toFixed(1) : "0",
);

const currentIndex = computed(() =>
  (sections.value ?? []).findIndex((s) => `/${s.slug}` === route.path),
);
const current = computed(() => (sections.value ?? [])[currentIndex.value]);

// close the drawer on navigation
watch(() => route.fullPath, () => (navOpen.value = false));

// the drawer CSS keys off body.navopen (it also locks body scroll), so the
// class has to land on <body>, not on a wrapper element
useHead({
  bodyAttrs: { class: computed(() => (navOpen.value ? "navopen" : "")) },
});

/** The title shown in the mobile top bar: a section, or a standalone page. */
const pageTitle = computed(() => {
  if (current.value) return `${current.value.number}. ${current.value.title}`;
  if (route.path.startsWith("/flashcards")) return "Flashcards";
  return "Interview Prep";
});

function step(delta: number) {
  const list = sections.value ?? [];
  // off the section list entirely (flashcards, 404) — j/k means nothing there
  if (currentIndex.value < 0) return;
  const next = list[currentIndex.value + delta];
  if (next) router.push(`/${next.slug}`);
}

function onKey(e: KeyboardEvent) {
  if (e.key === "Escape") return (navOpen.value = false);
  if (e.metaKey || e.ctrlKey) return;
  if ((e.target as HTMLElement)?.tagName === "INPUT") return;
  if (e.key === "j" || (e.key === "ArrowDown" && e.shiftKey)) step(1);
  if (e.key === "k" || (e.key === "ArrowUp" && e.shiftKey)) step(-1);
}

onMounted(() => document.addEventListener("keydown", onKey));
onBeforeUnmount(() => document.removeEventListener("keydown", onKey));
</script>

<template>
  <div>
    <header class="topbar">
      <button
        class="menubtn"
        aria-label="Open topics"
        :aria-expanded="navOpen ? 'true' : 'false'"
        @click="navOpen = !navOpen"
      >
        <span class="bars" />
      </button>
      <span class="topbar-title">{{ pageTitle }}</span>
    </header>

    <div v-show="navOpen" class="scrim" @click="navOpen = false" />

    <div class="layout">
      <aside>
        <!-- sticky on mobile, plain header on desktop -->
        <div class="drawer-head">
          <div>
            <div class="brand">Interview Prep</div>
            <div class="progress">
              <div class="pbar">
                <div class="pfill" :style="{ width: `${pct}%` }" />
              </div>
              <div class="pnum">
                {{ answered }} of {{ total }} sections answered
              </div>
            </div>
          </div>
          <button class="closebtn" aria-label="Close topics" @click="navOpen = false">
            &times;
          </button>
        </div>
        <nav>
          <div class="navgroup">Practice</div>
          <NuxtLink class="navlink answered" active-class="active" to="/flashcards">
            <span class="dot flash" />
            Flashcards
          </NuxtLink>

          <template v-for="(item, i) in navItems" :key="i">
            <div v-if="item.heading" class="navgroup">{{ item.heading }}</div>
            <NuxtLink
              v-else
              class="navlink"
              :class="{ answered: item.section.status === 'answered' }"
              active-class="active"
              :to="`/${item.section.slug}`"
            >
              <span class="dot" :class="{ on: item.section.status === 'answered' }" />
              {{ item.section.number }}. {{ item.section.title }}
            </NuxtLink>
          </template>
        </nav>
      </aside>

      <main>
        <NuxtPage />
      </main>
    </div>
  </div>
</template>
