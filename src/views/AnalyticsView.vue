<!-- ===================================================================
     ANALYTICS - Mood calendar and statistics
     =================================================================== -->

<script setup>
// ===================================================================
// IMPORTS
// ===================================================================

import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useLanguageStore } from '@/stores/language'
import { supabase } from '@/lib/supabase'
import { MOODS } from '@/lib/moods'

// ===================================================================
// STORE SETUP
// ===================================================================

const auth = useAuthStore()
const lang = useLanguageStore()

// ===================================================================
// STATE
// ===================================================================

const playlists = ref([])
const loading = ref(true)
const errorMessage = ref('')
const currentMonth = ref(new Date())

// ===================================================================
// COMPUTED
// ===================================================================

const moodMap = computed(() => {
  const map = {}
  MOODS.forEach(mood => {
    map[mood.id] = mood
  })
  return map
})

const daysInMonth = computed(() => {
  return new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth() + 1, 0).getDate()
})

const firstDayOfMonth = computed(() => {
  return new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth(), 1).getDay()
})

const calendarDays = computed(() => {
  const days = []

  // Empty cells before the month starts
  for (let i = 0; i < firstDayOfMonth.value; i++) {
    days.push(null)
  }

  // Days of the month
  for (let day = 1; day <= daysInMonth.value; day++) {
    days.push(day)
  }

  return days
})

const playlistsByDate = computed(() => {
  const map = {}

  playlists.value.forEach(playlist => {
    const date = new Date(playlist.created_at)
    const dateStr = date.toISOString().split('T')[0] // YYYY-MM-DD

    if (!map[dateStr]) {
      map[dateStr] = []
    }
    map[dateStr].push(playlist)
  })

  return map
})

const moodByDate = computed(() => {
  const map = {}

  Object.entries(playlistsByDate.value).forEach(([dateStr, playlistList]) => {
    const moodCounts = {}
    playlistList.forEach(p => {
      moodCounts[p.mood_id] = (moodCounts[p.mood_id] || 0) + 1
    })

    // Get the most common mood for that day
    let dominantMood = null
    let maxCount = 0
    Object.entries(moodCounts).forEach(([moodId, count]) => {
      if (count > maxCount) {
        maxCount = count
        dominantMood = parseInt(moodId)
      }
    })

    map[dateStr] = dominantMood
  })

  return map
})

// ===================================================================
// HELPER FUNCTIONS
// ===================================================================

function getDayMood(day) {
  if (!day) return null

  const dateStr = new Date(
    currentMonth.value.getFullYear(),
    currentMonth.value.getMonth(),
    day
  ).toISOString().split('T')[0]

  return moodByDate.value[dateStr]
}

function getMoodForDay(day) {
  const moodId = getDayMood(day)
  return moodId ? moodMap.value[moodId] : null
}

function getPlaylistCountForDay(day) {
  if (!day) return 0

  const dateStr = new Date(
    currentMonth.value.getFullYear(),
    currentMonth.value.getMonth(),
    day
  ).toISOString().split('T')[0]

  return playlistsByDate.value[dateStr]?.length || 0
}

function previousMonth() {
  currentMonth.value = new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth() - 1)
}

function nextMonth() {
  currentMonth.value = new Date(currentMonth.value.getFullYear(), currentMonth.value.getMonth() + 1)
}

function monthYear() {
  return currentMonth.value.toLocaleDateString(lang.current, {
    month: 'long',
    year: 'numeric'
  })
}

// ===================================================================
// LIFECYCLE
// ===================================================================

