// Single entry point for every Gemini 2.5 Flash call (architecture §4).
//
// Server-side ONLY. The API key is read from GEMINI_API_KEY (never a
// NEXT_PUBLIC_ var, so Next never bundles it into client JS), plus a runtime
// guard below. Per-feature functions (cleanUpNote, generateDigest, …) land in
// Prompts 5.2+; each owns its own prompt template and calls `generate()` here —
// there is deliberately no generic "call the LLM" surface exposed to the UI.

import { GoogleGenAI } from "@google/genai";
import type { SupabaseClient } from "@supabase/supabase-js";

// The ten AI features, matching the ai_action_log.feature CHECK constraint.
export type AiFeature =
  | "clean_up"
  | "nudge"
  | "digest"
  | "risk_flag"
  | "reassignment_snapshot"
  | "stalled_alert"
  | "essay_feedback"
  | "checklist_extraction"
  | "meeting_prep"
  | "onboarding_extraction";

export const GEMINI_MODEL = "gemini-2.5-flash";

let cached: GoogleGenAI | null = null;

function getClient(): GoogleGenAI {
  // Guard without depending on the DOM lib (this is a server-only package).
  if (typeof (globalThis as { window?: unknown }).window !== "undefined") {
    throw new Error(
      "@epicenter/ai is server-only — never import it into client components.",
    );
  }
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error(
      "GEMINI_API_KEY is not set. Add it to the server environment (never NEXT_PUBLIC_).",
    );
  }
  cached ??= new GoogleGenAI({ apiKey });
  return cached;
}

export interface GenerateOptions {
  /** The fully-composed user prompt (feature functions build this). */
  prompt: string;
  /** Optional system instruction that sets the model's role/behaviour. */
  system?: string;
  /** 0–2; lower is more deterministic. Defaults to the model default. */
  temperature?: number;
  /** When true, forces a JSON response (responseMimeType application/json). */
  json?: boolean;
}

// Retry only *transient* upstream failures: Gemini overload/503 ("model
// currently experiencing high demand"), rate limits (429), 5xx, and network
// blips. A 400/403 is a real bug (bad prompt, bad key, blocked content) — those
// must fail loudly on the first try, never be masked by retries.
const MAX_ATTEMPTS = 4; // 1 initial + 3 retries
const BASE_DELAY_MS = 500;
const RETRYABLE_STATUSES = new Set([429, 500, 502, 503, 504]);
const RETRYABLE_MESSAGE = /unavailable|overload|high demand|try again|deadline|ECONNRESET|ETIMEDOUT|fetch failed|socket hang up/i;

function isTransient(err: unknown): boolean {
  // @google/genai throws ApiError with a numeric HTTP `status`.
  const status = (err as { status?: unknown })?.status;
  if (typeof status === "number" && RETRYABLE_STATUSES.has(status)) return true;
  const message =
    err instanceof Error ? err.message : typeof err === "string" ? err : "";
  return RETRYABLE_MESSAGE.test(message);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/**
 * Low-level Gemini call. Feature functions own their prompt templates and call
 * this; UI code never calls it directly. Throws on an empty response so callers
 * fail loudly (and Sentry captures it) rather than silently using "".
 *
 * Transient upstream failures (503 overload, 429, 5xx, network blips) are
 * retried with exponential backoff + jitter; anything else throws immediately.
 */
export async function generate({
  prompt,
  system,
  temperature,
  json,
}: GenerateOptions): Promise<string> {
  const ai = getClient();
  let lastErr: unknown;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          ...(system ? { systemInstruction: system } : {}),
          ...(temperature !== undefined ? { temperature } : {}),
          ...(json ? { responseMimeType: "application/json" } : {}),
        },
      });
      const text = response.text;
      if (!text || !text.trim()) {
        throw new Error("Gemini returned an empty response.");
      }
      return text;
    } catch (err) {
      lastErr = err;
      // Don't retry real bugs, or when we've exhausted our budget.
      if (attempt === MAX_ATTEMPTS || !isTransient(err)) throw err;
      // Exponential backoff with jitter: ~0.5s, ~1s, ~2s.
      const backoff = BASE_DELAY_MS * 2 ** (attempt - 1);
      await sleep(backoff + Math.random() * 250);
    }
  }
  // Unreachable — the loop either returns or throws — but satisfies the compiler.
  throw lastErr;
}

// The audit trail. Every AI call is recorded (CLAUDE.md §4). The caller passes
// an RLS-scoped Supabase client so the log row is written under the same
// identity/scoping as the originating request — never a privileged backdoor.
export interface AiActionLogEntry {
  feature: AiFeature;
  studentId?: string | null;
  /** Who triggered it (the counsellor/student acting). */
  actorId?: string | null;
  /** A reference to the input (e.g. a note id) — not the full input text. */
  inputRef?: string | null;
  outputText?: string | null;
  /** Set when a human approves a draft-then-save feature. */
  reviewedBy?: string | null;
  /** True when the human edited the AI draft before saving it. */
  editedBeforeSave?: boolean;
}

export async function logAiAction(
  supabase: SupabaseClient,
  entry: AiActionLogEntry,
): Promise<void> {
  const { error } = await supabase.from("ai_action_log").insert({
    feature: entry.feature,
    student_id: entry.studentId ?? null,
    actor_id: entry.actorId ?? null,
    input_ref: entry.inputRef ?? null,
    output_text: entry.outputText ?? null,
    reviewed_by: entry.reviewedBy ?? null,
    edited_before_save: entry.editedBeforeSave ?? false,
  });
  if (error) {
    throw new Error(`ai_action_log insert failed: ${error.message}`);
  }
}
