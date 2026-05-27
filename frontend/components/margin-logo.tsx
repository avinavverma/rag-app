import Link from "next/link";

interface MarginLogoProps {
  size?: "sm" | "md" | "lg";
  href?: string;
}

const sizeStyles = {
  sm: {
    mark: "h-[1em]",
    text: "text-lg font-semibold tracking-tight text-foreground",
  },

  md: {
    mark: "h-[1.1em]",
    text: "text-xl font-semibold tracking-tight text-foreground",
  },

  lg: {
    mark: "h-[1.15em]",
    text: "text-2xl font-semibold tracking-tight text-foreground",
  },
};

export function MarginLogo({
  size = "md",
  href,
}: MarginLogoProps) {
  const styles =
    sizeStyles[size];

  const content = (
    <>
      <span
        aria-hidden="true"
        className={[
          "w-[3px]",
          "rounded-sm",
          "bg-accent",
          "shrink-0",
          styles.mark,
        ].join(" ")}
      />

      <span className={styles.text}>
        Margin
      </span>
    </>
  );

  const sharedClassName =
    "inline-flex items-center gap-2 select-none";

  if (href) {
    return (
      <Link
        href={href}
        aria-label="Margin home"
        className={
          sharedClassName
        }
      >
        {content}
      </Link>
    );
  }

  return (
    <span
      className={
        sharedClassName
      }
    >
      {content}
    </span>
  );
}
