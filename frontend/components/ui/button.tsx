import { Button as ButtonPrimitive } from "@base-ui/react/button";
import {
  cva,
  type VariantProps,
} from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center",
    "shrink-0 whitespace-nowrap",
    "rounded-2xl",
    "text-sm font-medium",
    "transition-colors duration-150",
    "outline-none",
    "select-none",
    "disabled:pointer-events-none disabled:opacity-50",
    "focus-visible:ring-1",
    "focus-visible:ring-ring",
    "[&_svg]:pointer-events-none",
    "[&_svg]:shrink-0",
    "[&_svg:not([class*='size-'])]:size-4",
  ].join(" "),
  {
    variants: {
      variant: {
        default: [
          "bg-primary",
          "text-primary-foreground",
          "hover:bg-[var(--accent-hover)]",
        ].join(" "),

        outline: [
          "border border-border",
          "bg-background",
          "text-foreground",
          "hover:bg-muted",
        ].join(" "),

        secondary: [
          "bg-secondary",
          "text-secondary-foreground",
          "hover:bg-secondary/80",
        ].join(" "),

        ghost: [
          "text-muted-foreground",
          "hover:bg-muted",
          "hover:text-foreground",
        ].join(" "),

        destructive: [
          "bg-destructive",
          "text-white",
          "hover:bg-destructive/90",
        ].join(" "),

        link: [
          "text-foreground",
          "underline-offset-4",
          "hover:underline",
        ].join(" "),
      },

      size: {
        default: "h-10 px-4",

        sm: "h-9 px-3 text-sm",

        lg: "h-11 px-5 text-base",

        icon: "size-10",

        "icon-sm": "size-9",

        "icon-lg": "size-11",
      },
    },

    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({
  className,
  variant,
  size,
  ...props
}: ButtonPrimitive.Props &
  VariantProps<
    typeof buttonVariants
  >) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(
        buttonVariants({
          variant,
          size,
          className,
        })
      )}
      {...props}
    />
  );
}

export {
  Button,
  buttonVariants,
};
