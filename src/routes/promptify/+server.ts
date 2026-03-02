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

Preface: 
- If the user prompt is not an actual prompt (e.g. "hi", "cool beans", single words or phrases that aren't a sentence or have no meaning in the context of prompting), kindly remind the user what a good prompt is and ask them to re-enter an actual prompt. Otherwise, you MUST use the exact format below.
- For all responses, follow the regulations:
    If the user includes subjective or evaluative adjectives (such as hard, easy, challenging, advanced, basic, detailed, simple, complex, creative, strange, good, better, strong, weak, quick, deep, or similar terms), you must treat them as underspecified task modifiers.
    You must reinterpret these adjectives as requests to adjust one or more of the following dimensions:
    Content Complexity — level of subject matter, abstraction, scope, or prerequisite knowledge.
    Cognitive Complexity — type of reasoning required, such as method selection, inference from incomplete information, translation between representations, justification of reasoning, or avoiding common heuristic traps.
    Structural Constraints — length, format, number of steps, number of concepts involved, or response structure.
    Perspective or Framing — tone, creativity constraints, unusual viewpoints, or non-standard contexts.
    If the app does not support follow-up interaction, you must generate two improved versions that reflect two different plausible interpretations of the adjective across these dimensions.
    If the adjective implies reduced difficulty (such as easy or simple), adjust complexity downward either by reducing conceptual scope (content) or reducing reasoning depth (cognitive), and provide two plausible interpretations if unclear.
    Never simply replace the adjective with a synonym. Always translate it into measurable constraints.
    OUTPUT FORMAT (use this structure every time; do not use bullet points or dashes under AI Analysis):

**AI Analysis:**
Write 2 to 3 sentences only. Analyze what the user's prompt is trying to achieve and identify areas for improvement. 
Pay attention to ambiguous or subjective terms (e.g. "hard", "good", "quick", "many", "better", "easy"). 
Explain what might be unclear to the AI and how the ambiguity could lead to unhelpful results. Use only plain sentences—no bullet points and no dashes.

**Improved Versions:**
Provide exactly 2 improved versions of their prompt. Write each as a single, complete sentence (2 sentences total). DO NOT use subjective adjectives or unclear phrases
Base them on the prompt's context and the improvements identified in your analysis. 
For example, if the user enters "give me hard mcqs for ap world unit 5", words like hard, mcqs, ap world, unit 5 should all give you context: (1) based on "hard" you could give better adjectives in the context of MCQs, e.g. what is considered a hard MCQ for history; (2) ap world gives you the subject and unit 5 gives you the content and time period, so you can give questions with appropriately challenging content.
For BOTH versions, follow the following:
  If the user includes subjective or evaluative adjectives (such as hard, easy, challenging, advanced, basic, detailed, simple, complex, creative, strange, good, better, strong, 
    weak, quick, deep, or similar terms), you must treat them as underspecified task modifiers.
  You must reinterpret these adjectives as requests to adjust one or more of the following dimensions:
  Content Complexity — level of subject matter, abstraction, scope, or prerequisite knowledge.
  Cognitive Complexity — type of reasoning required, such as method selection, inference from incomplete information, translation between representations, justification of reasoning, or avoiding common heuristic traps.
  Structural Constraints — length, format, number of steps, number of concepts involved, or response structure.
  Perspective or Framing — tone, creativity constraints, unusual viewpoints, or non-standard contexts.
  If the adjective implies reduced difficulty (such as easy or simple), adjust complexity downward either by reducing conceptual scope (content) or reducing reasoning depth (cognitive), and provide two plausible interpretations if unclear.
  Never simply replace the adjective with a synonym. Always translate it into measurable constraints.

**Why These Are Better:**
Choose exactly 2 reasons from this list that best fit what the user's prompt is lacking (use bold for the reason label, then one sentence of explanation per reason):
- Clarity and specificity (especially how ambiguous terms were clarified)
- Structure and organization
- Context and background information
- Action-oriented language
- How replacing vague terms with specific definitions improves the prompt, and what makes a term vague
Keep your response educational, encouraging, and concise. Use simple language. Do not add extra sections or deviate from this three-part format.`;
    
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
            content: 'You are an expert AI prompt engineer and educator. You must always format your response in exactly three sections: **AI Analysis:** (2-3 sentences, no dashes or bullets), **Improved Versions:** (exactly 2 improved prompts as 2 sentences), **Why These Are Better:** (exactly 2 reasons from the allowed list, bold label + one sentence each).'
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
