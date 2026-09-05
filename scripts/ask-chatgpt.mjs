#!/usr/bin/env node
/**
 * The ChatGPT bridge — an adversarial reviewer and arithmetic checker sitting
 * between Claude and whatever it is about to publish.
 *
 * WHY THIS EXISTS. Three of the errors in the tariff work were caught late or
 * caught by the user rather than by me: the ebill.info.bd claim (reasoned from
 * day-one press coverage), "a 412-unit bill is identical across the amendment"
 * (caught by a test I happened to write), and "reduced every residential bill
 * by Tk 69.00, and by more below 75 units" (caught by the user; the truth is a
 * three-band schedule and the reduction is *smaller* below 75). Every one is a
 * confident sentence that nobody independently recomputed. That is the job.
 *
 * The reviewer is deliberately hostile: it is told to try to falsify, to prefer
 * REFUTED when uncertain, and never to be agreeable. Agreement from a model
 * that was asked to agree is worth nothing.
 *
 * USAGE
 *   node scripts/ask-chatgpt.mjs handoff.json          # review a handoff
 *   node scripts/ask-chatgpt.mjs --list-models          # what this key can call
 *   node scripts/ask-chatgpt.mjs --help
 *
 *   cat handoff.json | node scripts/ask-chatgpt.mjs -   # from stdin
 *
 * SETUP
 *   Put OPENAI_API_KEY in .env.local. That file is gitignored and must stay so;
 *   an API key in git is a key you have to rotate.
 *   Optionally set OPENAI_MODEL. There is no safe default to hardcode — model
 *   names change — so if the configured one is rejected the script lists what
 *   the key can actually reach instead of failing blind.
 *
 * HANDOFF SHAPE (what this script sends)
 *   {
 *     "task":    "one line: what the work is",
 *     "context": "what the reviewer needs to judge it, including sources",
 *     "claims":  [ { "id": "C1", "claim": "...", "basis": "..." } ],
 *     "arithmetic": [
 *       { "id": "A1", "statement": "51 kWh x 5.26 = Tk 268.26", "shownWorking": "..." }
 *     ],
 *     "question": "optional: anything specific to decide"
 *   }
 *
 * REPLY SHAPE (what it must return, enforced as JSON)
 *   {
 *     "verdicts":   [ { "id", "verdict": "CONFIRMED|REFUTED|UNSUPPORTED|UNCERTAIN",
 *                       "reasoning", "correction" } ],
 *     "arithmetic": [ { "id", "agrees": bool, "recomputed", "note" } ],
 *     "missed":     [ "things neither of us checked" ],
 *     "nextPrompt": "the instruction Claude should act on next"
 *   }
 *
 * The reviewer never touches this repository. It receives text and returns
 * text; every change stays under Claude's hands and the user's review.
 */
import { existsSync, readFileSync } from 'node:fs';
import { parse } from 'dotenv';

const ENV_FILES = ['.env.local', '.env', '.env.production.local'];

function readEnvValue(key) {
  const live = process.env[key]?.trim();
  if (live) return live;
  for (const file of ENV_FILES) {
    if (!existsSync(file)) continue;
    try {
      const val = parse(readFileSync(file))[key]?.trim();
      if (val) return val;
    } catch {
      /* a malformed env file is not this script's problem to report */
    }
  }
  return '';
}

const SYSTEM_PROMPT = `You are an adversarial reviewer and arithmetic checker for ESB PowerLine, a
Bangladesh energy-data publication whose credibility rests on never printing a figure a source did
not state.

Your job is to FALSIFY, not to help. You are the last check before something is published.

Rules:
1. Try to break every claim. Look for the reading that makes it false. State the specific
   counter-case, not a general caveat.
2. Recompute every arithmetic statement independently, from the inputs given, without reusing the
   answer offered. Show your own working. If you get a different number, say so plainly and give
   yours.
3. Default to REFUTED or UNSUPPORTED when you are uncertain. An agreeable reviewer is worthless.
   Confirming a wrong claim costs far more than wrongly doubting a right one.
4. Distinguish sharply between: the source says this (CONFIRMED); the source does not say this and
   it was inferred (UNSUPPORTED); and the source contradicts this (REFUTED).
5. Watch specifically for these failure modes, which have all actually occurred here:
   - a single headline number standing in for a schedule that varies by band
   - reasoning from press coverage instead of from the instrument
   - "every X" and "always" where the claim holds only over part of the range
   - a partial sum presented as a total
   - zero substituted for absent, or a percentage computed against a base of zero
   - a coincidence between two numbers read as corroboration
6. If a claim cannot be judged from what you were given, say what specific evidence would settle it.
   Do not guess and do not research.
7. Note anything important that the handoff did not think to ask about.
8. Finish with nextPrompt: one concrete, bounded instruction for what should happen next. If the
   work is sound, say so and make nextPrompt the next useful step rather than inventing a problem.

Answer with JSON only, matching the schema you are given. No prose outside it.`;

