// Supabase Edge Function: generate-tasks
// Generates 2 behavioural tasks per phase (early/mid/late) per segment.
// Uses a dynamic domain-expert role, narrative user profile, domain examples,
// James Clear's 4 Laws, wave progression, and habit stacking.

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ─── Domain expert role ────────────────────────────────────────────────────────
function getDomainRole(goalVerb: string, goalObject: string): string {
  const obj  = (goalObject || '').toLowerCase()
  const verb = (goalVerb   || '').toLowerCase()

  if (['run', 'walk', 'jog'].includes(verb) || /marathon|5k|10k|running|sprint|race/.test(obj))
    return 'You are an expert running coach with 15 years of experience training beginners through to marathon finishers. You understand periodization, easy-pace runs, long runs, tempo work, and injury prevention. Use this expertise to write specific, realistic training tasks.'

  if (['learn', 'practice', 'play'].includes(verb) && /piano|guitar|violin|drums|music|instrument|chord|song/.test(obj))
    return 'You are a music teacher specialising in adult beginners building consistent practice habits. You know scales, chord progressions, sight-reading, ear training, and how to structure productive 15–30 min sessions. Write tasks that reflect real instrument practice.'

  if ((['lose', 'drop'].includes(verb) && /weight|kg|lbs|fat|kilo/.test(obj)) || /weight loss|fat loss|diet|calorie|nutrition/.test(obj))
    return 'You are a certified nutritionist and fitness coach specialising in sustainable behaviour-based weight management. You understand meal timing, macros, movement habits, and the psychology of eating. Write tasks grounded in nutritional science.'

  if (['meditate'].includes(verb) || /meditat|mindful|breath/.test(obj))
    return 'You are a mindfulness teacher trained in MBSR (Mindfulness-Based Stress Reduction), specialising in helping busy people build sustainable meditation habits. Write tasks that are calming, practical, and progressively deeper.'

  if (['quit', 'stop', 'cut'].includes(verb) || /smoking|alcohol|sugar|junk|snacking|gambling|craving/.test(obj))
    return 'You are a habit-breaking specialist and behavioural therapist with expertise in managing cravings, identifying triggers, and replacing negative patterns with healthy ones. Write tasks that acknowledge the difficulty and provide concrete replacement behaviours.'

  if (['save', 'invest', 'build'].includes(verb) && /money|saving|budget|financ|invest|debt/.test(obj))
    return 'You are a personal finance coach specialising in behaviour-based money habits. You understand automation, spending triggers, and how to make financial discipline feel effortless. Write tasks that are practical and friction-free.'

  if (['write', 'publish', 'blog'].includes(verb) || /writ|book|blog|journal|novel|essay/.test(obj))
    return 'You are a writing coach who helps people build consistent creative writing habits, overcome blank-page resistance, and ship work regularly. Write tasks that make starting feel easy and finishing feel rewarding.'

  if (['build', 'learn', 'practice'].includes(verb) && /cod|program|software|app|develop|javascript|python/.test(obj))
    return 'You are a senior software engineer and technical mentor who helps people build consistent coding habits, work through projects, and grow their skills. Write tasks that are concrete, output-focused, and progressive.'

  if (/yoga|stretch|flexib|pilates/.test(obj))
    return 'You are a certified yoga instructor and flexibility coach who helps people build a consistent movement and mindfulness practice. Write tasks that are body-aware, progressive, and grounded in real yoga sequencing.'

  if (/sleep|insomnia|bedtime|wind.?down/.test(obj))
    return 'You are a sleep specialist and wellness coach who helps people build evidence-based sleep hygiene habits. Write tasks that are calming, consistent, and grounded in sleep science.'

  return "You are an expert habit coach with deep knowledge of behaviour change science, helping people build lasting habits across any life domain. Draw on specific domain knowledge relevant to the user's goal."
}

// ─── Anchor hints — personalised to constraints ────────────────────────────────
function getAnchorHints(constraints: string[]): string {
  if (!constraints || constraints.length === 0 || constraints.includes('none')) {
    return 'After morning coffee, After brushing teeth, After closing your laptop for the day, Before dinner, Before bed'
  }
  const hints: string[] = []
  if (constraints.includes('work_from_home'))
    hints.push('After closing your laptop for the day', 'After your first coffee at your desk', 'Before making lunch', 'After your last video call')
  if (constraints.includes('early_mornings'))
    hints.push('After your alarm before checking your phone', 'After brushing teeth', 'After morning shower', 'Before the house wakes up')
  if (constraints.includes('travel'))
    hints.push('After landing and checking into your room', 'Before hotel checkout', 'At airport gate while waiting', 'After unpacking your bag')
  if (constraints.includes('no_gym'))
    hints.push('In your living room after clearing space', 'In your bedroom before getting dressed', 'Outside your front door', 'During a break at home')
  return hints.length > 0 ? hints.join(', ') : 'After morning coffee, After closing your laptop, Before dinner, Before bed'
}

