import { Card } from "@epicenter/ui";

// Lightweight placeholder for student-workspace tabs not yet built.
export function TabPlaceholder({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <Card>
      <h2 className="text-lg font-semibold text-ink">{title}</h2>
      <p className="mt-1 text-sm text-ink-secondary">{message}</p>
    </Card>
  );
}
