export default async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'GEMINI_API_KEY not configured' }), { status: 500 });
  }

  try {
    const { image } = await req.json();
    if (!image) {
      return new Response(JSON.stringify({ error: 'No image provided' }), { status: 400 });
    }

    // Extract base64 data and mime type from data URL
    const match = image.match(/^data:(image\/\w+);base64,(.+)$/);
    if (!match) {
      return new Response(JSON.stringify({ error: 'Invalid image format. Expected base64 data URL.' }), { status: 400 });
    }
    const mimeType = match[1];
    const base64Data = match[2];

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            {
              text: `Extract the recipe from this image. Return ONLY a valid JSON object with this exact structure, no other text:
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
If you cannot determine a field, use a reasonable default.`
            },
            {
              inlineData: {
                mimeType: mimeType,
                data: base64Data
              }
            }
          ]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 2000,
        }
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return new Response(JSON.stringify({ error: data.error?.message || 'Gemini API error' }), { status: 500 });
    }

    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) {
      return new Response(JSON.stringify({ error: 'No response from Gemini' }), { status: 500 });
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