function usage() {
  console.log(`
ask-chatgpt — adversarial review + arithmetic check

  node scripts/ask-chatgpt.mjs <handoff.json>   review a handoff file
  node scripts/ask-chatgpt.mjs -                read the handoff from stdin
  node scripts/ask-chatgpt.mjs --list-models    list models this key can call
  node scripts/ask-chatgpt.mjs --help

Environment (from .env.local, which must stay gitignored):
  OPENAI_API_KEY   required
  OPENAI_MODEL     optional; the script tells you what is available if it is wrong
`);
}

async function listModels(apiKey) {
  const res = await fetch('https://api.openai.com/v1/models', {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  if (!res.ok) {
    console.error(`Could not list models: ${res.status} ${res.statusText}`);
    console.error(await res.text());
    process.exit(1);
  }
  const { data } = await res.json();
  const names = data.map((m) => m.id).sort();
  console.log(names.join('\n'));
  return names;
}

async function readStdin() {
  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  return Buffer.concat(chunks).toString('utf8');
}

async function main() {
  const [arg] = process.argv.slice(2);

  if (!arg || arg === '--help' || arg === '-h') {
    usage();
    process.exit(arg ? 0 : 1);
  }

  const apiKey = readEnvValue('OPENAI_API_KEY');
  if (!apiKey) {
    console.error(
      'No OPENAI_API_KEY found in the environment or in .env.local / .env.\n' +
        'Add it to .env.local (gitignored) as:  OPENAI_API_KEY=sk-...\n' +
        'Never commit it — a key in git is a key you have to rotate.',
    );
    process.exit(1);
  }

  if (arg === '--list-models') {
    await listModels(apiKey);
    return;
  }

  const raw = arg === '-' ? await readStdin() : readFileSync(arg, 'utf8');
  let handoff;
  try {
    handoff = JSON.parse(raw);
  } catch (err) {
    console.error(`Handoff is not valid JSON: ${err.message}`);
    process.exit(1);
  }

  const model = readEnvValue('OPENAI_MODEL') || 'gpt-5';

  const body = {
    model,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user',
        content:
          'Review the following. Return JSON only.\n\n' +
          JSON.stringify(handoff, null, 2) +
          '\n\nRequired reply schema:\n' +
          JSON.stringify(
            {
              verdicts: [
                {
                  id: 'string — the claim id',
                  verdict: 'CONFIRMED | REFUTED | UNSUPPORTED | UNCERTAIN',
                  reasoning: 'string — the specific counter-case or confirmation',
                  correction: 'string — the corrected statement, or empty if none needed',
                },
              ],
              arithmetic: [
                {
                  id: 'string',
                  agrees: true,
                  recomputed: 'string — your own working and result',
                  note: 'string',
                },
              ],
              missed: ['string — anything neither side checked'],
              nextPrompt: 'string — one bounded instruction for what to do next',
            },
            null,
            2,
          ),
      },
    ],
    response_format: { type: 'json_object' },
  };

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(`OpenAI returned ${res.status} ${res.statusText}\n${text}\n`);
    // A wrong model name is the single most likely failure and the cheapest to
    // fix, so resolve it here instead of making the caller guess twice.
    if (res.status === 404 || /model/i.test(text)) {
      console.error(`Model "${model}" was rejected. Models this key can call:\n`);
      await listModels(apiKey);
      console.error('\nSet the one you want as OPENAI_MODEL in .env.local.');
    }
    process.exit(1);
  }

  const json = await res.json();
  const content = json.choices?.[0]?.message?.content;
  if (!content) {
    console.error('No content in the reply:\n' + JSON.stringify(json, null, 2));
    process.exit(1);
  }

  // Print the parsed object so a malformed reply fails here, loudly, rather
  // than downstream where it would look like a review that found nothing.
  try {
    console.log(JSON.stringify(JSON.parse(content), null, 2));
  } catch {
    console.error('Reply was not valid JSON. Raw content follows.\n');
    console.log(content);
    process.exit(1);
  }

  // Named `tokens`, not `usage` — a `const usage` here shadows the usage()
  // function for the whole of main() and killed `--help` with a TDZ error the
  // first time this ran.
  const tokens = json.usage;
  if (tokens) {
    console.error(
      `\n[${model}] prompt ${tokens.prompt_tokens} · completion ${tokens.completion_tokens} · total ${tokens.total_tokens}`,
    );
  }
}

main().catch((err) => {
  console.error(err?.stack ?? String(err));
  process.exit(1);
});
