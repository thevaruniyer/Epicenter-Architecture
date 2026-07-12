import { ChevronLeft } from "lucide-react";
import { Button } from "@epicenter/ui";
import { ONBOARDING_STEPS, TOTAL_STEPS } from "@/lib/onboarding";
import {
  onboardingBack,
  saveOnboardingStep,
  skipOnboarding,
} from "@/lib/actions/onboarding";

type Extracurricular = { activity?: string };
type Profile = {
  grade: number | null;
  age: number | null;
  subjects: string[] | null;
  hobbies: string[] | null;
  intended_major: string | null;
  extracurriculars: Extracurricular[] | null;
};

const fieldClass =
  "w-full rounded-md border border-border-strong bg-surface-raised px-3 py-2.5 text-ink outline-none placeholder:text-ink-tertiary focus-visible:ring-2 focus-visible:ring-yellow";

export function OnboardingStepForm({
  step,
  profile,
}: {
  step: number;
  profile: Profile;
}) {
  const meta = ONBOARDING_STEPS[step]!;
  const isLast = step >= TOTAL_STEPS - 1;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        {step > 0 ? (
          <form action={onboardingBack}>
            <input type="hidden" name="step" value={step} />
            <button
              type="submit"
              className="inline-flex items-center gap-1 text-sm text-ink-secondary transition-colors hover:text-ink"
            >
              <ChevronLeft className="size-4" aria-hidden />
              Previous Page
            </button>
          </form>
        ) : (
          <span />
        )}
        <form action={skipOnboarding}>
          <button
            type="submit"
            className="text-sm font-medium text-ink-secondary transition-colors hover:text-ink"
          >
            Skip for now
          </button>
        </form>
      </div>

      <h1 className="text-3xl font-bold tracking-tight text-ink text-balance">
        {meta.question}
      </h1>
      <p className="mt-2 text-sm text-ink-secondary">{meta.subtitle}</p>

      <form action={saveOnboardingStep} className="mt-8 flex flex-col gap-6">
        <input type="hidden" name="step" value={step} />
        <StepField step={step} profile={profile} />
        <Button type="submit" className="w-fit">
          {isLast ? "Finish" : "Next"}
        </Button>
      </form>
    </div>
  );
}

function StepField({ step, profile }: { step: number; profile: Profile }) {
  switch (step) {
    case 0:
      return (
        <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
          Age
          <input
            name="age"
            type="number"
            min={10}
            max={25}
            defaultValue={profile.age ?? ""}
            required
            className={`${fieldClass} max-w-[8rem]`}
          />
        </label>
      );
    case 1:
      return (
        <fieldset className="flex flex-col gap-2">
          <legend className="mb-1 text-sm font-medium text-ink">Grade</legend>
          {([11, 12] as const).map((g) => (
            <label
              key={g}
              className="flex cursor-pointer items-center gap-3 rounded-md border border-border-strong bg-surface-raised px-3 py-2.5 text-sm text-ink has-[:checked]:border-yellow has-[:checked]:ring-2 has-[:checked]:ring-yellow"
            >
              <input
                type="radio"
                name="grade"
                value={g}
                defaultChecked={profile.grade === g}
                required
                className="accent-yellow"
              />
              Grade {g}
            </label>
          ))}
        </fieldset>
      );
    case 2:
      return (
        <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
          Subjects
          <textarea
            name="subjects"
            rows={4}
            defaultValue={(profile.subjects ?? []).join("\n")}
            placeholder={"Computer Science HL\nMathematics HL\nPhysics SL"}
            className={fieldClass}
          />
        </label>
      );
    case 3:
      return (
        <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
          Hobbies &amp; interests
          <textarea
            name="hobbies"
            rows={4}
            defaultValue={(profile.hobbies ?? []).join("\n")}
            placeholder="Tell us in your own words…"
            className={fieldClass}
          />
        </label>
      );
    case 4:
      return (
        <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
          Intended major
          <input
            name="intended_major"
            type="text"
            defaultValue={profile.intended_major ?? ""}
            placeholder="However you'd describe it"
            className={fieldClass}
          />
        </label>
      );
    case 5:
      return (
        <label className="flex flex-col gap-1.5 text-sm font-medium text-ink">
          Extracurriculars
          <textarea
            name="extracurriculars"
            rows={4}
            defaultValue={(profile.extracurriculars ?? [])
              .map((ec) => ec.activity ?? "")
              .filter(Boolean)
              .join("\n")}
            placeholder={"Robotics Club — Team Lead\nDebate Team — 2 yrs"}
            className={fieldClass}
          />
        </label>
      );
    default:
      return null;
  }
}
