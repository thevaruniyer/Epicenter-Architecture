import { Card } from "@epicenter/ui";
import { createClient } from "@/lib/supabase/server";
import {
  ApplicationStatusPill,
  RequirementStatusPill,
  type ApplicationStatus,
  type Decision,
} from "@/lib/status-display";
import type { RequirementStatus } from "@/lib/tick-then-confirm";
import { SubmitRequirementButton } from "@/components/student/submit-requirement-button";
import { RecordDecisionControls } from "@/components/student/record-decision-controls";

type ShortlistRef = {
  university_name: string;
  course: string | null;
  deadline: string | null;
} | null;
type Application = {
  id: string;
  status: ApplicationStatus;
  decision: Decision | null;
  offer_conditions: string | null;
  deposit_deadline: string | null;
  shortlist_entries: ShortlistRef;
};
type Requirement = {
  id: string;
  application_id: string;
  title: string;
  requirement_type: string;
  status: RequirementStatus;
};

function fmt(iso: string | null): string | null {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

export default async function StudentApplicationPage() {
  const supabase = await createClient();

  const { data: appRows } = await supabase
    .from("applications")
    .select(
      "id, status, decision, offer_conditions, deposit_deadline, shortlist_entries(university_name, course, deadline)",
    );
  const applications = (appRows as Application[] | null) ?? [];

  const appIds = applications.map((a) => a.id);
  let requirements: Requirement[] = [];
  if (appIds.length) {
    const { data: reqRows } = await supabase
      .from("application_requirements")
      .select("id, application_id, title, requirement_type, status")
      .in("application_id", appIds)
      .order("title");
    requirements = (reqRows as Requirement[]) ?? [];
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-wide text-ink-secondary">
          My Application
        </p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-ink">
          My Application
        </h1>
      </div>

      {applications.length === 0 ? (
        <Card>
          <p className="text-sm text-ink-secondary">
            You don&rsquo;t have any live applications yet. Once you and your
            counsellor convert a shortlist entry, it&rsquo;ll show up here.
          </p>
        </Card>
      ) : (
        applications.map((a) => {
          const uni = a.shortlist_entries;
          const reqs = requirements.filter((r) => r.application_id === a.id);
          const meta = [
            uni?.course,
            fmt(uni?.deadline ?? null) ? `Deadline ${fmt(uni?.deadline ?? null)}` : null,
          ]
            .filter(Boolean)
            .join(" · ");

          return (
            <Card key={a.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-base font-bold text-ink">
                    {uni?.university_name ?? "University"}
                  </p>
                  {meta ? (
                    <p className="mt-0.5 text-sm text-ink-secondary">{meta}</p>
                  ) : null}
                </div>
                <ApplicationStatusPill status={a.status} decision={a.decision} />
              </div>

              {a.status === "offer_received" && !a.decision ? (
                <div className="mt-3 rounded-md border border-reach-border bg-reach-bg p-3 text-sm">
                  <p className="font-bold text-reach-ink">You have an offer 🎉</p>
                  <p className="mt-1 text-ink-secondary">
                    Conditions: {a.offer_conditions ?? "—"}
                  </p>
                  <p className="text-ink-secondary">
                    Deposit deadline: {fmt(a.deposit_deadline) ?? "—"}
                  </p>
                  <div className="mt-3">
                    <RecordDecisionControls applicationId={a.id} />
                  </div>
                </div>
              ) : null}

              {reqs.length > 0 ? (
                <div className="mt-4 border-t border-border-soft pt-3">
                  <h3 className="mb-2 text-sm font-bold text-ink">
                    What&rsquo;s needed
                  </h3>
                  <ul className="divide-y divide-border-soft">
                    {reqs.map((r) => {
                      const canSubmit =
                        r.status === "awaiting_student" ||
                        r.status === "needs_revision";
                      return (
                        <li
                          key={r.id}
                          className="flex flex-wrap items-center gap-3 py-2.5"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-ink">
                              {r.title}
                            </p>
                            <p className="text-xs capitalize text-ink-tertiary">
                              {r.requirement_type}
                            </p>
                          </div>
                          <RequirementStatusPill
                            status={r.status}
                            audience="student"
                          />
                          {canSubmit ? (
                            <SubmitRequirementButton
                              requirementId={r.id}
                              label={
                                r.status === "needs_revision"
                                  ? "Resubmit"
                                  : "Submit for review"
                              }
                            />
                          ) : null}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ) : null}
            </Card>
          );
        })
      )}
    </div>
  );
}
