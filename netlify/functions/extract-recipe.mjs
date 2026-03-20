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
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a recipe extraction assistant. Extract recipe information from images and return valid JSON only. Always respond with this exact JSON structure:
{
  "title": "Recipe Title",
  "description": "Brief description of the dish",
  "prepTime": "15 mins",
  "cookTime": "30 mins",
  "servings": "4",
  "ingredients": ["1 cup flour", "2 eggs"],
  "instructions": ["Step one.", "Step two."],
  "notes": "Any additional notes or tips"
}
If you cannot determine a field, use a reasonable default. Do not include any text outside the JSON.`
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Please extract the recipe from this image. Return only the JSON object.' },
              { type: 'image_url', image_url: { url: image } }
            ]
          }
        ],
        max_tokens: 2000,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return new Response(JSON.stringify({ error: data.error?.message || 'OpenAI API error' }), { status: 500 });
    }

    const content = data.choices[0].message.content;
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
