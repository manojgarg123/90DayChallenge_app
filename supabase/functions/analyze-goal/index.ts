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

    const systemPrompt = `You are a behaviour change coach helping people achieve lasting change across any life domain — fitness, career, learning, relationships, finance, creativity, habits, or other.

Create a structured ${durationWeeks}-week (${totalDays}-day) challenge plan for the user's goal.

OUTPUT RULES:
- Output ONLY a valid JSON object. No markdown, no code fences, no text before or after.
- Start with { and end with }

JSON schema:
{
  "challengeTitle": "Motivating title ≤60 chars reflecting the ${durationWeeks}-week duration. No '90-Day'.",
  "overview": "2-3 sentences on approach and intent. ≤200 chars.",
  "segments": [
    {
      "name": "2-3 word name",
      "description": "One sentence ≤80 chars.",
      "icon": "one emoji",
      "color": "one of: lavender mint peach sky blush",
      "weeklyFocus": ["Early phase theme", "Mid phase theme", "Late phase theme"],
      "tasks": {
        "early": ["Time: action", "Time: action", "Time: action"],
        "mid":   ["Time: action", "Time: action", "Time: action"],
        "late":  ["Time: action", "Time: action", "Time: action"]
      }
    }
  ],
  "suggestedMetrics": [
    { "name": "metric name", "unit": "kg|lbs|%|km|reps|hrs|mins", "lowerIsBetter": false }
  ]
}

CONTENT RULES:
- segments: exactly 4, chosen as the most impactful areas for this specific goal
- tasks: exactly 3 per phase. Each must begin with the best time for that action: Morning / Midday / Afternoon / Evening / Night. Tasks must build progressively: early = foundational habits, mid = increased intensity/depth, late = peak or mastery. Each task string ≤45 chars including time prefix.
- weeklyFocus: exactly 3 phase theme strings
- suggestedMetrics: 1-4 measurable outcomes only (no subjective metrics like mood)

EXAMPLE segment (adapt to user's goal, do not copy):
{"name":"Deep Work","description":"Build focused sessions and eliminate distractions","icon":"🧠","color":"lavender","weeklyFocus":["Establish focus blocks","Extend depth sessions","Sustain peak output"],"tasks":{"early":["Morning: 25-min focus sprint","Afternoon: Block distractions","Evening: Review wins & gaps"],"mid":["Morning: 45-min deep work block","Afternoon: Single-task practice","Evening: Plan next day"],"late":["Morning: 90-min flow session","Afternoon: Mentor or teach skill","Evening: Reflect & refine system"]}}`

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

    // Normalize segments: ensure every segment has tasks.early/mid/late
    // Claude Haiku sometimes returns sampleTasks (old format) — convert it here so
    // the frontend always receives the correct structure regardless of model output.
    if (Array.isArray(plan.segments)) {
      plan.segments = plan.segments.map((seg: any) => {
        if (seg.tasks?.early && seg.tasks?.mid && seg.tasks?.late) {
          return seg // Already correct format
        }
        // Fall back: sampleTasks or tasks as flat array → split into thirds
        const flat: string[] = Array.isArray(seg.tasks)
          ? seg.tasks
          : Array.isArray(seg.sampleTasks)
          ? seg.sampleTasks
          : []
        const third = Math.max(1, Math.ceil(flat.length / 3))
        return {
          ...seg,
          tasks: {
            early: flat.slice(0, third),
            mid:   flat.slice(third, third * 2),
            late:  flat.slice(third * 2),
          },
          sampleTasks: undefined, // strip old field
        }
      })
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
