"use client";

import { ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import type { PlanResult } from "@/lib/finance/types";
import { formatSignedEuro } from "@/lib/format";
import { verdictHeadline } from "./ResultPanel";

interface MobileResultBarProps {
  result: PlanResult;
  /** id of the element to observe / scroll to. */
  targetId: string;
}

export function MobileResultBar({ result, targetId }: MobileResultBarProps) {
  const [panelVisible, setPanelVisible] = useState(false);

  useEffect(() => {
    const target = document.getElementById(targetId);
    if (!target || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => setPanelVisible(entry.isIntersecting),
      { threshold: 0.15 },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [targetId]);

  const scrollToPanel = () => {
    document
      .getElementById(targetId)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <button
      type="button"
      onClick={scrollToPanel}
      aria-label="Scroll to full result"
      data-testid="mobile-result-bar"
      className={[
        "border-brut-t fixed inset-x-0 bottom-0 z-40 flex items-center justify-between gap-3 px-4 pt-3 font-mono text-sm font-bold uppercase lg:hidden",
        "pb-[calc(0.75rem+env(safe-area-inset-bottom))]",
        "transition-transform duration-150",
        result.lasts ? "bg-acid" : "bg-hot",
        panelVisible ? "translate-y-full" : "translate-y-0",
      ].join(" ")}
    >
      <span className="truncate">
        {verdictHeadline(result)} · {formatSignedEuro(result.drawdown.endBalance)}
      </span>
      <ChevronDown strokeWidth={3} className="h-5 w-5 shrink-0" />
    </button>
  );
}
