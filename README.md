# M&M — frontend

**Mood & More.** Pick how you feel, get a playlist. Save the ones you like to
your collection.

Vue 3 app, talking to Supabase for accounts and playlists, and to the
[Mood&More backend](https://github.com/SalimaAkc/M-M_Backend) for tracks.

The app talks to Supabase directly, with no backend in between. That is safe
because the database has its own Row Level Security rules that stop one user
from reading another user's playlists. Only the YouTube side goes through the
backend, so the API key stays on a server instead of in the browser.

## Setup

You need Node 20 or newer.

```bash
npm install
cp .env.example .env
```

Put your Supabase URL and anon key in `.env`. You find them in the Supabase
Dashboard under Project Settings -> API. `VITE_API_URL` points at the backend,
`http://localhost:3000` while you develop.

```bash
npm run dev
```

Then open http://localhost:5173

The backend needs to be running too, or the mood pages stay empty. See the
[backend repo](https://github.com/SalimaAkc/M-M_Backend) for that half.

## The database

The SQL lives in `supabase/`. In the Supabase SQL Editor, run the two files in
this order:

1. `supabase/schema.sql` — makes the tables and adds the 8 moods
2. `supabase/rls-policies.sql` — adds the security rules

Do not skip the second one. Without it anyone can read and delete every user's
playlists, because the app talks to the database straight from the browser.

Both files are safe to run more than once. If your database was set up before
mood 8 existed, run `schema.sql` again or the + button on a track cannot make
a playlist.

A database that already existed before the profile page needs one extra file:

3. `supabase/migration-profile.sql` — adds `playlists.is_public` and the
   `follows` table

Those same statements are already inside the two files above, so a database
built from scratch does not need the third one.

The same two files are in the backend repo. They are the same schema, kept in
both places so either half can be set up on its own. If you change one, change
the other.

Four tables:

| Table       | Columns                                                                |
| ----------- | ---------------------------------------------------------------------- |
| `moods`     | `id`, `name`                                                           |
| `playlists` | `id`, `user_id`, `mood_id`, `name`, `songs`, `is_public`, `created_at` |
| `profiles`  | `id`, `email`, `full_name`, `avatar_url`, `created_at`                 |
| `follows`   | `follower_id`, `followee_id`, `created_at`                             |

Accounts themselves live in `auth.users`, which Supabase manages. `profiles` is
our own copy of the bits we need, filled in by a trigger when someone signs up.
Its `id` is the same id as in `auth.users`.

`is_public` says whether a playlist may be shown on its owner's profile. It
defaults to false. Note that it does not open anything up yet: the security
rules still limit every select to your own rows, so a published playlist is
for now only visible to you. The rule that lets other people read it belongs
with the change that makes other profiles viewable, and is not written yet.

`songs` is a JSON list of tracks stored inside the playlist row:

```json
[{ "videoId": "UtF6Jej8yb4", "title": "Avicii - The Nights",
   "artist": "AviciiOfficialVEVO", "duration": "3:11", "thumbnail": "https://…" }]
```

## Reset password links

In the Supabase Dashboard, under Authentication -> URL Configuration, add your
app's address to Redirect URLs:

```
http://localhost:5173/reset-password
https://your-site.example/reset-password
```

Supabase refuses to send people to an address that is not on that list, so
without this the link in the reset email goes nowhere.

## Where things are

Everything lives under `src/`:

| File                          | What it does                     |
| ----------------------------- | -------------------------------- |
| `main.js`                     | starts the app                   |
| `App.vue`                     | navbar and page frame            |
| `router/index.js`             | which address shows which page   |
| `lib/api.js`                  | talks to our backend             |
| `lib/supabase.js`             | connects to the database         |
| `lib/moods.js`                | the moods and their colours      |
| `lib/stats.js`                | the month overview on a profile  |
| `lib/translations.js`         | all the text in en, nl and fr    |
| `stores/`                     | shared data, one file per topic  |
| `stores/profile.js`           | the user's profile and picture   |
| `stores/language.js`          | the chosen language and t()      |
| `stores/player.js`            | the queue, shuffle and repeat    |
| `stores/playlists.js`         | the list behind the + on a track |
| `components/TrackList.vue`    | a list of tracks                 |
| `components/BottomPlayer.vue` | the player bar                   |
| `views/`                      | one file per page                |

## Sensitive actions

Changing the email, changing the password and deleting the account all ask for
the password that is in use now, because a login token only says which account
something belongs to, not who is sitting at the keyboard.

Deleting an account goes through the backend, which checks the password again on
the server, so calling it straight from a script with a stolen token gets
nowhere. The other two happen here in the browser against Supabase, so the check
is a speed bump rather than a wall. Two settings in the Supabase Dashboard close
that gap, under Authentication -> Providers -> Email: **Secure email change**
and **Secure password change**. Both are worth turning on.

## Tests

```bash
npm test
```

They cover the pieces that are easy to get quietly wrong: the shuffle and repeat
logic, and whether the three languages still have exactly the same lines.

## Notes

- The `&` in the `Mood&More` folder name breaks the `.cmd` shims npm creates
  for tools like `vite`. cmd.exe pastes the folder path into the command line
  before it splits the line on `&`, so the command tears in half and you get
  `... is not recognized as an internal or external command`. That is why the
  scripts below call `node node_modules/vite/bin/vite.js` instead of plain
  `vite`: going straight to node skips the shim. It behaves the same on Linux,
  so CI is unaffected. Please keep new scripts in that style.
- Restart after changing `.env`. Vite only reads it when it starts.
- Never commit `.env`. It is already in `.gitignore`.
- Everything in a `VITE_` variable ends up in the JavaScript that visitors
  download. That is fine for the Supabase anon key, which is meant to be public.
  Never put the service_role key in one.
- `vercel.json` and `public/_redirects` send every address to `index.html`.
  Without them, visiting `/collection` directly gives a 404, because Vue Router
  handles those addresses in the browser and the server knows nothing about them.

## Putting it online

See [DEPLOY.md](DEPLOY.md).

## License

MIT, see [LICENSE](LICENSE).
