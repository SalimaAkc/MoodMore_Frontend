# Mood&More — Frontend

The app you see in your browser. Pick a mood, get a playlist, save it.

Built with **Vue 3**. Talks to:
- **Supabase** for accounts and playlists
- **Backend API** for song searches
- **YouTube** (through the backend)

---

## What the App Does

- 🎵 **Pick a mood** (Happy, Energetic, Calm, Romantic, Melancholic, Sad)
- 🔍 **Search for songs** directly
- 💾 **Save playlists** to your collection
- ❤️ **Like/heart songs** (add to favorites)
- 🎚️ **Control playback** (shuffle, repeat, skip)
- 🌍 **3 languages** (English, Dutch, French)
- 🌙 **Dark mode** available

---

## How to Run It Locally

### 1. Install it

You need Node 20 or newer.

```bash
npm install
cp .env.example .env
```

### 2. Add your settings

Put these in `.env`:

```
VITE_API_URL=http://localhost:3000
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_key
```

Get Supabase URL and key from: **Supabase Dashboard → Settings → API**

### 3. Start it

```bash
npm run dev
```

Then open **http://localhost:5173**

⚠️ **You need the backend running too!** See the [backend README](https://github.com/SalimaAkc/MoodMore_Backend)

---

## Database Setup

Files are in `supabase/` folder.

**In Supabase SQL Editor, run these in order:**

1. **schema.sql** — creates tables (moods, playlists, profiles)
2. **rls-policies.sql** — adds security rules (important!)
3. **migration-profile.sql** — adds extra profile features

⚠️ Don't skip step 2! Without security rules, anyone can see everyone's playlists.

---

## File Structure

```
src/
├── main.js                  # Starts the app
├── App.vue                  # Main layout/navbar
├── router/                  # Pages and navigation
├── lib/                     # Useful functions
│   ├── api.js              # Talk to backend
│   ├── supabase.js         # Database connection
│   ├── moods.js            # Mood definitions
│   └── translations.js     # Text in 3 languages
├── stores/                 # Shared data (Pinia)
│   ├── auth.js             # Login/signup
│   ├── player.js           # Music player
│   ├── favorites.js        # Liked songs
│   └── ...
├── components/             # Reusable parts
│   ├── TrackList.vue       # Song list
│   └── BottomPlayer.vue    # Music player
└── views/                  # Pages
    ├── HomeView.vue
    ├── MoodView.vue
    ├── CollectionView.vue
    └── ...
```

---

## How Data Flows

1. **You pick a mood** → Frontend asks backend
2. **Backend searches YouTube** → Returns 50 songs
3. **Frontend shows them** → You can play or save
4. **Save to collection** → Goes to Supabase database
5. **Login/accounts** → Handled by Supabase
6. **Other users can't see your playlists** → Database security rules protect them

---

## Password Reset

When someone resets their password:

1. They click "Forgot Password"
2. Supabase sends an email with a link
3. Link goes to `/reset-password`
4. They set a new password

**Setup required:**

Go to **Supabase → Authentication → URL Configuration**

Add these Redirect URLs:

```
http://localhost:5173/reset-password
https://your-deployed-url/reset-password
```

Without this, reset links won't work.

---

## Running Tests

```bash
npm test
```

Tests check:
- Shuffle and repeat logic
- Language translations (all 3 have same text)
- Statistics calculations

---

## Important Notes

- **Restart after changing `.env`** — app reads it on startup only
- **Never commit `.env`** — it's in `.gitignore` already
- **Don't put `service_role` key in `.env`** — only the anon key
- **Backend must be running** — or mood pages will be empty
- **First load after long silence might be slow** — backend is waking up (free tier)

---

## Deploying

See [DEPLOY.md](DEPLOY.md) for instructions on deploying to Vercel.

---

## License

MIT, see [LICENSE](LICENSE).
