import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "ink";
type Size = "sm" | "md";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
}

const variantClasses: Record<Variant, string> = {
  primary: "bg-acid text-ink",
  secondary: "bg-surface text-ink",
  ink: "bg-ink text-paper",
};

const sizeClasses: Record<Size, string> = {
  sm: "px-3 py-1.5 text-xs",
  md: "px-4 py-2.5 text-sm",
};

export function Button({
  variant = "secondary",
  size = "md",
  className = "",
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      className={[
        "border-brut pushable uppercase-label inline-flex items-center gap-2 font-sans shadow-hard-sm",
        "disabled:bg-hatch disabled:cursor-not-allowed disabled:text-ink disabled:shadow-hard-none",
        variantClasses[variant],
        sizeClasses[size],
        className,
      ].join(" ")}
      {...rest}
    >
      {children}
    </button>
  );
}
