import * as React from "react"
import { cn } from "../../lib/utils.js"

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-20 w-full rounded-[10px] border border-hairline bg-transparent pl-6 pr-4 py-2.5 text-sm font-normal text-ink outline-none transition-colors duration-300 ease-out",
        "placeholder:text-ash",
        "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  )
}

export { Textarea }
