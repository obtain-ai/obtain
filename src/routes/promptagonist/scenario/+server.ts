import { OPENAI_API_KEY } from '$env/static/private';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

interface GeneratedScenario {
  title: string;
  description: string;
  initialContext: string;
  genre: string;
}

function parseScenarioJson(text: string): Record<string, unknown> {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Scenario generator did not return JSON');
    return JSON.parse(match[0]);
  }
}

function toSafeString(value: unknown, fallback: string): string {
  if (typeof value !== 'string') return fallback;
  const normalized = value.trim();
  return normalized || fallback;
}

function normalizeScenario(raw: Record<string, unknown>): GeneratedScenario {
  return {
    title: toSafeString(raw.title, 'Unexpected Adventure'),
    description: toSafeString(raw.description, 'A strange situation unfolds and your choices shape what happens next.'),
    initialContext: toSafeString(
      raw.initialContext,
      'You arrive at a crossroads with limited information, rising stakes, and one chance to act decisively.'
    ),
    genre: toSafeString(raw.genre, 'Adventure')
  };
}

export const POST: RequestHandler = async () => {
  try {
    const prompt = `Generate a random interactive story scenario for a prompt-training game.

Return ONLY valid JSON in this exact shape:
{
  "title": "short scenario title",
  "description": "one sentence hook",
  "initialContext": "2-4 sentence starting situation with a clear challenge",
  "genre": "genre label"
}

Requirements:
- Be highly varied and unpredictable across genres, settings, and tones.
- Keep content appropriate for general audiences.
- Give the player a concrete decision or mission to act on.
- Avoid repeating common cliches when possible.
- Do not include markdown or extra keys.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You create diverse interactive story scenarios and always return strict JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 1.2,
        max_tokens: 260
      })
    });

    if (!response.ok) {
      throw new Error(`Scenario API request failed with ${response.status}`);
    }

    const data = await response.json();
    const scenarioText = data.choices?.[0]?.message?.content;
    if (typeof scenarioText !== 'string') {
      throw new Error('Scenario API response missing content');
    }

    const parsed = parseScenarioJson(scenarioText);
    return json(normalizeScenario(parsed));
  } catch (error) {
    console.error('Scenario generation API error:', error);
    return json({ error: 'Unable to generate a random scenario right now.' }, { status: 500 });
  }
};
