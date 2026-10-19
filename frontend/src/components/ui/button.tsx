import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "../../lib/utils.js"
import { Slot } from "radix-ui"

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 rounded-[10px] text-sm font-normal whitespace-nowrap transition-colors duration-300 ease-out outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-ink hover:bg-primary/90 px-5",
        destructive:
          "bg-ink text-paper hover:bg-ink/85",
        outline:
          "border border-ink bg-transparent text-ink hover:bg-bone px-3",
        secondary:
          "bg-bone text-ink hover:bg-smoke/30 ",
        ghost:
          "bg-transparent text-ink hover:bg-bone",
        link:
          "text-ink underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-5 py-2 has-[>svg]:px-3",
        xs: "h-6 gap-1 rounded-[10px] px-2 text-xs has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
        sm: "h-8 gap-1.5 rounded-[10px] px-3 has-[>svg]:px-2.5",
        lg: "h-10 rounded-[10px] px-6 has-[>svg]:px-4",
        icon: "size-9 rounded-[10px]",
        "icon-xs": "size-6 rounded-[10px] [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-8 rounded-[10px]",
        "icon-lg": "size-10 rounded-[10px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

function Button({
  className,
  variant = "default",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot.Root : "button"

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }
