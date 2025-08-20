"use client"

import { Button } from "@/components/ui/button"

const categories = ["全部", "休闲", "射击", "平台", "益智", "竞速", "冒险", "文字", "扑克"]

export function GameCategoryFilter({
  activeCategory = "全部",
  onCategoryChange,
}: {
  activeCategory?: string
  onCategoryChange?: (category: string) => void
}) {
  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {categories.map((category) => (
        <Button
          key={category}
          variant={activeCategory === category ? "default" : "outline"}
          size="sm"
          onClick={() => onCategoryChange?.(category)}
        >
          {category}
        </Button>
      ))}
    </div>
  )
}
