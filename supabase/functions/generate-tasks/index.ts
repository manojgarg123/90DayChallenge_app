// Supabase Edge Function: generate-tasks
// Generates behavioural tasks for each segment following the 4 Laws of Behavior Change
// and a wave-pattern progression. Called after analyze-goal has returned the plan structure.

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Derive practical anchor hints from user constraints
function getAnchorHints(constraints: string[]): string {
  if (!constraints || constraints.length === 0 || constraints.includes('none')) {
    return 'After morning coffee, After lunch, Before bed, After brushing teeth'
  }
  const hints: string[] = []
  if (constraints.includes('early_mornings')) hints.push('After waking up, After morning stretch, After brushing teeth')
  if (constraints.includes('work_from_home'))  hints.push('After first coffee, Before lunch break, After logging off for the day')
  if (constraints.includes('no_gym'))          hints.push('At home, In living room — avoid any gym or equipment references')
  if (constraints.includes('travel'))          hints.push('In hotel room, After landing, Before checking out — keep equipment-free and flexible')
  return hints.length > 0 ? hints.join('; ') : 'After morning coffee, After lunch, Before bed'
}

// Derive task duration guidance from available time
function getDurationGuide(availableTime: string): string {
  const map: Record<string, string> = {
    '15min':       'Main tasks: 5–15 mins total. Floor versions: 2–5 mins.',
    '30min':       'Main tasks: 15–30 mins total. Floor versions: 5–10 mins.',
    '1hour':       'Main tasks: 30–60 mins total. Floor versions: 10–15 mins.',
    '2plus_hours': 'Main tasks: 60–90 mins total. Floor versions: 15–20 mins.',
  }
  return map[availableTime] ?? 'Main tasks: 15–30 mins. Floor versions: 5–10 mins.'
}

// Stage-of-change adjustment instructions for early phase
function getStageInstruction(stage: string): string {
  const map: Record<string, string> = {
    never_tried:   'Early phase only: focus on environment setup and friction removal — tasks like preparing space, scheduling time, buying one needed item. No performance pressure in week 1.',
    tried_stopped: 'Early phase: acknowledge prior attempts. Include obstacle-planning language ("If you feel resistance: [plan B]"). Anchor tasks to prevent the most likely failure point.',
    inconsistent:  'Early phase: prioritise consistency cues over intensity. Make it harder NOT to do the task than to do it. Focus on showing up, not performance.',
    restarting:    'Early phase: acknowledge prior experience. Start at 60–70% of previous best, not from zero. Rebuild confidence before ramping intensity.',
  }
  return map[stage] ?? 'Early phase: start small and build consistency before adding intensity.'
}

// Format constraints list for display in prompt
function formatConstraints(constraints: string[]): string {
  if (!constraints || constraints.includes('none')) return 'None'
  const labels: Record<string, string> = {
    early_mornings: 'Early mornings work best',
    no_gym:         'No gym access',
    work_from_home: 'Works from home',
    travel:         'Travels frequently',
  }
  return constraints.map(c => labels[c] ?? c).join(', ')
}

function formatFrequency(freq: string): string {
  const map: Record<string, string> = {
    never:      'Never done it before',
    once_week:  'Once a week currently',
    '2_3x_week': '2–3 times a week currently',
    daily:      'Does it daily already',
  }
  return map[freq] ?? freq
}

