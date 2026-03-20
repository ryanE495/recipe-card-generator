export default async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'OPENAI_API_KEY not configured' }), { status: 500 });
  }

  try {
    const { image } = await req.json();
    if (!image) {
      return new Response(JSON.stringify({ error: 'No image provided' }), { status: 400 });
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Extract the COMPLETE recipe from this image word-for-word. Do NOT summarize, shorten, or paraphrase anything. Every instruction must be transcribed in FULL — include all details, parenthetical notes, measurements, and sub-steps exactly as written. If there are tips, notes, or sidebars, include ALL of them.

Return ONLY a valid JSON object with this exact structure, no other text:
{
  "title": "Recipe Title",
  "description": "Brief description from the recipe (verbatim if present)",
  "prepTime": "15 mins",
  "cookTime": "30 mins",
  "servings": "4 servings (or yield info exactly as written)",
  "ingredients": ["7 cups granulated sugar", "8 cups whole strawberries (approx.)"],
  "instructions": ["Full complete step one WITHOUT step numbers — do NOT include '1.' or 'Step 1' prefixes, just the instruction text with ALL details.", "Next step text..."],
  "tips": "Any tips, hints, or sidebar text from the recipe — transcribe in full",
  "notes": "Any additional notes verbatim from the recipe"
}
CRITICAL RULES:
1. Do NOT shorten or summarize instructions. Each step must be the COMPLETE text from the original.
2. Do NOT include step numbers in instructions — no "1.", "Step 1:", etc. The app adds numbers automatically.
3. If a step is a full paragraph, return the full paragraph.
4. If you cannot determine a field, use a reasonable default.`
              },
              {
                type: 'image_url',
                image_url: {
                  url: image,
                },
              },
            ],
          },
        ],
        temperature: 0.1,
        max_tokens: 4000,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return new Response(JSON.stringify({ error: data.error?.message || 'OpenAI API error' }), { status: 500 });
    }

    const content = data.choices?.[0]?.message?.content;
    if (!content) {
      return new Response(JSON.stringify({ error: 'No response from OpenAI' }), { status: 500 });
    }

    // Extract JSON from possible markdown code blocks
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, content];
    const recipe = JSON.parse(jsonMatch[1].trim());

    return new Response(JSON.stringify(recipe), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
};

export const config = {
  path: '/api/extract-recipe',
};
