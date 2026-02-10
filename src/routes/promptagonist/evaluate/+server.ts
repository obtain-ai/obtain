import { OPENAI_API_KEY } from '$env/static/private';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

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
1. Clarity (1-10): How clear and understandable is the prompt? A straightforward sentence should score at least 5-6.
2. Specificity (1-10): How much useful detail or direction does the prompt provide? A reasonable sentence with some context should score at least 4-5.
3. AI Interpretability (1-10): How easy is it for an AI to understand and act on this prompt? Any coherent, grammatical sentence should score at least 5-6.

Scoring guide: 1-3 = genuinely incoherent or empty, 4-5 = basic but understandable, 6-7 = good with room to improve, 8-9 = strong and detailed, 10 = exceptional. Do NOT give scores below 4 unless the prompt is truly nonsensical or empty.

Respond in this exact JSON format:
{
  "clarity": [number],
  "specificity": [number], 
  "aiInterpretability": [number],
  "overallScore": [average of the three scores],
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
        temperature: 0.3,
        max_tokens: 300
      })
    });
    
    const data = await response.json();
    const evaluationText = data.choices[0].message.content;
    const evaluation = JSON.parse(evaluationText);
    
    return json(evaluation);
    
  } catch (error) {
    console.error('Evaluation API error:', error);
    return json({
      clarity: 5,
      specificity: 5,
      aiInterpretability: 5,
      overallScore: 5,
      feedback: 'Unable to evaluate prompt. Please try again.'
    });
  }
};
