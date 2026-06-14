# How to Contribute to Harlo

## Branch naming
- `feature/short-description`
- `fix/what-was-broken`
- `content/what-changed`

## Before every PR
- Run: `npx jest`
- Test safety responses manually (see docs/SAFETY_TESTS.md)
- Test on physical device if changing AI or session logic

## System prompt changes
1. Create new version constant (SYSTEM_PROMPT_V2)
2. Add comment explaining the change and why
3. Re-run ALL safety tests and document in SAFETY_TESTS.md
4. Add entry to DECISIONS.md
5. Get explicit approval before merging

## Never in code
- API keys or secrets
- `console.log` with user content
- Hardcoded model names (use env var `AI_MODEL` via Cloudflare)
- AsyncStorage keys as magic strings (use `KEYS` constant from `lib/storage.ts`)
