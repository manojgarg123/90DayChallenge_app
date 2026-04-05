// Supabase Edge Function: analyze-goal
// Analyzes user's challenge goal using Claude AI and returns a structured plan

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
    const { goal, durationWeeks = 12 } = await req.json()
    if (!goal || typeof goal !== 'string' || goal.length < 10) {
      return new Response(JSON.stringify({ error: 'Invalid goal: must be at least 10 characters' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const totalDays = durationWeeks * 7

    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!anthropicKey) {
      return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured in Supabase secrets' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const systemPrompt = `You are an expert fitness and wellness coach. Create a structured ${durationWeeks}-week (${totalDays}-day) challenge plan for the user's goal.

OUTPUT RULES — critical:
- Output ONLY a single valid JSON object. No markdown, no code fences, no explanations before or after.
- Start your response with { and end with }

JSON structure to follow exactly:
{
  "challengeTitle": "Short motivating title, max 60 chars. Do NOT say '90-Day'. Reflect the actual ${durationWeeks}-week duration.",
  "overview": "2-3 sentences describing the overall approach for ${durationWeeks} weeks. Max 200 chars.",
  "segments": [
    {
      "name": "2-3 word segment name",
      "description": "One sentence on what this segment covers. Max 80 chars.",
      "icon": "one relevant emoji",
      "color": "exactly one of: lavender, mint, peach, sky, blush",
      "weeklyFocus": ["Phase 1 theme (weeks 1-${Math.round(durationWeeks/3)})", "Phase 2 theme (weeks ${Math.round(durationWeeks/3)+1}-${Math.round(durationWeeks*2/3)})", "Phase 3 theme (weeks ${Math.round(durationWeeks*2/3)+1}-${durationWeeks})"],
      "sampleTasks": ["specific daily action", "specific daily action", "specific daily action", "specific daily action", "specific daily action"]
    }
  ],
  "suggestedMetrics": [
    { "name": "2-3 word metric name", "unit": "kg or lbs or % or km or reps or hrs", "lowerIsBetter": false }
  ]
}

CONTENT RULES:
- segments: create 3 to 5 segments covering different areas relevant to the goal (e.g. physical training, nutrition, mindset, sleep, habits)
- sampleTasks: exactly 5 specific daily actions per segment, each under 40 chars (e.g. "30-min morning run", "Log meals in app", "10-min meditation")
- weeklyFocus: exactly 3 strings representing early / mid / final phase themes
- suggestedMetrics: 1 to 4 measurable metrics only (no subjective ones like "mood" or "happiness")
- The plan must be realistic for ${durationWeeks} weeks

EXAMPLE of one valid segment (do not copy, adapt to the user's actual goal):
{"name":"Strength Training","description":"Build muscle and improve overall body composition","icon":"💪","color":"lavender","weeklyFocus":["Foundation & form","Progressive overload","Peak & maintain"],"sampleTasks":["45-min weight session","Track sets & reps","Protein within 30min","Mobility warmup","Rest day stretch"]}`

    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2000,
        temperature: 0.7,
        system: systemPrompt,
        messages: [{ role: 'user', content: `My ${durationWeeks}-week challenge goal: ${goal}` }],
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
