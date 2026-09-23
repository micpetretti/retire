import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import type { Accent } from "./SliderField";

const accentHeader: Record<Accent, string> = {
  sun: "bg-sun",
  sky: "bg-sky",
  lilac: "bg-lilac",
};

interface SectionProps {
  id: string;
  title: string;
  accent: Accent;
  children: ReactNode;
}

export function Section({ id, title, accent, children }: SectionProps) {
  return (
    <Card className="overflow-visible" id={`section-${id}`}>
      <header
        className={[
          "border-brut-b flex items-center justify-between gap-3 px-4 py-3 sm:px-6",
          accentHeader[accent],
        ].join(" ")}
      >
        <h2 className="uppercase-label font-sans text-xl sm:text-2xl">{title}</h2>
        <Button
          size="sm"
          disabled
          title="Expert mode is coming soon"
          className="px-1.5! py-1!"
        >
          <span className="bg-surface px-2 py-0.5">Expert — coming soon</span>
        </Button>
      </header>
      <div className="divide-y-3 divide-ink">{children}</div>
    </Card>
  );
}