// ─── Duration guide ────────────────────────────────────────────────────────────
function getDurationGuide(availableTime: string): string {
  const map: Record<string, string> = {
    '15min':       'Main tasks: 5–15 mins total. Floor versions: 2–5 mins.',
    '30min':       'Main tasks: 15–30 mins total. Floor versions: 5–10 mins.',
    '1hour':       'Main tasks: 30–60 mins total. Floor versions: 10–15 mins.',
    '2plus_hours': 'Main tasks: 60–90 mins total. Floor versions: 15–20 mins.',
  }
  return map[availableTime] ?? 'Main tasks: 15–30 mins. Floor versions: 5–10 mins.'
}

// ─── Stage of change → task TYPE, not just wording ────────────────────────────
function getStageInstruction(stage: string): string {
  const map: Record<string, string> = {
    never_tried: `STAGE: Preparation — user has never tried this before.
Early tasks MUST be environment design and friction removal ONLY. Zero performance targets.
Good examples: "Buy [equipment] and place where you'll see it", "Block time in calendar now", "Clear a dedicated space", "Download the app and create an account".
Mid tasks: first real action, minimal duration — celebrate showing up over output quality.
Late tasks: identity language — tasks state who they ARE becoming, not just what they do.`,

    tried_stopped: `STAGE: Action (restarting after prior failure) — user has tried before but stopped.
Early tasks: embed obstacle pre-planning — "If resistance hits: [1-min fallback]". Anchor at the exact point prior attempts typically failed.
Mid tasks: consistency over heroics. Same anchor, same time every day. Streak matters more than output quality.
Late tasks: reframe identity — "Unlike before, you now [identity statement]".`,

    inconsistent: `STAGE: Action (inconsistent) — user does it sometimes but not reliably.
Early tasks: make the cue unmissable. Stack onto the most reliable existing habit. Reduce to a 2-minute minimum viable version.
Mid tasks: add accountability signals — "— tell one person" or "— log it now". Eliminate all decision points.
Late tasks: identity-first language — open each task with "As a [identity]:".`,

    restarting: `STAGE: Maintenance (restarting) — user has experience and is returning after a gap.
Early tasks: start at 60–70% of prior best. Rebuild confidence before pushing output. No ego-driven targets.
Mid tasks: gradual ramp back. Reference prior success positively — "You've done this before."
Late tasks: reclaim former identity. Tasks may reference returning to peak performance.`,
  }
  return map[stage]?.trim() ?? 'Early: start small and remove friction. Mid: build consistency. Late: lock in identity.'
}

