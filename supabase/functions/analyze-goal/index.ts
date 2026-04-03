// Supabase Edge Function: analyze-goal
// Analyzes user's 90-day goal using Claude AI and returns a structured plan

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

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
    // Verify auth
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Use admin client to verify the user's JWT (correct pattern for Edge Functions)
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    )

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token)
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized', details: authError?.message }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const { goal } = await req.json()
    if (!goal || typeof goal !== 'string' || goal.length < 10) {
      return new Response(JSON.stringify({ error: 'Invalid goal' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!anthropicKey) {
      throw new Error('ANTHROPIC_API_KEY not configured')
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
        messages: [
          {
            role: 'user',
            content: `My 90-day goal: ${goal}`,
          },
        ],
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      throw new Error(`Claude API error: ${response.status} ${errText}`)
    }

    const claudeData = await response.json()
    const rawContent = claudeData.content[0].text.trim()

    // Parse JSON safely
    let plan
    try {
      plan = JSON.parse(rawContent)
    } catch {
      // Try to extract JSON from response
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        plan = JSON.parse(jsonMatch[0])
      } else {
        throw new Error('Failed to parse Claude response as JSON')
      }
    }

    return new Response(JSON.stringify({ plan }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('analyze-goal error:', error)
    return new Response(
      JSON.stringify({ error: 'Failed to analyze goal', details: String(error) }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
