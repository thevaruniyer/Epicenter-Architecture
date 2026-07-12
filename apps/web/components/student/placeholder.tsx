import { Card } from "@epicenter/ui";

// On-brand placeholder for student sections not yet built (no dead ends).
export function StudentPlaceholder({
  title,
  message,
}: {
  title: string;
  message: string;
}) {
  return (
    <Card>
      <h1 className="text-2xl font-bold tracking-tight text-ink">{title}</h1>
      <p className="mt-2 text-sm text-ink-secondary">{message}</p>
    </Card>
  );
}
