import { ChevronLeft } from "lucide-react";
import { ONBOARDING_STEPS, TOTAL_STEPS } from "@/lib/onboarding";
import {
  onboardingBack,
  saveOnboardingStep,
  skipOnboarding,
} from "@/lib/actions/onboarding";
import { OnboardingTagField } from "@/components/onboarding/tag-field";
import {
  StepSubmitButton,
  StepTextSubmitButton,
} from "@/components/onboarding/step-submit-button";

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
            <StepTextSubmitButton className="inline-flex items-center gap-1 text-sm text-ink-secondary transition-colors hover:text-ink">
              <ChevronLeft className="size-4" aria-hidden />
              Previous Page
            </StepTextSubmitButton>
          </form>
        ) : (
          <span />
        )}
        <form action={skipOnboarding}>
          <StepTextSubmitButton className="text-sm font-medium text-ink-secondary transition-colors hover:text-ink">
            Skip for now
          </StepTextSubmitButton>
        </form>
      </div>

      <h1 className="text-3xl font-bold tracking-tight text-ink text-balance">
        {meta.question}
      </h1>
      <p className="mt-2 text-sm text-ink-secondary">{meta.subtitle}</p>

      <form action={saveOnboardingStep} className="mt-8 flex flex-col gap-6">
        <input type="hidden" name="step" value={step} />
        <StepField step={step} profile={profile} />
        <StepSubmitButton label={isLast ? "Finish" : "Next"} />
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
        <OnboardingTagField
          name="hobbies"
          kind="hobbies"
          label="Hobbies & interests"
          placeholder="Tell us in your own words…"
          defaultValue={(profile.hobbies ?? []).join("\n")}
        />
      );
    case 4:
      return (
        <OnboardingTagField
          name="intended_major"
          kind="major"
          label="Intended major"
          placeholder="However you'd describe it"
          defaultValue={profile.intended_major ?? ""}
          multiline={false}
        />
      );
    case 5:
      return (
        <OnboardingTagField
          name="extracurriculars"
          kind="extracurriculars"
          label="Extracurriculars"
          placeholder={"Robotics Club · Team Lead\nDebate Team · 2 yrs"}
          defaultValue={(profile.extracurriculars ?? [])
            .map((ec) => ec.activity ?? "")
            .filter(Boolean)
            .join("\n")}
        />
      );
    default:
      return null;
  }
}
