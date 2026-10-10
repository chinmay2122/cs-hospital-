# Chitta Studios site

A hostable project for the Chitta Studios hospital-websites page. It has a selectable pricing section, a live total, a 5% add-on discount, and a checkout that emails each order to you and saves it to a Google Sheet.

```
public/            the website (served as-is)
  index.html       main page          privacy.html   privacy notice
  css/ js/ assets/ styles, scripts, images
api/order.js       checkout: validates, emails you, saves to the Sheet
api/_lib/          prices + input checks (server side)
apps-script/       Code.gs for the Google Sheet
scripts/           set-site-url.js (after first deploy), dev-server.js (optional preview)
vercel.json        security headers and settings
.env.example       the secret settings you will paste into Vercel
```

You do **not** need a domain. Vercel gives you a free address like `https://your-project.vercel.app`.

---

## 1. Google Sheet (about 5 minutes)

1. Go to <https://sheets.google.com> and create a blank sheet. Name it "Chitta Studios orders".
2. Menu **Extensions > Apps Script**. Delete the sample code and paste in everything from `apps-script/Code.gs`.
3. Click the gear icon (**Project Settings**). Under **Script Properties**, click **Add script property**: name `SECRET`, value a long random string (for example 30 random letters and digits). Save it, and keep a copy for step 3 below.
4. Click **Deploy > New deployment**. Type: **Web app**. Execute as: **Me**. Who has access: **Anyone**. Click **Deploy** and approve the permission prompts.
5. Copy the **Web app URL** (it ends in `/exec`). This is your `SHEET_WEBHOOK_URL`.

The "Anyone" access is safe here: the script ignores any request that does not carry your `SECRET`.
If you later edit `Code.gs`, use **Deploy > Manage deployments > Edit > New version** so the change goes live.

## 2. Hostinger mailbox

1. In Hostinger hPanel, open **Emails** and make sure `support@donornearby.in` exists.
2. Safer setup: give this mailbox its own strong password that you use nowhere else. If it ever leaks, you reset it in hPanel and update one setting in Vercel.
3. Sending settings (Hostinger's standard values):
   - Host: `smtp.hostinger.com`
   - Port: `465` (SSL)
   - Username: the full address, `support@donornearby.in`
   - Password: the mailbox password

   If your mailbox's "Configure email app" page in hPanel shows different server names, use those instead.

## 3. Deploy to Vercel

You will paste secrets into Vercel's dashboard. They are stored encrypted there and are never in the code or this ZIP.

**Option A: with GitHub (easiest to update later)**
1. Create a new private repository on GitHub and upload the contents of this folder (the `.gitignore` already keeps secrets out).
2. At <https://vercel.com>, sign in with GitHub, click **Add New > Project**, and import the repository.
3. Leave **Framework Preset** as **Other**. Leave build settings empty. Do not deploy yet.
4. Open **Environment Variables** and add these (tick **Sensitive** on the two secrets):

   | Name | Value |
   |---|---|
   | `SMTP_HOST` | `smtp.hostinger.com` |
   | `SMTP_PORT` | `465` |
   | `SMTP_USER` | `support@donornearby.in` |
   | `SMTP_PASS` | the mailbox password (Sensitive) |
   | `MAIL_TO` | `umeshgalatage@gmail.com` |
   | `MAIL_FROM` | `support@donornearby.in` |
   | `SHEET_WEBHOOK_URL` | the Web app URL from step 1 |
   | `SHEET_SECRET` | the same value you used for `SECRET` in Apps Script (Sensitive) |

5. Click **Deploy**.

**Option B: with the command line**
```
npm i -g vercel
cd chitta-studios-site
vercel            # first run: log in, accept the defaults
vercel env add SMTP_PASS     # repeat for each name in the table above
vercel --prod
```

## 4. After the first deploy

1. Note your live address (for example `https://chitta-studios.vercel.app`).
2. Put it into the pages, sitemap and share image links:
   ```
   node scripts/set-site-url.js https://chitta-studios.vercel.app
   ```
   Then deploy again (push to GitHub, or run `vercel --prod`).
3. **Test an order.** Choose Tier 2, add an add-on, finalise, fill the form with your own details. You should get:
   - an email at `umeshgalatage@gmail.com` from `support@donornearby.in` (check Spam the first time and mark it "Not spam");
   - a new row in the **Orders** tab of your Sheet.
4. Optional: submit your sitemap (`/sitemap.xml`) in Google Search Console.

## How the checkout is protected

- Prices are recalculated on the server. A visitor cannot change the total by editing the page.
- Hidden trap field for bots, a limit of 5 requests per 10 minutes per visitor, and a same-site check.
- Strict security headers (see `vercel.json`). If you add a third-party script later (analytics, chat), you must allow it there.
- The Sheet stores text as plain text, so nothing typed into the form can run as a formula.
- If email fails but the Sheet saves (or the other way round), the visitor still sees success and the failure is written to Vercel's logs (**Project > Logs**). If both fail, they see an error with a link to send the details from their own email app.

## Changing prices or add-ons

Prices live in three places. Change all three:
1. The visible text in `public/index.html`
2. `P` and `AD` near the top of `public/js/app.js`
3. `api/_lib/pricing.js` (this is the one the server trusts)

## Preview on your computer (optional)

Needs Node 20.6 or newer. Copy `.env.example` to `.env`, fill it in, then:
```
npm install
npm run dev        # http://localhost:3000
```
To test without sending real email, add `MAIL_DRY_RUN=1` to `.env`.

## Good to know

- The privacy notice (`public/privacy.html`) is a plain-language default. Have someone qualified review it before relying on it.
- The page loads fonts from Google Fonts. The privacy notice says so.
- The rate limit is best effort on Vercel's free tier (each server instance keeps its own count). Enough to stop casual spam, not a determined attacker.
- Orders you receive are requests, not payments. The checkout says no payment is taken.
