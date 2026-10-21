import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import nodemailer from 'nodemailer';
import { FOCUS_COMPANIES, HISTORY_WINDOW, TRACK_PAIRS, difficultyForDay } from './config.js';
import { generateDigest } from './generate.js';
import { renderEmail } from './template.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const HISTORY_FILE = path.join(ROOT, 'data', 'history.json');
const PREVIEW_FILE = path.join(ROOT, 'preview.html');

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has('--dry-run'); // generate + write preview.html, don't send or record
const FORCE = args.has('--force'); // send even if today's email already went out

function todayInIST() {
  const now = new Date();
  const isoDate = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata' }).format(now); // YYYY-MM-DD
  const dateLabel = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(now);
  const [y, m, d] = isoDate.split('-').map(Number);
  const dayIndex = Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
  return { isoDate, dateLabel, dayIndex };
}

async function loadHistory() {
  try {
    return JSON.parse(await fs.readFile(HISTORY_FILE, 'utf8'));
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

function requireEnv(...names) {
  const missing = names.filter((n) => !process.env[n]);
  if (missing.length) throw new Error(`Missing environment variables: ${missing.join(', ')}`);
}

async function sendMail({ subject, html, text }) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
  });
  const info = await transporter.sendMail({
    from: `"Daily Interview Prep" <${process.env.GMAIL_USER}>`,
    to: process.env.TO_EMAIL,
    subject,
    html,
    text,
  });
  console.log(`Sent to ${process.env.TO_EMAIL} (${info.messageId})`);
}

async function main() {
  if (!DRY_RUN) requireEnv('GMAIL_USER', 'GMAIL_APP_PASSWORD', 'TO_EMAIL');

  const { isoDate, dateLabel, dayIndex } = todayInIST();
  const history = await loadHistory();

  if (!DRY_RUN && !FORCE && history.some((h) => h.date === isoDate)) {
    console.log(`Already sent for ${isoDate}; use --force to send again.`);
    return;
  }

  const tracks = TRACK_PAIRS[dayIndex % TRACK_PAIRS.length];
  const company = FOCUS_COMPANIES[dayIndex % FOCUS_COMPANIES.length];
  const pastQuestions = history.slice(-HISTORY_WINDOW).map((h) => h.question);
  const day = new Set(history.map((h) => h.date)).size + 1;
  const level = difficultyForDay(day);

  console.log(`${isoDate}: day ${day} (${level.label}) — ${tracks.join(' + ')} — focus ${company}`);
  const questions = await generateDigest({ tracks, company, dateLabel, pastQuestions, day, level });
  const { html, text } = renderEmail({ questions, tracks, company, dateLabel, day, level });

  if (DRY_RUN) {
    await fs.writeFile(PREVIEW_FILE, html);
    console.log(`Dry run: wrote ${PREVIEW_FILE}`);
    return;
  }

  await sendMail({ subject: `🧠 Interview Prep · ${tracks.join(' + ')} · Focus: ${company}`, html, text });

  const updated = [...history, ...questions.map((q) => ({ date: isoDate, category: q.category, question: q.question }))];
  await fs.mkdir(path.dirname(HISTORY_FILE), { recursive: true });
  await fs.writeFile(HISTORY_FILE, JSON.stringify(updated, null, 2) + '\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
