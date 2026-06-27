// Local AI-tutor proxy for the project learning guide (topic deep dives).
//
//   POST /topic-chat -> a grounded, conversational answer about ONE topic.
//   GET  /health     -> config + whether a key is present (the page polls this).
//
// Why a proxy?
//   1. The OpenCode Zen API key must NEVER live in the browser / in index.html.
//      The page POSTs here; this server holds the key and calls Zen.
//   2. OpenCode Zen does not send CORS headers, so a browser cannot call it
//      directly. This proxy adds the CORS headers the page needs.
//
// OpenCode Zen is OpenAI-compatible, so we point the OpenAI SDK at its base URL.
//
// Run:  npm install && npm start    (Node 20.6+; reads OPENCODE_ZEN_API_KEY from .env)
// Nothing here touches application source — it only explains it.

import http from 'node:http';
import OpenAI from 'openai';

const PORT = process.env.PORT || 8788;
const BASE_URL = process.env.OPENCODE_ZEN_BASE_URL || 'https://opencode.ai/zen/v1';
// Set OPENCODE_ZEN_MODEL to any model your Zen key can use (see https://opencode.ai/zen).
const MODEL = process.env.OPENCODE_ZEN_MODEL || 'grok-code';

// Lazy client so the server still boots (and returns a clean error) when the key
// isn't set yet — instead of crashing at startup.
let _client;
function getClient() {
  if (!_client) {
    if (!process.env.OPENCODE_ZEN_API_KEY) {
      throw new Error(
        'OPENCODE_ZEN_API_KEY is not set. Put it in tutor-server/.env, then restart the proxy.',
      );
    }
    _client = new OpenAI({
      baseURL: BASE_URL,
      apiKey: process.env.OPENCODE_ZEN_API_KEY,
    });
  }
  return _client;
}

// The tutor is grounded ENTIRELY in the context the page sends (the generated
// topic section: its explanation, its cited file paths). It must not invent files
// or behavior. This mirrors the auditor's "No invention" rule.
function buildSystem(topic, grounding) {
  return `You are a patient, concise coding mentor helping a developer understand ONE
specific topic in their own codebase: "${topic || 'this topic'}".

Answer conversationally in 2-6 sentences. Stay on this topic. Ground every claim in
the CONTEXT below — it is an excerpt of the project's own learning guide for this
topic, including the real file paths it cites. When useful, name ONE real file path
from the context. If the user asks something the context does not cover, say
"Not detected from the current guide content for this topic." rather than inventing
files, line numbers, or behavior. You explain what exists; do not propose code
changes unless the user explicitly asks you to brainstorm.

CONTEXT (the guide's section for this topic):
${(grounding || '').slice(0, 8000) || '(no context was provided)'}`;
}

// System prompt for /generate: produce repo-grounded comprehension questions.
function buildGenerateSystem(grounding) {
  return `You generate comprehension questions for a developer studying THEIR OWN
codebase, grounded ONLY in the guide content below. Return ONLY a JSON object of the
exact form {"questions":[{"question":"...","answer":"...","file":"path or n/a"}]}.
No prose, no markdown code fences. Each question must be answerable from the guide
content; vary the type (what/where, trace-the-flow, find-the-file, spot-the-risk,
old-vs-modern) and the difficulty. Put a real file path from the content in "file"
when one applies, otherwise "n/a". Never invent files, lines, or behavior.

GUIDE CONTENT (the learning guide for this repo):
${(grounding || '').slice(0, 9000) || '(no content was provided)'}`;
}

// Lenient JSON parse: tolerate code fences and surrounding prose.
function parseLooseJson(text) {
  let t = String(text || '').trim();
  t = t.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '');
  const a = t.indexOf('{');
  const b = t.lastIndexOf('}');
  if (a >= 0 && b > a) t = t.slice(a, b + 1);
  try {
    return JSON.parse(t);
  } catch {
    return null;
  }
}

function cleanString(value, maxLength = 4000) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLength);
}

function cleanConversation(messages) {
  if (!Array.isArray(messages)) return [];
  return messages
    .filter(
      (m) =>
        m &&
        (m.role === 'user' || m.role === 'assistant') &&
        typeof m.content === 'string' &&
        m.content.trim(),
    )
    .map((m) => ({ role: m.role, content: cleanString(m.content) }));
}

