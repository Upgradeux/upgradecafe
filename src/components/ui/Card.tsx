import React from "react";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "subtle" | "bordered";
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = "default",
  className = "",
  ...props
}) => {
  const variantStyles = {
    default:
      "bg-[var(--color-surface)] border border-[var(--color-border)] shadow-[var(--shadow-card)]",
    subtle:
      "bg-[var(--color-surface)] border border-[var(--color-border-subtle)] shadow-[var(--shadow-subtle)]",
    bordered: "bg-[var(--color-surface)] border-2 border-[var(--color-border)]",
  };

  return (
    <div
      className={`rounded-[var(--radius-card)] transition-all duration-150 ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = "",
  ...props
}) => (
  <div
    className={`p-5 pb-3 border-b border-[var(--color-border-subtle)] flex items-center justify-between gap-4 ${className}`}
    {...props}
  >
    {children}
  </div>
);

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  children,
  className = "",
  ...props
}) => (
  <h3
    className={`text-base font-semibold text-[var(--color-foreground)] tracking-tight ${className}`}
    {...props}
  >
    {children}
  </h3>
);

export const CardDescription: React.FC<
  React.HTMLAttributes<HTMLParagraphElement>
> = ({ children, className = "", ...props }) => (
  <p
    className={`text-xs text-[var(--color-muted)] leading-relaxed mt-0.5 ${className}`}
    {...props}
  >
    {children}
  </p>
);

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = "",
  ...props
}) => (
  <div className={`p-5 ${className}`} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = "",
  ...props
}) => (
  <div
    className={`p-4 px-5 bg-[var(--color-border-subtle)]/40 border-t border-[var(--color-border-subtle)] rounded-b-[var(--radius-card)] flex items-center justify-between gap-3 ${className}`}
    {...props}
  >
    {children}
  </div>
);