// ─── Domain-specific few-shot examples ────────────────────────────────────────
function getDomainExamples(goalVerb: string, goalObject: string): string {
  const obj  = (goalObject || '').toLowerCase()
  const verb = (goalVerb   || '').toLowerCase()

  if (['run', 'walk', 'jog'].includes(verb) || /marathon|5k|10k|running|race/.test(obj)) {
    return `EXAMPLE TASKS (calibrate your specificity and format to this standard):
early: { "main": "After lacing up shoes: walk 10 min at easy conversational pace — note how your legs feel", "floor": "If 5 mins: walk to end of street and back, that still counts", "time_of_day": "morning" }
late:  { "main": "After warm-up walk: run 5km at a pace you can hold a conversation — you are a runner now", "floor": "If fatigued: 2km easy jog still builds the identity", "time_of_day": "morning" }`
  }

  if ((['learn', 'practice', 'play'].includes(verb)) && /piano|guitar|violin|music|chord/.test(obj)) {
    return `EXAMPLE TASKS (calibrate your specificity and format to this standard):
early: { "main": "After dinner: play C major scale hands-separate 5 times slowly — tick it on your habit tracker", "floor": "If 2 mins: just open the book and find where you left off", "time_of_day": "evening" }
late:  { "main": "After warm-up scales: run through your piece twice at full tempo — musicians show up every day", "floor": "If low energy: play just the tricky bars 5 times slowly", "time_of_day": "evening" }`
  }

  if (['lose', 'drop'].includes(verb) || /weight|fat/.test(obj)) {
    return `EXAMPLE TASKS (calibrate your specificity and format to this standard):
early: { "main": "After waking: drink a full glass of water before your coffee — starts metabolism gently", "floor": "If rushed: one sip still sets the trigger, build the cue first", "time_of_day": "morning" }
late:  { "main": "After dinner: 20-min walk before sitting down — healthy people move after eating", "floor": "If full and tired: 10-min slow stroll still activates the habit", "time_of_day": "evening" }`
  }

  if (['quit', 'stop', 'cut'].includes(verb)) {
    return `EXAMPLE TASKS (calibrate your specificity and format to this standard):
early: { "main": "When craving hits: do 10 jumping jacks then drink cold water — redirect the urge physically", "floor": "If urge is strong: step outside for 2 mins of fresh air instead", "time_of_day": "afternoon" }
late:  { "main": "After dinner: review today's craving log — spot the pattern and plan tomorrow's counter-move", "floor": "If too tired: just note the biggest trigger of today in one word", "time_of_day": "evening" }`
  }

  if (['meditate'].includes(verb) || /meditat|mindful/.test(obj)) {
    return `EXAMPLE TASKS (calibrate your specificity and format to this standard):
early: { "main": "After brushing teeth: sit for 5 mins, eyes closed, focus only on your breath — mark it done", "floor": "If 2 mins: three slow deep belly breaths counts as the practice", "time_of_day": "morning" }
late:  { "main": "After morning coffee: 20-min guided body-scan sit — this stillness is who you are", "floor": "If short on time: 10-min breath-focus session instead", "time_of_day": "morning" }`
  }

  if (['write', 'publish'].includes(verb) || /writ|book|blog/.test(obj)) {
    return `EXAMPLE TASKS (calibrate your specificity and format to this standard):
early: { "main": "After first coffee: write 100 words — no editing allowed, just output — mark your streak", "floor": "If blocked: write one sentence, even a terrible one, and stop", "time_of_day": "morning" }
late:  { "main": "After morning coffee: 500-word focused session on current draft — writers write every day", "floor": "If low energy: re-read yesterday's work and add one paragraph", "time_of_day": "morning" }`
  }

  return `EXAMPLE TASKS (calibrate your specificity and format to this standard):
early: { "main": "After morning coffee: 10-min focused practice — note one specific thing that clicked today", "floor": "If 2 mins: review your goal and visualise one successful rep", "time_of_day": "morning" }
late:  { "main": "After morning routine: full 30-min session — this is who you are now", "floor": "If low energy: the 10-min version still builds the identity", "time_of_day": "morning" }`
}

// ─── Narrative user profile ────────────────────────────────────────────────────
function buildUserProfile(
  goalVerb: string, goalObject: string, goalOutcome: string,
  identityStatement: string, currentFrequency: string, availableTime: string,
  experienceLevel: string, constraints: string[], _stagesOfChange: string
): string {
  const freqLabels: Record<string, string> = {
    never:       'has never done this before',
    once_week:   'currently does this about once a week',
    '2_3x_week': 'currently does this 2–3 times a week',
    daily:       'already does this daily',
  }
  const timeLabels: Record<string, string> = {
    '15min':       '15 minutes',
    '30min':       '30 minutes',
    '1hour':       '1 hour',
    '2plus_hours': '2+ hours',
  }
  const expLabels: Record<string, string> = {
    beginner:              'a complete beginner',
    some_experience:       'someone with some relevant experience',
    restarting:            'someone who has done this before and is now restarting',
    intermediate_advanced: 'at an intermediate to advanced level',
  }
  const constraintLabels: Record<string, string> = {
    early_mornings: 'their best time is early mornings',
    no_gym:         'they have no gym access — all tasks must work at home or outdoors, never reference gym equipment',
    work_from_home: 'they work from home — anchor tasks to WFH daily rhythms',
    travel:         'they travel frequently — tasks must work in hotels and airports with no equipment',
  }

  const freq      = freqLabels[currentFrequency] ?? currentFrequency
  const time      = timeLabels[availableTime]    ?? availableTime
  const exp       = expLabels[experienceLevel]   ?? experienceLevel
  const activeCons = (constraints || []).filter(c => c !== 'none').map(c => constraintLabels[c] ?? c)
  const consStr   = activeCons.length > 0 ? activeCons.join('; ') : 'no specific constraints'

  return `USER PROFILE:
The user wants to ${goalVerb} ${goalObject} so that they can ${goalOutcome}. They are ${exp} and ${freq}. They have ${time} available per day. Key context: ${consStr}. Their identity goal is to become: "${identityStatement}".`
}

