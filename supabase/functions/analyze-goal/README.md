# analyze-goal Edge Function

This Supabase Edge Function uses the Claude API to analyze a user's 90-day goal
and generate a structured multi-segment challenge plan.

## Setup

1. Set the required secrets in your Supabase project:

```bash
supabase secrets set ANTHROPIC_API_KEY=your-claude-api-key-here
```

2. Deploy the function:

```bash
supabase functions deploy analyze-goal
```

## Environment Variables

| Variable | Description |
|---|---|
| `ANTHROPIC_API_KEY` | Your Anthropic Claude API key |
| `SUPABASE_URL` | Auto-set by Supabase |
| `SUPABASE_ANON_KEY` | Auto-set by Supabase |

## Security

- Requires a valid Supabase JWT in the Authorization header
- Validates user session before making Claude API calls
- API key never exposed to the client
