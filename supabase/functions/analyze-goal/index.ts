// Supabase Edge Function: analyze-goal
// Generates challenge plan STRUCTURE only (title, segments, metrics — no tasks).
// Tasks are generated separately by generate-tasks for better quality and speed.

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
    const body = await req.json()
    const {
      goal,
      goalVerb = '',
      goalObject = '',
      goalOutcome = '',
      durationWeeks = 12,
    } = body

    if (!goal || typeof goal !== 'string' || goal.length < 10) {
      return new Response(
        JSON.stringify({ error: 'Invalid goal: must be at least 10 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const totalDays = durationWeeks * 7

    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!anthropicKey) {
      return new Response(
        JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const systemPrompt = `You are a behaviour change coach helping people achieve lasting change across any life domain.

Create a ${durationWeeks}-week (${totalDays}-day) challenge plan STRUCTURE for the user's goal.

OUTPUT RULES:
- Output ONLY valid JSON. No markdown, no code fences, no text before or after.
- Start with { and end with }

JSON schema:
{
  "challengeTitle": "Motivating title ≤60 chars reflecting the ${durationWeeks}-week duration. No '90-Day'.",
  "overview": "2-3 sentences on approach and intent. ≤200 chars.",
  "segments": [
    {
      "name": "Goal-domain-specific 2-3 word name. NOT generic like Core Practice, Mindset, Learning, Recovery.",
      "description": "One sentence ≤80 chars.",
      "icon": "one emoji",
      "color": "one of: lavender mint peach sky blush",
      "weeklyFocus": ["Early phase theme", "Mid phase theme", "Late phase theme"]
    }
  ],
  "suggestedMetrics": [
    { "name": "metric name", "unit": "kg|lbs|%|km|reps|hrs|mins", "lowerIsBetter": false }
  ]
}

SEGMENT NAMING RULES — this is critical:
- Choose 4 segments that are the most impactful sub-domains for THIS specific goal
- Names must reflect the goal domain, NOT generic self-help labels
- Running goal → Running Form, Endurance Building, Injury Prevention, Race Mindset
- Weight loss → Movement, Nutrition Habits, Sleep Quality, Body Confidence
- Piano learning → Technique, Ear Training, Music Theory, Performance
- Career change → Skill Building, Networking, Portfolio Work, Mental Resilience
- Meditation → Breath Practice, Body Awareness, Mindset Reframes, Daily Ritual

OTHER RULES:
- segments: exactly 4
- weeklyFocus: exactly 3 phase theme strings per segment
- suggestedMetrics: 1-4 measurable outcomes only (no subjective metrics like mood)
- Do NOT include tasks — tasks are generated separately`

    const userMessage = goalVerb
      ? `My ${durationWeeks}-week challenge: I want to ${goalVerb} ${goalObject} so that I can ${goalOutcome}`
      : `My ${durationWeeks}-week challenge goal: ${goal}`

    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1200,
        temperature: 0.7,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
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
          JSON.stringify({ error: 'Failed to parse Claude response', details: rawContent.slice(0, 200) }),
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
