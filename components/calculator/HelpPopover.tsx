"use client";

import * as Popover from "@radix-ui/react-popover";
import { X } from "lucide-react";
import type { ReactNode } from "react";

interface HelpPopoverProps {
  /** Accessible name for the trigger, e.g. "Explain monthly gap". */
  label: string;
  children: ReactNode;
  className?: string;
}

export function HelpPopover({ label, children, className = "" }: HelpPopoverProps) {
  return (
    <Popover.Root>
      <Popover.Trigger asChild>
        <button
          type="button"
          aria-label={label}
          className={[
            "border-brut pushable inline-flex h-6 w-6 shrink-0 items-center justify-center bg-sun font-mono text-sm leading-none shadow-hard-xs",
            className,
          ].join(" ")}
        >
          ?
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side="top"
          align="start"
          sideOffset={12}
          collisionPadding={16}
          className="border-brut z-50 w-[min(320px,calc(100vw-2rem))] bg-surface p-4 font-sans text-base font-medium leading-snug shadow-hard-md outline-none"
        >
          <div className="flex items-start gap-3">
            <p className="flex-1">{children}</p>
            <Popover.Close
              aria-label="Close explanation"
              className="border-brut pushable -mr-1 -mt-1 inline-flex h-7 w-7 shrink-0 items-center justify-center bg-surface shadow-hard-xs"
            >
              <X strokeWidth={3} className="h-4 w-4" />
            </Popover.Close>
          </div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
