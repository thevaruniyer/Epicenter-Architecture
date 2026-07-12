// @epicenter/ai — Gemini 2.5 Flash abstraction layer.
// client.ts is the single entry point for all Gemini calls (architecture §4).
// Per-feature functions (cleanUpNote, extractSignals, generateDigest, …) are
// added one at a time in Build Runbook Prompts 5.2+, each in its own file,
// re-exported here. Server-side only; API key from env, never client-exposed.
export {
  generate,
  logAiAction,
  GEMINI_MODEL,
  type AiFeature,
  type GenerateOptions,
  type AiActionLogEntry,
} from "./client";

export { cleanUpNote, type CleanUpMode } from "./clean-up-note";
export {
  extractSignals,
  TASK_CATEGORIES,
  type TaskCategory,
  type ExtractedSignal,
} from "./extract-signals";
export {
  extractOnboardingTags,
  type OnboardingField,
} from "./extract-onboarding-tags";
