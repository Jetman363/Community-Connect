import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface PlaceholderPageProps {
  title: string;
  description: string;
  phase?: number;
}

export function PlaceholderPage({ title, description, phase = 2 }: PlaceholderPageProps) {
  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <CardTitle>{title}</CardTitle>
            <Badge variant="accent">Phase {phase}</Badge>
          </div>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[var(--muted-foreground)]">
            This section is scaffolded in Phase 1. Feature implementation arrives in Phase {phase}.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
