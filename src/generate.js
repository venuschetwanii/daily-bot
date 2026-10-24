import { spawn } from 'node:child_process';
import path from 'node:path';
import { z } from 'zod';
import { CANDIDATE_PROFILE, MODEL, QUESTIONS_PER_DAY } from './config.js';

const QuestionSchema = z.object({
  category: z.string().describe('Short topic label, e.g. "React & Next.js" or "High-Level System Design"'),
  difficulty: z.enum(['Easy', 'Medium', 'Hard']),
  tag: z.string().describe('The focus company name if this question is tied to that company, otherwise "Industry Common"'),
  question: z.string(),
  simpleTake: z.string().describe('The answer in very simple everyday words: short sentences, an everyday analogy, no unexplained jargon'),
  realStory: z.string().describe('A concrete story showing the concept in the real world'),
  rememberIt: z.string().describe('One memorable sentence / analogy'),
  commonMistake: z.string().describe('What candidates usually get wrong and the better answer'),
});

const DigestSchema = z.object({
  questions: z.array(QuestionSchema),
});

const SYSTEM_PROMPT = `You write a daily interview-prep email for one specific engineer. Your job is to pick the questions that are actually asked in real interviews for their target roles, and explain each one so it sticks.

The engineer:
${CANDIDATE_PROFILE}

How to write each question:
- "question": phrased the way an interviewer would ask it. Mix conceptual, debugging/"what happens when", and design questions. Prefer questions that come up in real SDE-2 / senior full-stack loops over trivia.
- "simpleTake": explain the answer the way you'd explain it to a friend over chai who is new to tech. Use short sentences (under ~15 words each) and everyday words. Start with an everyday comparison (a restaurant, a queue at a bank, a library...) and then map it back to the tech. If you must use a technical term, explain it right away in plain words in brackets, e.g. "a cache (a quick-access copy kept close by)". Still cover the 2-3 key points an interviewer listens for, just in plain words. Around 60-90 words.
- "realStory": a concrete story. Use well-documented public engineering stories (company engineering blogs, famous outages, postmortems, open-source history) only when you are confident of the facts. Otherwise write a realistic scenario framed honestly ("A fintech team...", "Imagine a Next.js e-commerce site..."), never presented as a real named company's history. Stories that resemble the engineer's own stack (NestJS microservices, SQS, Redis, Next.js, MongoDB, payments) are a plus.
- "rememberIt": one punchy sentence or analogy.
- "commonMistake": the typical weak answer and what the stronger answer adds.

Each field is plain text (no markdown, no bullet characters). Keep each field to roughly 60-120 words.`;

// Uses the Claude Code CLI, so it runs on your Claude subscription login
// (locally) or CLAUDE_CODE_OAUTH_TOKEN from `claude setup-token` (in CI).
function claudeBinary() {
  if (process.env.CLAUDE_BIN) return process.env.CLAUDE_BIN;
  if (process.platform === 'win32') {
    // On Windows `claude` is a .ps1/.cmd shim that can't be spawned without a shell.
    return path.join(process.env.APPDATA, 'npm', 'node_modules', '@anthropic-ai', 'claude-code', 'bin', 'claude.exe');
  }
  return 'claude';
}

function runClaude(prompt) {
  const args = [
    '-p',
    '--output-format', 'json',
    '--json-schema', JSON.stringify(z.toJSONSchema(DigestSchema, { target: 'draft-07' })),
    '--system-prompt', SYSTEM_PROMPT,
    '--tools', '',
    '--model', MODEL,
    '--no-session-persistence',
  ];

  return new Promise((resolve, reject) => {
    const child = spawn(claudeBinary(), args, { stdio: ['pipe', 'pipe', 'pipe'] });
    let stdout = '';
    let stderr = '';
    const timer = setTimeout(() => {
      child.kill();
      reject(new Error('claude CLI timed out after 15 minutes'));
    }, 15 * 60_000);

    child.stdout.on('data', (d) => (stdout += d));
    child.stderr.on('data', (d) => (stderr += d));
    child.on('error', (err) => {
      clearTimeout(timer);
      reject(new Error(`Could not start the claude CLI (${err.message}). Install it with: npm i -g @anthropic-ai/claude-code`));
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      if (code !== 0) return reject(new Error(`claude CLI exited with ${code}\n${stderr || stdout}`));
      resolve(stdout);
    });

    child.stdin.end(prompt);
  });
}

export async function generateDigest({ tracks, company, dateLabel, pastQuestions, day, level }) {
  const pastBlock = pastQuestions.length
    ? `Questions already sent on previous days — do NOT repeat these or ask near-duplicates:\n${pastQuestions.map((q) => `- ${q}`).join('\n')}`
    : 'No previous questions yet.';

  const userPrompt = `Today is ${dateLabel}.
Today's tracks: "${tracks[0]}" and "${tracks[1]}". Focus company: ${company}.

Write exactly ${QUESTIONS_PER_DAY} questions:
- 2 from "${tracks[0]}", 2 from "${tracks[1]}", and 1 from any other area of the MERN + system design stack (JavaScript, TypeScript, React, Next.js, Node.js, Express, NestJS, MongoDB, PostgreSQL, Redis, REST/GraphQL/WebSockets, AWS, Docker, testing, HLD, LLD).
- 1 or 2 must be tied to ${company}: questions known to be asked in ${company}'s interviews, or design problems based on ${company}'s product (set "tag" to "${company}" for those; "Industry Common" for the rest).
- this is day ${day} of the engineer's prep ("${level.label}" level). Difficulty mix: exactly ${level.easy} Easy, ${level.medium} Medium, ${level.hard} Hard.
  Easy = core fundamentals every candidate must nail; Medium = applying them / common follow-ups; Hard = senior-level design, trade-offs and edge cases.${day <= 7 ? '\n  It is early in the prep: keep even the Medium questions approachable, and build confidence before depth.' : ''}
- order them from easiest to hardest (all Easy first, then Medium, then Hard).

${pastBlock}`;

  const result = JSON.parse(await runClaude(userPrompt));
  if (result.is_error || !result.structured_output) {
    throw new Error(`claude CLI did not return structured output: ${result.subtype ?? ''} ${result.result ?? ''}`);
  }

  const { questions } = DigestSchema.parse(result.structured_output);
  console.log(`Generated ${questions.length} questions in ${Math.round(result.duration_ms / 1000)}s`);
  return questions;
}