// ─── Static system prompt — fully cacheable across all users ──────────────────
const STATIC_SYSTEM_PROMPT = `You are a habit coach who designs daily behavioural tasks using James Clear's 4 Laws of Behavior Change. Your specific domain role and user context will be provided in each user message — apply both fully.

WAVE PROGRESSION — 3 phases:
- early (foundation): Tiny, friction-free habits anchored to existing routines. No performance pressure. For Preparation-stage users: environment design tasks only (buy, place, schedule, clear space — no output targets).
- mid (build): Same anchors, expanded duration or intensity. Consistency over heroics.
- late (peak + identity): Highest effort. Tasks must explicitly state who the user is BECOMING. Identity-affirming language required every time.

4 LAWS — apply to every task:
1. Make it Obvious: main task must start with an anchor — "After [existing habit]: [action]"
2. Make it Attractive: late-phase tasks must reference the user's identity goal in the task wording itself
3. Make it Easy: every task needs a floor version — minimum viable action when motivation is low. Must start with "If "
4. Make it Satisfying: end the main task with a micro-reward — sensory reward, completion ritual, or progress note

TIME OF DAY rules:
- Match to real human life: exercise → morning or evening; reflection/journaling → evening or night; nutrition → midday or evening; learning/practice → morning or afternoon; craving management → afternoon or evening
- The 2 tasks within each phase MUST have DIFFERENT time_of_day values

HABIT STACKING — build a compounding routine:
- mid phase: at least 1 task must anchor onto a habit established in the early phase
  Pattern: "After [early anchor] + [added step]: [action] — [reward]"
- late phase: at least 1 task anchors onto both early + mid habits using a shorthand
  Pattern: "After [routine/warm-up]: [peak action] — [identity reward]"

OUTPUT — return ONLY valid JSON, no markdown, no explanation, no text outside the JSON:
{
  "segments": [
    {
      "name": "exact segment name from input — do not change",
      "tasks": {
        "early": [
          { "main": "After [anchor]: [specific action] — [reward]", "floor": "If [condition]: [minimal action]", "time_of_day": "morning", "type": "once" },
          { "main": "...", "floor": "...", "time_of_day": "evening", "type": "daily" }
        ],
        "mid":  [ 2 task objects ],
        "late": [ 2 task objects — both must contain identity language ]
      }
    }
  ]
}

HARD LIMITS:
- Exactly 2 task objects per phase (early, mid, late) — no more, no fewer
- main: ≤120 characters — be specific and actionable, use domain knowledge, never write generic phrases like "do some practice" or "work on your goal"
- floor: ≤80 characters, must start with "If "
- time_of_day: exactly one of: morning, midday, afternoon, evening, night
- The 2 tasks in each phase must have DIFFERENT time_of_day values
- type: "once" for one-time actions the user does only at the start of a phase (buy, download, install, clear space, place equipment, book, configure, block calendar, set up). "daily" for repeating habits (walk, run, practice, meditate, journal, eat, stretch, review, log). Default to "daily" if unsure. Early-phase setup tasks are nearly always "once". Mid and late tasks are nearly always "daily".`

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

    const domainRole     = getDomainRole(goalVerb, goalObject)
    const domainExamples = getDomainExamples(goalVerb, goalObject)
    const userProfile    = buildUserProfile(
      goalVerb, goalObject, goalOutcome, identityStatement,
      currentFrequency, availableTime, experienceLevel, constraints, stagesOfChange
    )

    const segmentList = segments
      .map((s: { name: string; description: string }, i: number) => `${i + 1}. "${s.name}" — ${s.description}`)
      .join('\n')

    const userMessage = `YOUR ROLE FOR THIS USER: ${domainRole}

${userProfile}

${getStageInstruction(stagesOfChange)}

TASK DURATION GUIDE: ${getDurationGuide(availableTime)}

ANCHOR HINTS — choose realistic anchors from these options based on the user's lifestyle:
${getAnchorHints(constraints)}

${domainExamples}

SEGMENTS TO GENERATE TASKS FOR (${durationWeeks}-week challenge):
${segmentList}

Apply your domain expertise fully — write tasks a real expert in this field would actually prescribe. Late-phase tasks must include identity language referencing becoming "${identityStatement}".`

    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicKey,
        'anthropic-version': '2023-06-01',
        'anthropic-beta': 'prompt-caching-2024-07-31',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 3000,
        temperature: 0.4,
        system: [
          {
            type: 'text',
            text: STATIC_SYSTEM_PROMPT,
            cache_control: { type: 'ephemeral' },
          },
        ],
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

    // Normalise: 2 task objects per phase, enforce char limits in code
    const VALID_TIMES = ['morning', 'midday', 'afternoon', 'evening', 'night']
    if (Array.isArray(result.segments)) {
      result.segments = result.segments.map((seg: any) => {
        const normalisePhase = (phase: any[]): any[] => {
          if (!Array.isArray(phase)) return []
          return phase.slice(0, 2).map((t: any) => ({
            main:        typeof t.main  === 'string' ? t.main.slice(0, 120)  : String(t.main  ?? ''),
            floor:       typeof t.floor === 'string' ? t.floor.slice(0, 80)  : String(t.floor ?? ''),
            time_of_day: VALID_TIMES.includes(t.time_of_day) ? t.time_of_day : 'morning',
            type:        t.type === 'once' ? 'once' : 'daily',
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
