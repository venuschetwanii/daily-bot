# Daily Interview Prep Email

Sends 5 MERN + System Design interview questions every day at **11:00 AM IST**, in the
"Simple Take / Real Story / Remember It As / Common Mistake" format.

- Questions are written by Claude (Opus) through the Claude Code CLI, so it runs on your Claude
  subscription — no API key. They're tailored to the profile in `src/config.js`.
- Each day rotates two tracks (React, Node/NestJS, MongoDB, HLD, LLD, ...) and one focus company.
- Previously sent questions are saved in `data/history.json` so they are not repeated.
- GitHub Actions runs it on a schedule, so your PC doesn't need to be on.

## Setup

1. **Gmail App Password**: turn on 2-Step Verification for the sending Gmail account, then create an
   App Password at https://myaccount.google.com/apppasswords.
2. **Claude token**: run `claude setup-token` in a terminal and copy the token it prints.
3. **Push this folder to a GitHub repo** (a private repo is fine).
4. In the repo, go to **Settings → Secrets and variables → Actions** and add these secrets:
   `CLAUDE_CODE_OAUTH_TOKEN`, `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `TO_EMAIL`.
5. Go to **Actions → Daily Interview Prep Email → Run workflow** to send one now and check it works.

## Making it arrive on time (11:00 AM IST)

GitHub's own scheduler can start runs hours late, so an external free cron service triggers the
workflow at 11:00 instead. The GitHub schedules in the workflow stay as a backup.

1. **Create a GitHub token**: GitHub → Settings → Developer settings → Personal access tokens →
   **Fine-grained tokens** → Generate new token.
   - Repository access: **Only select repositories** → `daily-bot`
   - Permissions → Repository permissions → **Actions: Read and write**
   - Expiration: pick the longest allowed, and set a reminder to renew it.
2. **Create a job on https://cron-job.org** (free account):
   - URL: `https://api.github.com/repos/venuschetwanii/daily-bot/actions/workflows/daily-email.yml/dispatches`
   - Schedule: every day at **10:58**, time zone **Asia/Kolkata** (the run takes ~2 minutes).
   - Advanced → Request method: **POST**
   - Headers:
     - `Authorization`: `Bearer <your token>`
     - `Accept`: `application/vnd.github+json`
     - `Content-Type`: `application/json`
   - Request body: `{"ref":"main"}` (use your branch name if it isn't `main`)
3. Click **Test run** on cron-job.org. A `204` response means it worked; check the Actions tab.

## Run locally

Uses whatever account you're logged into with `claude`.

```bash
cp .env.example .env               # fill in Gmail values
node --env-file=.env src/index.js --dry-run   # writes preview.html, sends nothing
node --env-file=.env src/index.js             # sends for real
node --env-file=.env src/index.js --force     # send again even if today already went out
```

## Customize

Edit `src/config.js` to change your profile, the track rotation, the companies, or the number of questions.
