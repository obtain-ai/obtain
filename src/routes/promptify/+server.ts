import { OPENAI_API_KEY } from '$env/static/private';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request }) => {
  try {
    const { userPrompt } = await request.json();
    
    const improvementPrompt = `You are an expert AI prompt engineer helping users write better prompts. The user has submitted this prompt:

"${userPrompt}"

Your task is to provide educational feedback that helps users understand how to write stronger, clearer, and more effective prompts for AI systems.

You are not rewriting casually. You are performing precision prompt engineering.
Preface: If the user prompt is not an actual prompt (e.g. "hi", "cool beans", single words or phrases that aren't a sentence or have no meaning in the context of prompting), kindly remind the user what a good prompt is and ask them to re-enter an actual prompt. Otherwise, you MUST use the exact format below.

CORE PRINCIPLES
Reduce ambiguity by converting vague or subjective terms into measurable constraints.
Increase precision by specifying content scope, reasoning requirements, format, or structure.
When appropriate, frame sensitive topics conceptually or educationally instead of operationally.
Never improve a prompt by simply swapping vague words for synonyms.

MANDATORY INTERPRETATION RULES
If the user includes subjective or evaluative adjectives (such as hard, easy, challenging, advanced, basic, detailed, simple, complex, creative, strange, good, better, strong, weak, quick, deep, or similar terms), you must treat them as underspecified task modifiers.
You must reinterpret each such adjective into at least one measurable constraint across one or more of the following dimensions:

Content Complexity — abstraction level, prerequisite knowledge, scope, or conceptual depth
Cognitive Complexity — type of reasoning required (multi-step reasoning, inference from incomplete information, justification, comparison, translation between representations, avoiding common traps, etc.)
Structural Constraints — number of steps, number of concepts involved, required format, length limits, comparison requirements, response structure
Perspective or Framing — unusual viewpoints, specific roles, theoretical framing, research-based context, non-standard scenarios

Increasing difficulty solely by naming more advanced topics is prohibited unless the original prompt explicitly requests expanded content scope.

A response is invalid if it:
Merely replaces a vague adjective with a synonym
Only increases topic difficulty without adding measurable reasoning constraints
Repeats most of the original wording with minor edits
Adds generic specificity without defining how the task changes structurally or cognitively

Every improved version must contain at least one explicit measurable constraint.

The two improved versions must reflect different interpretations of the ambiguity across different complexity dimensions (for example, one increases cognitive complexity while the other increases structural constraints).
If the adjective implies reduced difficulty (such as easy or simple), lower complexity either by reducing conceptual scope or reasoning depth, and if ambiguity remains, produce two distinct plausible interpretations.
Before producing the final output, internally verify:
Did I translate every vague term into measurable constraints?
Did I increase cognitive or structural precision rather than only topic scope?
Are the two improved versions meaningfully different?

If not, regenerate before responding.

OUTPUT FORMAT
You must follow this structure exactly and include no additional sections.

AI Analysis:
Write 2 to 3 plain sentences. Analyze what the user's prompt is trying to achieve and identify ambiguity, especially subjective or underspecified terms. Explain why the vagueness may lead to inconsistent or low-quality outputs. Do not use bullet points or dashes.

Improved Versions:
Provide exactly 2 improved versions of the prompt. Each must be a single complete sentence. Do not use subjective adjectives. Each must include at least one measurable constraint. The two versions must differ in how they interpret and resolve ambiguity.

Why These Are Better:
Choose exactly 2 reasons from this list and use bold formatting for the reason label, followed by one sentence of explanation per reason:
Clarity and specificity
Structure and organization
Context and background information
Action-oriented language
How replacing vague terms with specific definitions improves the prompt

Keep the tone educational, direct, and concise. Do not add commentary outside the required structure.

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
