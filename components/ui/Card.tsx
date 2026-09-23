import type { HTMLAttributes } from "react";

type Shadow = "sm" | "md" | "lg";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  shadow?: Shadow;
}

const shadowClasses: Record<Shadow, string> = {
  sm: "shadow-hard-sm",
  md: "shadow-hard-md",
  lg: "shadow-hard-lg",
};

export function Card({ shadow = "md", className = "", children, ...rest }: CardProps) {
  return (
    <div
      className={["border-brut bg-surface", shadowClasses[shadow], className].join(" ")}
      {...rest}
    >
      {children}
    </div>
  );
}
