# Fix Plan

## 1. Community Chat — clicking a searched user does nothing

**Root cause:** In `src/components/community/CommunityMessages.tsx → startConversationWithUser`, after `supabase.from('conversations').insert({}).select().single()`, the SELECT is blocked by RLS (`is_conversation_member(id)` returns false because the user has not yet been added to `conversation_participants`). So `newConv` is `null`, the function silently `return`s, and nothing happens on screen.

**Fix:**
- Generate the conversation id client-side with `crypto.randomUUID()`.
- Insert the conversation row with that explicit `id` (no `.select().single()` round-trip needed).
- Insert both participant rows (current user + other user) using the same id.
- Build the `Conversation` object locally and set it as selected.
- Add proper error toasts so future failures aren't silent.

## 2. Soil Report translation gaps (Hindi & Marathi)

The section headers ("पीक शिफारसी", "AI सारांश", "समस्या आणि उपाय", "पोषक विश्लेषण", etc.) translate correctly, but the AI-generated **content** stays in English: crop names ("Rice (Paddy)", "Cotton"…), Suitability badges ("High/Medium"), expected yield text ("20-25 quintals per acre"), problem titles ("Soil Acidity (Low pH 5.6)", "Severe Potassium Deficiency"), and the inline labels ("पिकावर परिणाम"-marathi but body English).

**Fixes:**

- **`supabase/functions/analyze-soil/index.ts`** — tighten the system prompt:
  - Add explicit rule: "Translate EVERY user-visible string including `crop`, `expectedYield`, `problem`, `whyItAffects`, `solution`, `applicationMethod`, `bestTimeToApply`, `expectedImprovement`, `issue`, fertilizer `name`, etc."
  - Keep only the enum fields (`healthStatus`, `nutrientAnalysis.*.status`, `cropRecommendations[*].suitability`, `category`) as fixed English tokens so the UI can map them.
  - Add few-shot example showing a Marathi `crop`, `expectedYield`, `problem` line.

- **`src/components/soil/AIAnalysisSection.tsx`** — add display-time translation for the enum tokens that must stay English in JSON:
  - Map `Suitability` (High/Medium/Low) → hi/mr labels in the crop table.
  - Map `status` (Low/Optimal/High) → hi/mr labels in nutrient cards & badges.
  - Already-translated section/field labels stay as-is.

## 3. TTS in Hindi / Marathi

`SoilReport.tsx → handleVoiceExplanation` already:
- Calls the `soil-tts` edge function to translate the script to the active language.
- Sets `utterance.lang = 'hi-IN' | 'mr-IN' | 'en-US'`.
- Picks the best matching `SpeechSynthesisVoice`.

Once fix #2 lands, the `spokenText` returned by `soil-tts` will be in Hindi/Marathi (it converts `analysis.summary` + insights, which will themselves now be in the target language). No further code change is required for the TTS path; the existing voice-matching fallback handles devices without an Indic voice.

## Files touched

- `src/components/community/CommunityMessages.tsx` (chat fix)
- `supabase/functions/analyze-soil/index.ts` (stronger translation prompt)
- `src/components/soil/AIAnalysisSection.tsx` (Suitability/Status label mapping)
