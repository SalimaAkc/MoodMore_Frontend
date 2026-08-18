# Putting the frontend online

The frontend is just files (HTML, CSS, JavaScript), so it needs a static host.
This guide uses Vercel, which is free and deploys from GitHub. Netlify or
Cloudflare Pages work the same way.

The backend is hosted separately, from its own repository. See
[its DEPLOY.md](https://github.com/SalimaAkc/MoodMore_Backend/blob/main/DEPLOY.md).

Deploy the backend first. This side needs its address, and it needs to be told
this side's address afterwards.

## Step 1: the site

1. vercel.com -> Add New -> Project -> import this repository
2. Settings:
   - Root Directory: leave as is. The repository root is the app.
   - Framework preset: Vite (it usually detects this)
3. Environment variables:

   | Key                      | Value                        |
   | ------------------------ | ---------------------------- |
   | `VITE_API_URL`           | the backend's address        |
   | `VITE_SUPABASE_URL`      | same as in your local `.env` |
   | `VITE_SUPABASE_ANON_KEY` | same as in your local `.env` |

   These end up in the JavaScript that visitors download, which is fine because
   the anon key is meant to be public. Never put the Supabase service_role key
   here, or in any `VITE_` variable.
4. Deploy and copy the address, something like `https://m-m-frontend.vercel.app`

`vercel.json` is already in the repository. It tells Vercel to send every
address to `index.html`. Without it, visiting `/collection` directly gives a 404,
because Vue Router handles those addresses in the browser and the server knows
nothing about them. `public/_redirects` does the same job on Netlify.

## Step 2: let the backend know

Go to the backend's host and set `ALLOWED_ORIGIN` to the Vercel address above,
with no slash at the end. Without this the browser blocks every request to the
backend. The backend's DEPLOY.md has the details.

## Step 3: tell Supabase about the new address

Supabase Dashboard -> Authentication -> URL Configuration:

- Site URL: your Vercel address
- Redirect URLs: add both of these

```
https://m-m-frontend.vercel.app
https://m-m-frontend.vercel.app/reset-password
```

Login links point at the Site URL. If it still says localhost, anyone logging in
from the deployed app gets sent to a page on their own computer.

The second line is for "forgot your password". Supabase refuses to send anyone
to an address that is not on this list, so without it the link in the reset
email lands nowhere.

While you are in there, under Authentication -> Providers -> Email, check that
**Secure email change** is on. It makes a change of address need a confirmation
from the old inbox as well as the new one, which is what stops somebody with a
borrowed session from quietly moving an account to their own address. **Secure
password change** is worth turning on for the same reason.

## Step 4: check it

Open the Vercel address and go through it once:

- [ ] a mood page loads tracks
- [ ] search works, including Load more
- [ ] you can sign up and log in
- [ ] "forgot your password" sends an email and the link opens the reset page
- [ ] saving to the collection works
- [ ] hearts work
- [ ] the + on a track offers your playlists and can make a new one
- [ ] shuffle and repeat do what they say
- [ ] changing the email, changing the password and deleting the account all
      ask for your password, and all three refuse a wrong one
- [ ] refresh the page while on `/collection`, it should load and not give a 404

If the mood pages are empty, open the browser console. A CORS message means
`ALLOWED_ORIGIN` on the backend does not exactly match this address.

The first mood page after a quiet period can take around 30 seconds. Free
backend hosts put the service to sleep after about 15 minutes with no visitors.
That is the backend waking up, not a bug here.
