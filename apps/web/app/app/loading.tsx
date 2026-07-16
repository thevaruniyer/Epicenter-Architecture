// Stage 9 Prompt 9.13: closing a gap in 9.4's sweep. This route never renders
// content — it's a pure post-login redirect router — so a blank, on-brand
// background is the correct "loading" state, not a skeleton with nothing to
// mirror. role="status" — see counsellor/dashboard/loading.tsx.
export default function Loading() {
  return <div className="min-h-screen bg-paper" role="status" aria-label="Loading" />;
}
