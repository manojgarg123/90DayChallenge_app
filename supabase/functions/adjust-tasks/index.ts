// Supabase Edge Function: adjust-tasks
// Takes next week's tasks + difficulty rating and returns intensity-adjusted versions.
// Frontend is responsible for writing the adjusted tasks back to Supabase.

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function getDifficultyInstruction(difficulty: 'too_hard' | 'too_easy'): string {
  if (difficulty === 'too_hard') {
    return `The user found last week TOO HARD. Reduce intensity by ~20%:
- Shorten durations (e.g. 20 mins → 15 mins, 10 push-ups → 8)
- Use gentler action verbs (run → walk/jog, lift → stretch)
- Keep the same anchor trigger and reward structure
- Make the floor_task even simpler than the original`
  }
  return `The user found last week TOO EASY. Increase intensity by ~25%:
- Extend durations (e.g. 15 mins → 20 mins, 8 reps → 12)
- Use more challenging action verbs (walk → jog, stretch → strength)
- Keep the same anchor trigger and reward structure
- Make the floor_task match the previous main task difficulty`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const {
      difficulty,
      tasks = [],
      goalVerb = '',
      goalObject = '',
      identityStatement = '',
      availableTime = '30min',
    } = body

    if (!difficulty || !['too_hard', 'too_easy'].includes(difficulty)) {
      return new Response(
        JSON.stringify({ error: 'difficulty must be too_hard or too_easy' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!Array.isArray(tasks) || tasks.length === 0) {
      return new Response(
        JSON.stringify({ error: 'tasks array is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!anthropicKey) {
      return new Response(
        JSON.stringify({ error: 'ANTHROPIC_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const taskList = tasks
      .map((t: any, i: number) => `${i + 1}. ID:${t.id} | "${t.title}" | Floor: "${t.floor_task || ''}" | Time: ${t.time_of_day || 'morning'}`)
      .join('\n')

    const systemPrompt = `You are adjusting a user's weekly habit tasks based on difficulty feedback.

RULES:
- Return ONLY valid JSON, no markdown, no explanation
- Return exactly the same number of tasks as input, in the same order
- Preserve the anchor structure: "After [X]: [action] — [reward]"
- Keep time_of_day values unchanged
- title: ≤65 characters
- floor_task: ≤55 characters, must start with "If "
- Do NOT change the task ID values`

    const userMessage = `${getDifficultyInstruction(difficulty as 'too_hard' | 'too_easy')}

USER CONTEXT:
Goal: ${goalVerb} ${goalObject}
Identity goal: "${identityStatement}"
Available time per day: ${availableTime}

TASKS TO ADJUST:
${taskList}

Return ONLY this JSON (${tasks.length} tasks):
{
  "tasks": [
    { "id": "same-id-from-input", "title": "adjusted title", "floor_task": "adjusted floor" }
  ]
}`

    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 1500,
        temperature: 0.5,
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

    let result
    try {
      result = JSON.parse(rawContent)
    } catch {
      const jsonMatch = rawContent.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0])
      } else {
        return new Response(
          JSON.stringify({ error: 'Failed to parse Claude response', details: rawContent.slice(0, 200) }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
    }

    // Validate and normalise output
    if (!Array.isArray(result.tasks)) {
      return new Response(
        JSON.stringify({ error: 'Invalid response: tasks array missing' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const adjustedTasks = result.tasks.map((t: any, i: number) => ({
      id: t.id || tasks[i]?.id,
      title: typeof t.title === 'string' ? t.title.slice(0, 65) : tasks[i]?.title,
      floor_task: typeof t.floor_task === 'string' ? t.floor_task.slice(0, 55) : tasks[i]?.floor_task,
    }))

    return new Response(JSON.stringify({ adjustedTasks }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('adjust-tasks error:', error)
    return new Response(
      JSON.stringify({ error: 'Unexpected error', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
