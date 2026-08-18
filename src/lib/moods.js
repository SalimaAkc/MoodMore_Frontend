// mood settings (ids must match the database)

export const MOODS = [
  {
    id: 1,
    name: 'Happy',
    emoji: '😊',
    description: 'Uplifting & feel-good',
    color: '#8a6413',
    background: 'linear-gradient(150deg, #f2dfa4, #e8cf88)'
  },
  {
    id: 2,
    name: 'Energetic',
    emoji: '⚡',
    description: 'High-energy & pumped',
    color: '#b0491c',
    background: 'linear-gradient(150deg, #f3cfae, #eab98d)'
  },
  {
    id: 3,
    name: 'Calm',
    emoji: '🌊',
    description: 'Relaxed & peaceful',
    color: '#3a6055',
    background: 'linear-gradient(150deg, #cfdfd7, #b7cec3)'
  },
  {
    id: 4,
    name: 'Romantic',
    emoji: '❤️',
    description: 'Tender & heartfelt',
    color: '#a8434c',
    background: 'linear-gradient(150deg, #f0d2ce, #e5b8b4)'
  },
  {
    id: 5,
    name: 'Melancholic',
    emoji: '☁️',
    description: 'Reflective & deep',
    color: '#6a5183',
    background: 'linear-gradient(150deg, #ddd3e4, #cbbed6)'
  },
  {
    id: 6,
    name: 'Sad',
    emoji: '☹️',
    description: 'Emotional & understood',
    color: '#4d5b66',
    background: 'linear-gradient(150deg, #d5dbdf, #c1cad0)'
  }
]

// mood for saved favorites
export const FAVORITES_MOOD = {
  id: 7,
  name: 'Favorites',
  emoji: '❤️',
  description: 'Tracks you hearted',
  color: '#a4451f',
  background: 'linear-gradient(150deg, #f0d8c6, #e6c3a9)'
}

// mood for custom playlists
export const CUSTOM_MOOD = {
  id: 8,
  name: 'Custom',
  emoji: '🎵',
  description: 'A playlist you made yourself',
  color: '#6b5d50',
  background: 'linear-gradient(150deg, #e9e0d2, #ddd0bc)'
}

// fallback mood when we don't recognize it
const UNKNOWN_MOOD = {
  id: 0,
  name: 'Playlist',
  emoji: '🎵',
  description: '',
  color: '#6b5d50',
  background: 'linear-gradient(150deg, #e9e0d2, #ddd0bc)'
}

// find a mood by its name
export function findMood(name) {
  return MOODS.find(mood => mood.name === name)
}

// find a mood by its id
export function findMoodById(id) {
  if (id === FAVORITES_MOOD.id) {
    return FAVORITES_MOOD
  }

  if (id === CUSTOM_MOOD.id) {
    return CUSTOM_MOOD
  }

  const found = MOODS.find(mood => mood.id === id)
  return found || UNKNOWN_MOOD
}
