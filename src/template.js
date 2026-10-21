const DIFFICULTY = {
  Easy: { emoji: '🟢', color: '#15803d', bg: '#dcfce7' },
  Medium: { emoji: '🟡', color: '#a16207', bg: '#fef9c3' },
  Hard: { emoji: '🔴', color: '#b91c1c', bg: '#fee2e2' },
};

const esc = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const searchLink = (q) => `https://www.google.com/search?q=${encodeURIComponent(q)}`;

const pill = (text, color, bg) =>
  `<span style="display:inline-block;padding:3px 10px;margin:0 6px 6px 0;border-radius:999px;font-size:12px;font-weight:600;color:${color};background:${bg};">${esc(text)}</span>`;

function section(icon, title, body, accent) {
  return `
  <div style="margin:14px 0 0;padding:12px 14px;border-left:3px solid ${accent};background:#f9fafb;border-radius:0 8px 8px 0;">
    <div style="font-size:13px;font-weight:700;color:#111827;margin-bottom:6px;">${icon} ${title}</div>
    <div style="font-size:14px;line-height:1.6;color:#374151;">${esc(body)}</div>
  </div>`;
}

function questionCard(q, i) {
  const d = DIFFICULTY[q.difficulty] ?? DIFFICULTY.Medium;
  const isCompany = q.tag && q.tag !== 'Industry Common';
  return `
  <div style="margin:0 0 20px;padding:20px;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;">
    <div style="font-size:12px;font-weight:800;color:#6366f1;letter-spacing:1px;margin-bottom:8px;">Q${i + 1}</div>
    <div>
      ${pill(q.category, '#3730a3', '#e0e7ff')}
      ${pill(`${d.emoji} ${q.difficulty}`, d.color, d.bg)}
      ${isCompany ? pill(q.tag, '#ffffff', '#635bff') : pill('Industry Common', '#374151', '#f3f4f6')}
    </div>
    <div style="font-size:17px;font-weight:700;line-height:1.4;color:#111827;margin:8px 0 4px;">${esc(q.question)}</div>
    ${section('💡', 'The Simple Take', q.simpleTake, '#6366f1')}
    ${section('📖', 'Real Story', q.realStory, '#0ea5e9')}
    ${section('🧲', 'Remember It As', q.rememberIt, '#a855f7')}
    ${section('⚠️', 'Common Mistake', q.commonMistake, '#f59e0b')}
    <div style="margin-top:14px;">
      <a href="${searchLink(q.question)}" style="font-size:13px;font-weight:600;color:#4f46e5;text-decoration:none;">Dig deeper →</a>
    </div>
  </div>`;
}

export function renderEmail({ questions, tracks, company, dateLabel }) {
  const html = `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:680px;margin:0 auto;padding:24px 12px;">
    <div style="padding:28px 24px;border-radius:14px;background:linear-gradient(135deg,#4f46e5,#7c3aed);background-color:#4f46e5;color:#ffffff;margin-bottom:20px;">
      <div style="font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;opacity:.85;">Daily Interview Prep</div>
      <div style="font-size:24px;font-weight:800;margin:8px 0 4px;">🧠 MERN &amp; System Design Interview Questions</div>
      <div style="font-size:14px;opacity:.9;">${esc(dateLabel)}</div>
      <div style="margin-top:14px;">
        ${tracks.map((t) => pill(t, '#ffffff', 'rgba(255,255,255,.2)')).join('')}
        ${pill(`Focus: ${company}`, '#4f46e5', '#ffffff')}
      </div>
      <div style="font-size:14px;margin-top:6px;opacity:.95;">${questions.length} real interview questions — explained simply, with stories and one-liners you'll actually remember.</div>
    </div>
    ${questions.map(questionCard).join('')}
    <div style="text-align:center;font-size:12px;color:#9ca3af;padding:8px 0 24px;">Sent every day at 11:00 AM IST · Keep going 💪</div>
  </div>
</body></html>`;

  const text = [
    'Daily Interview Prep',
    '🧠 MERN & System Design Interview Questions',
    dateLabel,
    '',
    ...tracks,
    `Focus: ${company}`,
    '',
    ...questions.flatMap((q, i) => [
      `Q${i + 1} | ${q.category} | ${q.difficulty} | ${q.tag}`,
      q.question,
      '',
      `💡 The Simple Take\n${q.simpleTake}`,
      '',
      `📖 Real Story\n${q.realStory}`,
      '',
      `🧲 Remember It As\n${q.rememberIt}`,
      '',
      `⚠️ Common Mistake\n${q.commonMistake}`,
      '',
      `Dig deeper → ${searchLink(q.question)}`,
      '',
      '----------------------------------------',
      '',
    ]),
  ].join('\n');

  return { html, text };
}
