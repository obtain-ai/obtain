import { OPENAI_API_KEY } from '$env/static/private';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

interface PromptEvaluation {
  clarity: number;
  specificity: number;
  aiInterpretability: number;
  actionability: number;
  overallScore: number;
  feedback: string;
}

function clampScore(value: number, min = 1, max = 10): number {
  return Math.max(min, Math.min(max, value));
}

function roundToTenth(value: number): number {
  return Math.round(value * 10) / 10;
}

function coerceScore(value: unknown, fallback: number): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return clampScore(value);
  }
  return fallback;
}

function parseEvaluationJson(text: string): Record<string, unknown> {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\{[\s\S]*\}/);
    if (!match) throw new Error('Evaluator did not return JSON');
    return JSON.parse(match[0]);
  }
}

function normalizeEvaluation(raw: Record<string, unknown>, userPrompt: string): PromptEvaluation {
  let clarity = coerceScore(raw.clarity, 5);
  let specificity = coerceScore(raw.specificity, 5);
  let aiInterpretability = coerceScore(raw.aiInterpretability, 5);
  let actionability = coerceScore(raw.actionability, 5);
  const feedback = typeof raw.feedback === 'string' && raw.feedback.trim()
    ? raw.feedback.trim()
    : 'Decent start. Add clearer action steps and scenario detail for a stronger prompt.';

  const normalizedPrompt = userPrompt.trim();
  const hasLetters = /[a-z]/i.test(normalizedPrompt);
  const wordCount = normalizedPrompt.split(/\s+/).filter(Boolean).length;
  const coherentShortPrompt = hasLetters && wordCount >= 2;
  const actionVerbPattern = /\b(go|ask|investigate|question|search|check|confront|collect|compare|analyze|interrogate|follow|track|inspect|plan|build|pitch|negotiate|escape|attack|defend|explore|gather)\b/i;
  const lowActionVaguePrompt = coherentShortPrompt && wordCount <= 4 && !actionVerbPattern.test(normalizedPrompt);

  // Coherent prompts should not collapse to the 1-3 band unless they are gibberish.
  if (coherentShortPrompt) {
    clarity = Math.max(4, clarity);
    aiInterpretability = Math.max(4, aiInterpretability);
    specificity = Math.max(4, specificity);
    actionability = Math.max(3, actionability);
  }

  // Very short emotional/vague statements should score lower than "good" prompts.
  if (lowActionVaguePrompt) {
    specificity = Math.min(specificity, 4);
    actionability = Math.min(actionability, 4);
  }

  const baseAverage = (clarity + specificity + aiInterpretability + actionability) / 4;

  // Gentle inflation: add ~1 point for clearly good, actionable prompts.
  const qualifiesForBoost = baseAverage >= 6.5 && actionability >= 6 && specificity >= 6;
  const boostedAverage = qualifiesForBoost ? baseAverage + 1 : baseAverage;
  const overallScore = roundToTenth(clampScore(boostedAverage));

  // Keep vague, low-action one-liners around ~4-5 instead of over-scoring.
  const finalOverall = lowActionVaguePrompt ? Math.min(overallScore, 4.9) : overallScore;

  return {
    clarity: roundToTenth(clarity),
    specificity: roundToTenth(specificity),
    aiInterpretability: roundToTenth(aiInterpretability),
    actionability: roundToTenth(actionability),
    overallScore: roundToTenth(finalOverall),
    feedback
  };
}

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { prompt, scenario } = await request.json();
    
    const evaluationPrompt = `Evaluate this prompt for a story scenario. Rate each aspect from 1-10 and provide feedback.
      
Scenario: ${scenario.title} - ${scenario.initialContext}
User's Prompt: "${prompt}"

IMPORTANT: Only if the user's prompt contains INAPPROPRIATE content (explicitly sexual/pornographic material, detailed suicide/self-harm instructions, graphic eating disorder content, or racial/sexual orientation slurs)(if the intent is unclear, don't flag it), you should:
1. Still provide normal feedback with analysis, improved versions, and tips
2. Do NOT quote or build off the inappropriate parts
3. At the end, append: "⚠️ Please avoid inappropriate content such as explicit sexual material, graphic violence, self-harm, or offensive slurs in your prompts."

Rate the prompt fairly and constructively on:
1. Clarity (1-10): Is the language clear and understandable?
2. Specificity (1-10): Does it include useful detail and context?
3. AI Interpretability (1-10): Can an AI reliably understand and execute it?
4. Actionability (1-10): Does it use clear action-oriented language with concrete next steps?

Calibration rules:
- 1-3 ONLY for empty, incoherent, or gibberish prompts.
- A short vague emotional statement (example: "im frustrated") should generally be around 4-5, not high.
- 6-7 = good prompt, understandable with direction.
- 8-9 = strong, specific, and action-oriented.
- 10 = exceptional, precise, and highly actionable.

Respond in this exact JSON format:
{
  "clarity": [number],
  "specificity": [number], 
  "aiInterpretability": [number],
  "actionability": [number],
  "overallScore": [average of the four scores],
  "feedback": "[constructive feedback message]"
}`;

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
            content: 'You are an expert prompt evaluator. Always respond with valid JSON.'
          },
          {
            role: 'user',
            content: evaluationPrompt
          }
        ],
        temperature: 0.1,
        max_tokens: 300
      })
    });
    
    const data = await response.json();
    const evaluationText = data.choices[0].message.content;
    const parsedEvaluation = parseEvaluationJson(evaluationText);
    const evaluation = normalizeEvaluation(parsedEvaluation, prompt);
    
    return json(evaluation);
    
  } catch (error) {
    console.error('Evaluation API error:', error);
    return json({
      clarity: 5,
      specificity: 5,
      aiInterpretability: 5,
      actionability: 5,
      overallScore: 5,
      feedback: 'Unable to evaluate prompt. Please try again.'
    });
  }
};