function formatExperience(exp: string): string {
  const map: Record<string, string> = {
    beginner:              'Complete beginner',
    some_experience:       'Some experience',
    restarting:            'Done it before, restarting',
    intermediate_advanced: 'Intermediate / Advanced',
  }
  return map[exp] ?? exp
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const body = await req.json()
    const {
      segments = [],
      goalVerb = '',
      goalObject = '',
      goalOutcome = '',
      identityStatement = '',
      currentFrequency = '',
      availableTime = '30min',
      experienceLevel = '',
      constraints = [],
      stagesOfChange = '',
      durationWeeks = 12,
    } = body

    if (!Array.isArray(segments) || segments.length === 0) {
      return new Response(
        JSON.stringify({ error: 'segments array is required' }),
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

    const systemPrompt = `You are a behavioural change task designer. Generate daily habit tasks that apply James Clear's 4 Laws of Behavior Change.

WAVE PROGRESSION — 3 phases, map tasks to effort level:
- early (foundation): Minimum viable habits. Tiny actions that build identity. Anchored to existing routines. No performance pressure.
- mid (build): Same anchors, expanded duration/intensity. Consistency over heroics. Start to feel the compound effect.
- late (peak + identity): Highest effort. Tasks explicitly reference who the user is BECOMING. Identity-affirming language required.

4 LAWS — apply to EVERY task:
1. Make it Obvious: main task must start with a trigger anchor — "After [existing habit]: [action]"
2. Make it Attractive: late-phase tasks must reference the user's identity goal in the task wording
3. Make it Easy: every task needs a floor version — the absolute minimum if motivation is low. Format: "If [X] mins: [minimal action]"
4. Make it Satisfying: main task must end with a built-in reward — one of:
   - Sensory reward: "— walk to your favourite café after"
   - Completion ritual: "— mark it done on your tracker"
   - Progress note: "— note one thing that felt easier than last week"

TIME OF DAY assignment rules:
- Match action semantics: movement/exercise → morning or evening; reflection/journaling → evening or night; learning/reading → morning or afternoon; meal/nutrition → midday or evening
- Respect user constraints (provided below)
- Within each segment, spread tasks across DIFFERENT times of day — do not put all 3 in the same slot

OUTPUT — return ONLY valid JSON, no markdown, no explanation:
{
  "segments": [
    {
      "name": "exact name from input — do not change",
      "tasks": {
        "early": [
          { "main": "After [anchor]: [action] — [reward]", "floor": "If [X] mins: [minimal action]", "time_of_day": "morning" },
          { "main": "...", "floor": "...", "time_of_day": "afternoon" },
          { "main": "...", "floor": "...", "time_of_day": "night" }
        ],
        "mid":  [ 3 task objects ],
        "late": [ 3 task objects with identity language ]
      }
    }
  ]
}

HARD LIMITS:
- Exactly 3 task objects per phase (early, mid, late) — no more, no fewer
- main: ≤65 characters including anchor and reward
- floor: ≤55 characters, must start with "If "
- time_of_day: must be exactly one of: morning, midday, afternoon, evening, night`

    // Build the user message with all context filled in
    const segmentList = segments
      .map((s: { name: string; description: string }, i: number) => `${i + 1}. "${s.name}" — ${s.description}`)
      .join('\n')

    const userMessage = `Generate tasks for this user's ${durationWeeks}-week challenge:

GOAL: I want to ${goalVerb} ${goalObject} so that I can ${goalOutcome}
IDENTITY GOAL: "${identityStatement}"
CURRENT FREQUENCY: ${formatFrequency(currentFrequency)}
AVAILABLE TIME PER DAY: ${availableTime.replace('_', '+')}
EXPERIENCE LEVEL: ${formatExperience(experienceLevel)}
CONSTRAINTS: ${formatConstraints(constraints)}
PREVIOUS ATTEMPTS: ${getStageInstruction(stagesOfChange)}

TASK DURATION GUIDE: ${getDurationGuide(availableTime)}

ANCHOR HINTS (choose from these based on constraints):
${getAnchorHints(constraints)}

SEGMENTS TO GENERATE TASKS FOR:
${segmentList}

Remember: late-phase tasks must include the identity language — reference becoming "${identityStatement}".`

    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 2500,
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

    // Normalise: ensure every segment has valid early/mid/late with 3 task objects each
    const VALID_TIMES = ['morning', 'midday', 'afternoon', 'evening', 'night']
    if (Array.isArray(result.segments)) {
      result.segments = result.segments.map((seg: any) => {
        const normalisePhase = (phase: any[]): any[] => {
          if (!Array.isArray(phase)) return []
          return phase.slice(0, 3).map((t: any) => ({
            main:        typeof t.main === 'string'        ? t.main        : String(t.main ?? ''),
            floor:       typeof t.floor === 'string'       ? t.floor       : String(t.floor ?? ''),
            time_of_day: VALID_TIMES.includes(t.time_of_day) ? t.time_of_day : 'morning',
          }))
        }
        return {
          ...seg,
          tasks: {
            early: normalisePhase(seg.tasks?.early ?? []),
            mid:   normalisePhase(seg.tasks?.mid   ?? []),
            late:  normalisePhase(seg.tasks?.late  ?? []),
          },
        }
      })
    }

    return new Response(JSON.stringify({ segments: result.segments }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('generate-tasks error:', error)
    return new Response(
      JSON.stringify({ error: 'Unexpected error', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