onMounted(async () => {
  if (!auth.user) return

  try {
    const { data, error } = await supabase
      .from('playlists')
      .select('id, mood_id, created_at')
      .eq('user_id', auth.user.id)
      .order('created_at', { ascending: false })

    if (error) throw error
    playlists.value = data || []
  } catch (error) {
    errorMessage.value = lang.t('analytics.loadError')
    console.error('Error loading playlists:', error)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="page">
    <h1>{{ lang.t('analytics.title') }}</h1>
    <p class="subtitle">{{ lang.t('analytics.subtitle') }}</p>

    <div v-if="loading" class="empty-message">{{ lang.t('common.loading') }}</div>

    <div v-else-if="errorMessage" class="error-box">{{ errorMessage }}</div>

    <div v-else class="analytics-section">
      <!-- ===================================================================
           CALENDAR - Month view with moods
           =================================================================== -->
      <div class="calendar-card">
        <div class="calendar-header">
          <button class="nav-btn" @click="previousMonth">←</button>
          <h2>{{ monthYear() }}</h2>
          <button class="nav-btn" @click="nextMonth">→</button>
        </div>

        <div class="calendar">
          <!-- Weekday headers -->
          <div class="weekday">{{ lang.t('analytics.sun') }}</div>
          <div class="weekday">{{ lang.t('analytics.mon') }}</div>
          <div class="weekday">{{ lang.t('analytics.tue') }}</div>
          <div class="weekday">{{ lang.t('analytics.wed') }}</div>
          <div class="weekday">{{ lang.t('analytics.thu') }}</div>
          <div class="weekday">{{ lang.t('analytics.fri') }}</div>
          <div class="weekday">{{ lang.t('analytics.sat') }}</div>

          <!-- Days -->
          <div
            v-for="(day, index) in calendarDays"
            :key="index"
            class="day"
            :class="{ empty: !day, 'has-mood': day && getMoodForDay(day) }"
            :style="day && getMoodForDay(day) ? { background: getMoodForDay(day).background } : {}"
          >
            <template v-if="day">
              <div class="day-number">{{ day }}</div>
              <div v-if="getMoodForDay(day)" class="mood-emoji">
                {{ getMoodForDay(day).emoji }}
              </div>
              <div v-if="getPlaylistCountForDay(day)" class="playlist-count">
                {{ getPlaylistCountForDay(day) }}
              </div>
            </template>
          </div>
        </div>
      </div>

      <!-- ===================================================================
           MOOD LEGEND
           =================================================================== -->
      <div class="legend-card">
        <h2>{{ lang.t('analytics.moods') }}</h2>
        <div class="legend-grid">
          <div v-for="mood in MOODS" :key="mood.id" class="legend-item">
            <div class="legend-color" :style="{ background: mood.background }">
              {{ mood.emoji }}
            </div>
            <span>{{ lang.t('moodName.' + mood.id) }}</span>
          </div>
        </div>
      </div>

      <!-- ===================================================================
           STATS
           =================================================================== -->
      <div class="stats-card">
        <h2>{{ lang.t('analytics.stats') }}</h2>
        <div class="stats-grid">
          <div class="stat">
            <span class="stat-value">{{ playlists.length }}</span>
            <span class="stat-label">{{ lang.t('analytics.totalPlaylists') }}</span>
          </div>
          <div class="stat">
            <span class="stat-value">{{ Object.keys(playlistsByDate).length }}</span>
            <span class="stat-label">{{ lang.t('analytics.activeDays') }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ===================================================================
   PAGE - Layout
   =================================================================== */

.page {
  max-width: 1600px;
  margin: 0 auto;
  padding: 24px 20px;
}

h1 {
  font-size: 1.6rem;
  font-weight: 800;
  margin-bottom: 6px;
}

.subtitle {
  color: var(--ink-soft);
  margin-bottom: 16px;
  font-size: 0.95rem;
}

/* ===================================================================
   ANALYTICS SECTION - Main content
   =================================================================== */

.analytics-section {
  display: grid;
  grid-template-columns: 1fr 320px;
  grid-template-rows: auto auto;
  gap: 20px;
  column-gap: 20px;
  row-gap: 4px;
  align-items: start;
}

/* ===================================================================
   CALENDAR CARD
   =================================================================== */

.calendar-card {
  background: var(--card);
  border: 1px solid var(--rule);
  border-radius: 16px;
  padding: 18px;
  grid-column: 1 / 2;
  grid-row: 1 / 3;
}

.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
}

.calendar-header h2 {
  font-size: 1.15rem;
  font-weight: 700;
  margin: 0;
}

.nav-btn {
  background: none;
  border: 1px solid var(--rule);
  border-radius: var(--radius);
  padding: 8px 12px;
  font-size: 1rem;
  cursor: pointer;
  color: var(--ink-soft);
  transition: all 0.15s;
}

.nav-btn:hover {
  background: var(--card-2);
  color: var(--ink);
}

.calendar {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
}

.weekday {
  text-align: center;
  font-weight: 600;
  font-size: 0.85rem;
  color: var(--ink-soft);
  padding: 8px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.day {
  aspect-ratio: 1;
  border: 1px solid var(--rule);
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  font-size: 0.85rem;
  padding: 6px;
  background: var(--paper);
  cursor: default;
  min-height: 60px;
}

.day.empty {
  background: transparent;
  border: none;
}

.day.has-mood {
  border-color: transparent;
  color: var(--on-mood);
}

.day-number {
  font-weight: 600;
  font-size: 0.95rem;
}

.mood-emoji {
  font-size: 1.5rem;
}

.playlist-count {
  font-size: 0.75rem;
  font-weight: 600;
  background: rgba(0, 0, 0, 0.1);
  padding: 2px 5px;
  border-radius: 4px;
}

/* ===================================================================
   LEGEND CARD
   =================================================================== */

.legend-card {
  background: var(--card);
  border: 1px solid var(--rule);
  border-radius: 16px;
  padding: 16px;
  grid-column: 2 / 3;
  grid-row: 1 / 2;
}

.legend-card h2 {
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: 12px;
}

.legend-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  border-radius: 8px;
  background: var(--paper);
}

.legend-color {
  width: 38px;
  height: 38px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.1rem;
  flex-shrink: 0;
}

.legend-item span {
  font-size: 0.9rem;
  font-weight: 500;
}

/* ===================================================================
   STATS CARD
   =================================================================== */

.stats-card {
  background: var(--card);
  border: 1px solid var(--rule);
  border-radius: 16px;
  padding: 16px;
  grid-column: 2 / 3;
  grid-row: 2 / 3;
}

.stats-card h2 {
  font-size: 1rem;
  font-weight: 700;
  margin-bottom: 12px;
}

.stats-grid {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 12px;
  background: var(--paper);
  border-radius: 10px;
}

.stat-value {
  font-size: 1.8rem;
  font-weight: 700;
  color: var(--orange);
}

.stat-label {
  font-size: 0.8rem;
  color: var(--ink-soft);
  margin-top: 4px;
}

/* ===================================================================
   MOBILE RESPONSIVE
   =================================================================== */

@media (max-width: 1000px) {
  .analytics-section {
    grid-template-columns: 1fr;
  }

  .legend-card,
  .stats-card {
    grid-column: 1;
  }

  .legend-card {
    grid-row: auto;
  }

  .stats-card {
    grid-row: auto;
  }

  .legend-grid {
    flex-direction: row;
    flex-wrap: wrap;
  }

  .legend-item {
    flex: 1;
    min-width: 120px;
  }
}

@media (max-width: 600px) {
  .page {
    padding: 16px 12px;
  }

  h1 {
    font-size: 1.3rem;
  }

  .calendar-header {
    flex-wrap: wrap;
    gap: 8px;
  }

  .calendar-header h2 {
    flex: 1;
  }

  .calendar {
    gap: 4px;
  }

  .day {
    font-size: 0.75rem;
    padding: 4px;
  }

  .mood-emoji {
    font-size: 1rem;
  }

  .weekday {
    font-size: 0.7rem;
  }
}
</style>
