import { getSessionUser } from "@/lib/auth";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@epicenter/ui";
import { getDigest } from "@/lib/digest";
import { DigestCard } from "@/components/counsellor/digest-card";

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
  const digest = user ? await getDigest(user.id) : [];

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

      <DigestCard lines={digest} />

      <div className="grid gap-4 md:grid-cols-2">
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
      </div>
    </div>
  );
}
