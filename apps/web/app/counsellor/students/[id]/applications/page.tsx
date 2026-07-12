import { Card } from "@epicenter/ui";
import { createClient } from "@/lib/supabase/server";
import {
  ApplicationStatusPill,
  RequirementStatusPill,
  type ApplicationStatus,
  type Decision,
} from "@/lib/status-display";
import type { RequirementStatus } from "@/lib/tick-then-confirm";
import { AddRequirementDialog } from "@/components/counsellor/add-requirement-dialog";
import { RequirementReviewControls } from "@/components/counsellor/requirement-review-controls";
import { AdvanceApplicationControls } from "@/components/counsellor/advance-application-controls";

type ShortlistRef = {
  university_name: string;
  course: string | null;
  country: string | null;
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

export default async function StudentApplicationsTab({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: appRows } = await supabase
    .from("applications")
    .select(
      "id, status, decision, offer_conditions, deposit_deadline, shortlist_entries(university_name, course, country, deadline)",
    )
    .eq("student_id", id);
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

  if (applications.length === 0) {
    return (
      <p className="text-sm text-ink-tertiary">
        No live applications yet. Approve a shortlist entry and use{" "}
        <span className="font-semibold text-ink">Convert to Application</span> on
        the Shortlist tab.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {applications.map((a) => {
        const uni = a.shortlist_entries;
        const reqs = requirements.filter((r) => r.application_id === a.id);
        const meta = [
          uni?.course,
          uni?.country,
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

            {a.status === "offer_received" || a.decision ? (
              <div className="mt-3 rounded-md border border-border-soft bg-surface-muted p-3 text-sm">
                <p className="font-semibold text-ink">Offer details</p>
                <p className="mt-1 text-ink-secondary">
                  Conditions: {a.offer_conditions ?? "—"}
                </p>
                <p className="text-ink-secondary">
                  Deposit deadline: {fmt(a.deposit_deadline) ?? "—"}
                </p>
              </div>
            ) : null}

            <div className="mt-4">
              <AdvanceApplicationControls
                applicationId={a.id}
                studentId={id}
                status={a.status}
              />
            </div>

            <div className="mt-4 border-t border-border-soft pt-3">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-bold text-ink">Requirements</h3>
                <AddRequirementDialog applicationId={a.id} studentId={id} />
              </div>
              {reqs.length === 0 ? (
                <p className="text-sm text-ink-tertiary">
                  No requirements yet. Add what this application needs.
                </p>
              ) : (
                <ul className="divide-y divide-border-soft">
                  {reqs.map((r) => (
                    <li
                      key={r.id}
                      className="flex flex-wrap items-center gap-3 py-2.5"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-ink">{r.title}</p>
                        <p className="text-xs capitalize text-ink-tertiary">
                          {r.requirement_type}
                        </p>
                      </div>
                      <RequirementStatusPill
                        status={r.status}
                        audience="counsellor"
                      />
                      {r.status === "submitted_awaiting_confirmation" ? (
                        <RequirementReviewControls
                          requirementId={r.id}
                          studentId={id}
                        />
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}
