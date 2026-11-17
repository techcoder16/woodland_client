import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"
import { Hint } from "@/components/ui/hint"
import { getHint } from "@/helper/hints"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {
  /** Skip the automatic explanation (when the caller already wraps the badge in its own Hint). */
  noHint?: boolean
}

function Badge({ className, variant, noHint, ...props }: BadgeProps) {
  const badge = <div className={cn(badgeVariants({ variant }), className)} {...props} />
  const text = noHint ? undefined : getHint(props.children)
  return text ? <Hint text={text}><span className="inline-flex">{badge}</span></Hint> : badge
}

export { Badge, badgeVariants }
