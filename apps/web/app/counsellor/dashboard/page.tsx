import { getSessionUser } from "@/lib/auth";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@epicenter/ui";

function firstName(email: string | null): string {
  if (!email) return "there";
  const handle = email.split("@")[0] ?? "";
  const name = handle.split(/[._-]/)[0] ?? handle;
  return name ? name.charAt(0).toUpperCase() + name.slice(1) : "there";
}

// Counsellor dashboard shell (UC1 Screen 1). The live AI digest, caseload counts
// and deadlines are wired in later phases; this is the on-brand landing.
export default async function CounsellorDashboardPage() {
  const user = await getSessionUser();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-ink-tertiary">
          Dashboard
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink">
          Good day, {firstName(user?.email ?? null)}
        </h1>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Your caseload</CardTitle>
            <CardDescription>Students assigned to you.</CardDescription>
          </CardHeader>
          <CardContent className="text-ink-secondary">
            Open the Students grid to manage your caseload.
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending your confirmation</CardTitle>
            <CardDescription>Tick-then-confirm queue.</CardDescription>
          </CardHeader>
          <CardContent className="text-ink-secondary">
            Items students have marked done appear here for review.
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Daily digest</CardTitle>
            <CardDescription>AI-assisted summary.</CardDescription>
          </CardHeader>
          <CardContent className="text-ink-secondary">
            A plain-language digest of what needs attention arrives in a later phase.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
