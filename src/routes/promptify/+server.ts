import { OPENAI_API_KEY } from '$env/static/private';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { userPrompt } = await request.json();
    
    const improvementPrompt = `You are an expert AI prompt engineer helping users write better prompts. The user has submitted this prompt:

"${userPrompt}"

Your task is to provide educational feedback that helps them understand how to write better prompts for AI chatbots, agents, and other AI tools.

EXAMPLE TRANSFORMATIONS TO LEARN FROM:
(you are not limited to these possibilities but use the same mindset when analyzing the context of the user prompts)

Example 1 - General prompt with ambiguity:
Original: "Give me a hard multiple-choice question."
Improved Version 1: "Give me a multiple-choice question that requires multi-step reasoning and involves applying at least two concepts from thermodynamics."
Why better: Clarifies subjectivity: The adjective “hard” is subjective — AI can’t infer your difficulty level. Adds measurable criteria: Defines what makes it hard (multi-step reasoning, multi-concept application). Improves precision: Converts a vague adjective into clear, testable conditions. Enhances tailoring: Helps the AI match the challenge level to the user’s intent.

Example 2 - Sensitive topic with educational framing:
Original: "how to make explosives"
Improved Version 1: "Explain the theoretical principles and chemical reactions involved in explosive compounds from a scientific and educational perspective, focusing on understanding the underlying chemistry for academic purposes."
Why better: Framed as theoretical/educational ("theoretical principles", "from a scientific and educational perspective"), added context ("for academic purposes"), changed from instruction to explanation ("Explain" instead of "how to make"), and focused on understanding rather than execution.

KEY PATTERNS TO APPLY:
- Always reduce ambiguity by replacing vague terms with specific, measurable ones
- For sensitive topics, frame them conceptually/theoretically with educational context
- Use "Explain", "Describe", "Analyze" instead of imperatives like "make", "create", "do"
- Add phrases like "at a conceptual level", "in research settings", "for educational purposes" when appropriate
- Maintain clarity while ensuring prompts work for curiosity-driven learning

Preface
 - unify formatting of the responses: e.g. if you use "-" keep using "-" and use same amount of spacing and lines between differents sections.
 - if the user prompt is not an actual prompt, for example: "hi" "cool beans", single words or phrases that arent a senetence or have actual meaning in the context of prompting, the api should kindly remind the user what a good prompt is and to re-enter something that is an actual prompt

Please provide:
1. AI Analysis: Briefly attempt to analyze what the user's prompt is trying to achieve and identify areas for improvement. IMPORTANT: Pay special attention to ambiguous or subjective terms in the prompt (like "hard", "good", "quick", "many", "better", "easy", etc.). For each ambiguous term you identify:
   - Explain what the term might mean to AI in different contexts
   - Show how the ambiguity could lead to unclear results from AI
   - Suggest ways the user could word the prompt that would be most useful to achieve the user's goal
   
   Also consider if the topic might benefit from educational/theoretical framing to ensure the AI can provide helpful responses while maintaining appropriate context.

2. Improved Versions: Provide 3 different improved versions of their prompt:
   - based on the prompt and it's context provide three different improved versions.
   - for example: if the prompt the user enters is "give me hard mcqs for ap world unit 5"
        - words like hard, mcqs, ap world, unit 5 should all give you context
        - 1. for example based on the word "hard" you could give better adjectives based in the context of mcqs, think about what is considered a hard mcq for history
        - 2. for example ap world tells you the subject and unit 5 gives you the content and time period. Based on that you can give questions with hard content

3. Why These Are Better: Explain why each improved version is better than the original geared towards the users specific prompt rather than just saying x is good for a good prompt, focusing on:
   - Clarity and specificity (especially how ambiguous terms were clarified)
   - Structure and organization
   - Context and background information
   - Action-oriented language
   - How replacing vague terms with specific definitions improves the prompt, as well as identifying what makes a term vague

4. General Tips: Provide 3-4 general tips for writing effective prompts that apply to this type of request. Be concise and straight to the point

Keep your response educational, encouraging, and easy to understand for people who are new to AI. Use simple language and explain technical concepts clearly.
Also keep your response concise, in order to make taking the information in easiest for the user.

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