function send(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  });
  res.end(JSON.stringify(body));
}

async function readJson(req) {
  let raw = '';
  for await (const chunk of req) raw += chunk;
  try {
    return JSON.parse(raw || '{}');
  } catch {
    return {};
  }
}

function apiError(err) {
  const message = err?.error?.message ?? err?.message ?? 'Request failed.';
  const status = typeof err?.status === 'number' ? err.status : 500;
  return { status: status >= 400 && status < 600 ? status : 500, message };
}

async function handleTopicChat(body, res) {
  const topic = cleanString(body.topic, 200);
  const grounding = cleanString(body.grounding, 12000);
  const turns = cleanConversation(body.messages).slice(-20);

  if (!turns.length || turns[turns.length - 1].role !== 'user') {
    return send(res, 400, {
      error: 'Send { topic, grounding, messages } ending in a user message.',
    });
  }

  // Note: omit `temperature` — some Zen models only accept the default value.
  const completion = await getClient().chat.completions.create({
    model: MODEL,
    messages: [{ role: 'system', content: buildSystem(topic, grounding) }, ...turns],
  });

  const choice = completion.choices?.[0];
  if (choice?.message?.refusal) return send(res, 200, { answer: choice.message.refusal });
  const answer = choice?.message?.content;
  if (!answer) return send(res, 502, { error: 'Model returned no output.' });
  return send(res, 200, { answer });
}

async function handleGenerate(body, res) {
  const grounding = cleanString(body.grounding, 12000);
  const topic = cleanString(body.topic, 200) || 'this whole project';
  const count = Math.min(Math.max(parseInt(body.count, 10) || 5, 1), 10);

  const completion = await getClient().chat.completions.create({
    model: MODEL,
    messages: [
      { role: 'system', content: buildGenerateSystem(grounding) },
      { role: 'user', content: `Generate ${count} fresh comprehension questions about: ${topic}.` },
    ],
  });

  const choice = completion.choices?.[0];
  if (choice?.message?.refusal) return send(res, 200, { error: choice.message.refusal });
  const text = choice?.message?.content;
  if (!text) return send(res, 502, { error: 'Model returned no output.' });

  const parsed = parseLooseJson(text);
  if (!parsed || !Array.isArray(parsed.questions)) {
    return send(res, 502, { error: 'Model output was not valid question JSON.' });
  }
  const questions = parsed.questions
    .filter((q) => q && typeof q.question === 'string' && typeof q.answer === 'string')
    .slice(0, count)
    .map((q) => ({
      question: cleanString(q.question, 600),
      answer: cleanString(q.answer, 2000),
      file: cleanString(q.file, 200),
    }));
  return send(res, 200, { questions });
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204, {});
  const route = (req.url || '').split('?')[0];

  // tiny health check so the page can light up the tutor as ON/OFF.
  if (req.method === 'GET' && route.startsWith('/health')) {
    return send(res, 200, {
      ok: true,
      model: MODEL,
      baseUrl: BASE_URL,
      endpoints: ['/topic-chat', '/generate'],
      hasKey: !!process.env.OPENCODE_ZEN_API_KEY,
    });
  }
  if (req.method !== 'POST') {
    return send(res, 404, { error: 'Use POST /topic-chat, POST /generate, or GET /health.' });
  }

  const body = await readJson(req);
  try {
    if (route.startsWith('/topic-chat')) return await handleTopicChat(body, res);
    if (route.startsWith('/generate')) return await handleGenerate(body, res);
    return send(res, 404, { error: 'Not found. POST /topic-chat or /generate.' });
  } catch (err) {
    const { status, message } = apiError(err);
    return send(res, status, { error: message });
  }
});

server.listen(PORT, () => {
  console.log(`Project-learning tutor proxy running on http://localhost:${PORT}`);
  console.log(
    `Model: ${MODEL} via ${BASE_URL} — POST /topic-chat, POST /generate, GET /health. Reads OPENCODE_ZEN_API_KEY from env / .env.`,
  );
});
