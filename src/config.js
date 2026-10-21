// Who the questions are tailored for. Keep this in sync with your resume.
export const CANDIDATE_PROFILE = `
Full Stack Engineer (MERN + System Design), ~3.5 years of experience, targeting SDE-2 / Senior Full Stack roles.
- Current: Full Stack Engineer at Legalwiz.in — TypeScript React/Next.js frontends, Node.js/NestJS microservices on AWS
  (Lambda, SQS, S3, EventBridge, SES, CodeDeploy, CloudWatch), Redux, Tailwind, NextAuth, CI/CD with Jest + React Testing Library.
- Previous: Software Engineer at Ridgeant Technologies — REST, GraphQL and WebSocket APIs in Node.js/NestJS,
  PostgreSQL, MongoDB, Redis, Prisma ORM, data pipelines.
- Earlier: Associate Engineer at Mobio Solutions — Node.js/Express REST services, Docker, Razorpay payment integration.
- Strong in: JavaScript, TypeScript, React, Next.js, Node.js, Express, NestJS, MongoDB, PostgreSQL, Redis, Docker, AWS.
`.trim();

// One pair per day of the week cycle. Index rotates daily so every day feels different.
export const TRACK_PAIRS = [
  ['JavaScript & TypeScript Internals', 'High-Level System Design'],
  ['React & Next.js', 'Low-Level Design'],
  ['Node.js, Express & NestJS', 'High-Level System Design'],
  ['MongoDB & Databases', 'Backend & API Design'],
  ['React & Next.js', 'Performance & Scalability'],
  ['Node.js, Express & NestJS', 'Distributed Systems'],
  ['AWS, DevOps & Testing', 'High-Level System Design'],
];

// Rotates on a different cycle (prime length) than TRACK_PAIRS so pairings keep changing.
export const FOCUS_COMPANIES = [
  'Stripe', 'Uber', 'Atlassian', 'Razorpay', 'Flipkart', 'Swiggy', 'Zomato',
  'Amazon', 'Microsoft', 'Google', 'Netflix', 'Airbnb', 'PhonePe', 'CRED',
  'Postman', 'Zepto', 'Shopify',
];

export const QUESTIONS_PER_DAY = 10;

// How many past questions to show the model so it doesn't repeat itself.
export const HISTORY_WINDOW = 250;

// Passed to `claude --model`; "opus" always means the latest Opus.
export const MODEL = 'opus';
