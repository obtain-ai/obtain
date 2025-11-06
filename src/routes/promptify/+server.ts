import { OPENAI_API_KEY } from '$env/static/private';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { userPrompt } = await request.json();
    
    const improvementPrompt = `You are an expert AI prompt engineer helping users write better prompts. The user has submitted this prompt:

"${userPrompt}"

Your task is to provide educational feedback that helps them understand how to write better prompts for AI chatbots, agents, and other AI tools.

Please provide:

1. Analysis: Briefly analyze what the user's prompt is trying to achieve and identify areas for improvement. IMPORTANT: Pay special attention to ambiguous or subjective terms in the prompt (like "hard", "good", "quick", "many", "better", "easy", etc.). For each ambiguous term you identify:
   - Explain what the term might mean in different contexts
   - Show how the ambiguity could lead to unclear results
   - Suggest what specific meaning would be most useful for the user's goal

2. 3 Improved Versions: Provide 3 different improved versions of their prompt:
   - Version 1: More specific and detailed (make sure to replace ambiguous terms with concrete, measurable criteria)
   - Version 2: Better structured with clear sections
   - Version 3: More creative and engaging approach

3. Why These Are Better: Explain why each improved version is better than the original, focusing on:
   - Clarity and specificity (especially how ambiguous terms were clarified)
   - Structure and organization
   - Context and background information
   - Action-oriented language
   - How replacing vague terms with specific definitions improves the prompt

4. General Tips: Provide 3-4 general tips for writing effective prompts that apply to this type of request.

Keep your response educational, encouraging, and easy to understand for people who are new to AI. Use simple language and explain technical concepts clearly.

Format your response with clear headings and bullet points for easy reading.`;
    
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
            content: 'You are an expert AI prompt engineer and educator. Help users write better prompts by providing clear, educational feedback with specific examples and actionable tips.'
          },
          {
            role: 'user',
            content: improvementPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 800
      })
    });
    
    const data = await response.json();
    return json({ response: data.choices[0].message.content.trim() });
    
  } catch (error) {
    console.error('API error:', error);
    return json({ error: 'API call failed' }, { status: 500 });
  }
};
