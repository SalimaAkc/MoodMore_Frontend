# How to Deploy the Frontend

The frontend is just HTML, CSS, and JavaScript files. We use **Vercel** (it's free!) to host them.

**Important:** Make sure the backend is deployed first! Then come back here.

See: [Backend DEPLOY.md](https://github.com/SalimaAkc/MoodMore_Backend/blob/main/DEPLOY.md)

---

## Step 1: Deploy to Vercel

1. Go to **vercel.com**
2. Click **Add New → Project**
3. Import this GitHub repository
4. Settings should auto-detect:
   - **Framework:** Vite (should be selected automatically)
   - **Root Directory:** leave as is
5. Click **Deploy**
6. Wait a few minutes and copy the URL (looks like: `https://your-app.vercel.app`)

---

## Step 2: Add Environment Variables

While Vercel is deploying, go to settings and add these variables:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | Your backend URL (from Step 1 of backend deploy) |
| `VITE_SUPABASE_URL` | Same as in your `.env` file |
| `VITE_SUPABASE_ANON_KEY` | Same as in your `.env` file |

**Important:** Never put the Supabase `service_role` key here! That's only for the backend.

---

## Step 3: Tell Supabase About Your Frontend

Go to **Supabase Dashboard → Authentication → URL Configuration**:

1. Set **Site URL** to your Vercel URL
2. Add these **Redirect URLs:**
   ```
   https://your-app.vercel.app
   https://your-app.vercel.app/reset-password
   ```

This makes login links work and fixes password reset emails.

**Bonus:** While you're there, turn on:
- **Secure email change** (asks to confirm from both old and new email)
- **Secure password change** (same protection)

---

## Step 4: Update Backend Settings

Go back to your Render backend and change `ALLOWED_ORIGIN` to your Vercel URL:

```
ALLOWED_ORIGIN=https://your-app.vercel.app
```

**No slash at the end!**

Render will restart automatically.

---

## Step 5: Test Everything

Open your Vercel URL and try these:

- [ ] Home page loads
- [ ] Click a mood → songs appear
- [ ] Search for a song → works
- [ ] Sign up → works
- [ ] Log in → works
- [ ] "Forgot password" → email works, reset link works
- [ ] Save to collection → works
- [ ] Heart a song → works
- [ ] Use shuffle and repeat → works
- [ ] Refresh on `/collection` → still loads (no 404)
- [ ] Change email, password, delete account → all ask for password

**If mood pages are empty:**
- Open browser console (F12)
- Look for CORS error
- This means `ALLOWED_ORIGIN` on backend doesn't match exactly

**If first page is slow:**
- First request after 15 minutes takes 20-30 seconds
- This is Render waking up (free tier)
- Normal, not a bug ✅
