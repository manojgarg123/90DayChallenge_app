// Supabase Edge Function: analyze-goal
// Analyzes user's 90-day goal using Claude AI and returns a structured plan

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { goal } = await req.json()
    if (!goal || typeof goal !== 'string' || goal.length < 10) {
      return new Response(JSON.stringify({ error: 'Invalid goal: must be at least 10 characters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!anthropicKey) {
      return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured in Supabase secrets' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const systemPrompt = `You are a world-class fitness and wellness coach. Your job is to analyze a user's 90-day goal and create a comprehensive, actionable plan broken into distinct focus areas (segments).

Return ONLY valid JSON matching this exact structure, no markdown:
{
  "challengeTitle": "A motivating title for this challenge (max 60 chars)",
  "overview": "2-3 sentence overview of the approach (max 200 chars)",
  "segments": [
    {
      "name": "Segment name (2-3 words)",
      "description": "What this segment covers (max 80 chars)",
      "icon": "Single relevant emoji",
      "color": "One of: lavender, mint, peach, sky, blush",
      "weeklyFocus": ["Week 1-3 focus theme", "Week 4-7 focus theme", "Week 8-13 focus theme"],
      "sampleTasks": ["Daily task 1", "Daily task 2", "Daily task 3", "Daily task 4", "Daily task 5"]
    }
  ]
}

Rules:
- Create 3-5 segments based on what the goal requires
- Segments should cover different life areas (physical, mental, nutrition, sleep, habits, etc.)
- sampleTasks are specific daily actions for that segment (rotate through them each day)
- Keep task descriptions short (under 40 chars)
- Be encouraging and actionable`

    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 1500,
        system: systemPrompt,
        messages: [{ role: 'user', content: `My 90-day goal: ${goal}` }],
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      return new Response(
        JSON.stringify({ error: `Claude API error ${response.status}`, details: errText }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const claudeData = await response.json()
    const rawContent = claudeData.content[0].text.trim()

    let plan
    try {
      plan = JSON.parse(rawContent)
    } catch {
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        plan = JSON.parse(jsonMatch[0])
      } else {
        return new Response(
          JSON.stringify({ error: 'Failed to parse Claude response as JSON', details: rawContent.slice(0, 200) }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    return new Response(JSON.stringify({ plan }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('analyze-goal error:', error)
    return new Response(
      JSON.stringify({ error: 'Unexpected error', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
