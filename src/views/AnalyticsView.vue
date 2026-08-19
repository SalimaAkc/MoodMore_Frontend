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

// turn a date into a "YYYY-MM-DD" key using the local timezone
// (toISOString would use UTC and shift the day by one)
function toDateKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return year + '-' + month + '-' + day
}

const playlistsByDate = computed(() => {
  const map = {}

  playlists.value.forEach(playlist => {
    const dateStr = toDateKey(new Date(playlist.created_at))

    if (!map[dateStr]) {
      map[dateStr] = []
    }
    map[dateStr].push(playlist)
  })

  return map
})

// every mood used on a day, most used first
const moodsByDate = computed(() => {
  const map = {}

  Object.entries(playlistsByDate.value).forEach(([dateStr, playlistList]) => {
    const moodCounts = {}
    playlistList.forEach(p => {
      moodCounts[p.mood_id] = (moodCounts[p.mood_id] || 0) + 1
    })

    // sort the moods so the most used one comes first
    map[dateStr] = Object.entries(moodCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([moodId]) => moodMap.value[parseInt(moodId)])
      .filter(mood => mood)
  })

  return map
})

// ===================================================================
// HELPER FUNCTIONS
// ===================================================================

// all moods used on a day (empty list when nothing was made that day)
function getMoodsForDay(day) {
  if (!day) return []

  const dateStr = toDateKey(new Date(
    currentMonth.value.getFullYear(),
    currentMonth.value.getMonth(),
    day
  ))

  return moodsByDate.value[dateStr] || []
}

// pull the first colour out of a mood gradient so we can build stripes
function moodColor(mood) {
  const match = mood.background.match(/#[0-9a-f]{3,6}/i)
  return match ? match[0] : mood.background
}

// one mood = its normal gradient, more moods = hard-edged colour bands
function dayBackground(day) {
  const moods = getMoodsForDay(day)
  if (!moods.length) return {}
  if (moods.length === 1) return { background: moods[0].background }

  const size = 100 / moods.length
  const stops = moods.map((mood, index) => {
    const color = moodColor(mood)
    return color + ' ' + (index * size) + '%, ' + color + ' ' + ((index + 1) * size) + '%'
  })

  return { background: 'linear-gradient(120deg, ' + stops.join(', ') + ')' }
}

function getPlaylistCountForDay(day) {
  if (!day) return 0

  const dateStr = toDateKey(new Date(
    currentMonth.value.getFullYear(),
    currentMonth.value.getMonth(),
    day
  ))

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
            :class="{ empty: !day, 'has-mood': getMoodsForDay(day).length }"
            :style="dayBackground(day)"
          >
            <template v-if="day">
              <div class="day-number">{{ day }}</div>

              <!-- one emoji per mood used that day -->
              <div v-if="getMoodsForDay(day).length" class="mood-emojis">
                <span
                  v-for="mood in getMoodsForDay(day)"
                  :key="mood.id"
                  class="mood-emoji"
                  :class="{ small: getMoodsForDay(day).length > 2 }"
                  :title="lang.t('moodName.' + mood.id)"
                >{{ mood.emoji }}</span>
              </div>

              <div v-if="getPlaylistCountForDay(day)" class="playlist-count">
                {{ getPlaylistCountForDay(day) }}
              </div>
            </template>
          </div>
        </div>
      </div>

      <!-- ===================================================================
           SIDEBAR - Mood legend and stats
           =================================================================== -->
      <div class="sidebar">
        <!-- Mood legend -->
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

        <!-- Stats -->
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
  </div>
</template>

<style scoped>
/* ===================================================================
   PAGE - Layout
   =================================================================== */

.page {
  max-width: 1200px;
  margin: 0 auto;
  padding: 12px 16px;
}

h1 {
  font-size: 1.3rem;
  font-weight: 800;
  margin-bottom: 2px;
}

.subtitle {
  color: var(--ink-soft);
  margin-bottom: 12px;
  font-size: 0.85rem;
}

/* ===================================================================
   ANALYTICS SECTION - Main content
   =================================================================== */

.analytics-section {
  display: grid;
  grid-template-columns: 1fr 260px;
  gap: 12px;
  align-items: start;
}

/* ===================================================================
   SIDEBAR - Moods and stats stacked
   =================================================================== */

.sidebar {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* ===================================================================
   CALENDAR CARD
   =================================================================== */

.calendar-card {
  background: var(--card);
  border: 1px solid var(--rule);
  border-radius: 16px;
  padding: 12px;
}

.calendar-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
}

.calendar-header h2 {
  font-size: 1rem;
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
  gap: 4px;
}

.weekday {
  text-align: center;
  font-weight: 600;
  font-size: 0.75rem;
  color: var(--ink-soft);
  padding: 4px;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.day {
  position: relative;
  border: 1px solid var(--rule);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  padding: 4px;
  background: var(--paper);
  cursor: default;
  height: 54px;
  overflow: hidden;
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
  font-size: 0.85rem;
  line-height: 1;
}

/* on mood days the number moves to the top-left corner */
.day.has-mood .day-number {
  position: absolute;
  top: 5px;
  left: 6px;
  font-size: 0.7rem;
}

.mood-emojis {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 2px;
  max-width: 100%;
}

.mood-emoji {
  font-size: 1.3rem;
  line-height: 1;
}

/* shrink the emojis when a day has three or more moods */
.mood-emoji.small {
  font-size: 0.95rem;
}

.playlist-count {
  position: absolute;
  bottom: 4px;
  right: 5px;
  font-size: 0.6rem;
  font-weight: 600;
  line-height: 1;
  background: rgba(0, 0, 0, 0.12);
  padding: 2px 4px;
  border-radius: 4px;
}

/* ===================================================================
   LEGEND CARD
   =================================================================== */

.legend-card {
  background: var(--card);
  border: 1px solid var(--rule);
  border-radius: 16px;
  padding: 12px;
}

.legend-card h2 {
  font-size: 0.9rem;
  font-weight: 700;
  margin-bottom: 8px;
}

.legend-grid {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  border-radius: 6px;
  background: var(--paper);
}

.legend-color {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.95rem;
  flex-shrink: 0;
}

.legend-item span {
  font-size: 0.8rem;
  font-weight: 500;
}

/* ===================================================================
   STATS CARD
   =================================================================== */

.stats-card {
  background: var(--card);
  border: 1px solid var(--rule);
  border-radius: 16px;
  padding: 12px;
}

.stats-card h2 {
  font-size: 0.9rem;
  font-weight: 700;
  margin-bottom: 8px;
}

.stats-grid {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 10px;
  background: var(--paper);
  border-radius: 8px;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--orange);
}

.stat-label {
  font-size: 0.75rem;
  color: var(--ink-soft);
  margin-top: 3px;
}

/* ===================================================================
   MOBILE RESPONSIVE
   =================================================================== */

@media (max-width: 1000px) {
  .analytics-section {
    grid-template-columns: 1fr;
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
    font-size: 0.7rem;
    padding: 3px;
    height: 44px;
  }

  .mood-emoji {
    font-size: 0.9rem;
  }

  .weekday {
    font-size: 0.7rem;
  }
}
</style>
