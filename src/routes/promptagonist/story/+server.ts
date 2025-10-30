import { OPENAI_API_KEY } from '$env/static/private';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { prompt, evaluation, scenario } = await request.json();
    
    const storyPrompt = `You are a creative storyteller. Continue this story based on the user's prompt and their prompt quality score.
      
Scenario: ${scenario.title}
Context: ${scenario.initialContext}
User's Prompt: "${prompt}"
Prompt Quality Score: ${evaluation.overallScore}/10
      
${evaluation.overallScore >= 8 ? 
  'HIGH QUALITY PROMPT: Write an exciting, successful story continuation with positive outcomes, character success, and engaging plot developments.' :
  evaluation.overallScore >= 6 ?
  'MEDIUM QUALITY PROMPT: Write a story continuation that progresses but with some challenges, awkward moments, or minor setbacks.' :
  'LOW QUALITY PROMPT: Write a story continuation with chaotic events, character failures, or unexpected obstacles due to the vague prompt.'}

Keep the response to 2-3 sentences. Make it engaging and continue the story naturally.`;

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
            content: 'You are a creative storyteller who adapts story outcomes based on prompt quality.'
          },
          {
            role: 'user',
            content: storyPrompt
          }
        ],
        temperature: 0.8,
        max_tokens: 200
      })
    });
    
    const data = await response.json();
    return json({ response: data.choices[0].message.content.trim() });
    
  } catch (error) {
    console.error('Story generation API error:', error);
    return json({ error: 'Sorry, I encountered an error generating the story response. Please try again.' });
  }
};
