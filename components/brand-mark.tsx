import { Sparkles } from "lucide-react"

import { cn } from "@/lib/utils"

type BrandMarkProps = {
  className?: string
  iconClassName?: string
  textClassName?: string
}

export function BrandMark({
  className,
  iconClassName = "h-6 w-6",
  textClassName = "text-xl font-bold"
}: BrandMarkProps) {
  return (
    <span className={cn("inline-flex items-center gap-1", className)}>
      <Sparkles className={iconClassName} />
      <span className={textClassName}>ImpreCV</span>
    </span>
  )
}
