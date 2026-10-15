import * as React from "react"
import { cn } from "../../lib/utils.js"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-10 w-full min-w-0 rounded-[10px] border border-hairline bg-transparent pl-6 pr-4 py-2 text-sm font-normal text-ink outline-none transition-colors duration-300 ease-out",
        "placeholder:text-ash",
        "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Input }
