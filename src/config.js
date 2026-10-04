'use strict';

const fs = require('fs');
const path = require('path');

/** Minimal .env loader (no dependency). Existing environment variables win. */
function loadEnvFile(file = path.join(__dirname, '..', '.env')) {
  let text;
  try {
    text = fs.readFileSync(file, 'utf8');
  } catch {
    return;
  }
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq < 1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"') && val.length >= 2) ||
      (val.startsWith("'") && val.endsWith("'") && val.length >= 2)
    ) {
      val = val.slice(1, -1);
    } else {
      val = val.replace(/\s+#.*$/, '');
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

const PROVIDER_DEFAULTS = {
  gemini: {
    model: 'gemini-2.5-flash',
    baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
  },
  openai: { model: 'gpt-4o-mini', baseUrl: 'https://api.openai.com/v1' },
  anthropic: {
    model: 'claude-haiku-4-5-20251001',
    baseUrl: 'https://api.anthropic.com/v1',
  },
};

/** Reads AI settings from the environment on every call (so changes/tests apply). */
function getAiConfig(env = process.env) {
  const provider = (env.AI_PROVIDER || 'gemini').trim().toLowerCase();
  const defaults = PROVIDER_DEFAULTS[provider];
  if (!defaults) {
    return {
      provider,
      configured: false,
      error: `Unsupported AI_PROVIDER "${provider}". Use gemini, openai, or anthropic.`,
    };
  }
  const apiKey = (env.AI_API_KEY || '').trim();
  const baseUrl = (env.AI_BASE_URL || '').trim().replace(/\/+$/, '') || defaults.baseUrl;
  const isLocal =
    provider === 'openai' && /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:|\/|$)/i.test(baseUrl);
  const timeoutMs = Number(env.AI_TIMEOUT_MS) > 0 ? Number(env.AI_TIMEOUT_MS) : 45000;
  return {
    provider,
    apiKey,
    baseUrl,
    model: (env.AI_MODEL || '').trim() || defaults.model,
    timeoutMs,
    configured: Boolean(apiKey) || isLocal,
  };
}

module.exports = { loadEnvFile, getAiConfig, PROVIDER_DEFAULTS };
