"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { GameCategoryFilter } from "@/components/game-category-filter"
import { Input } from "@/components/ui/input"
import { Search, X, Play } from "lucide-react"
import { games } from "@/lib/game-data"

export function GameGrid() {
  const [selectedGame, setSelectedGame] = useState<(typeof games)[0] | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [activeCategory, setActiveCategory] = useState("全部")
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredGames, setFilteredGames] = useState(games)
  const [isHovering, setIsHovering] = useState<number | null>(null)

  useEffect(() => {
    let result = games

    // Apply category filter
    if (activeCategory !== "全部") {
      result = result.filter((game) => game.category === activeCategory)
    }

    // Apply search filter
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase().trim()
      result = result.filter(
        (game) => game.title.toLowerCase().includes(query) || game.description.toLowerCase().includes(query),
      )
    }

    setFilteredGames(result)
  }, [activeCategory, searchQuery])

  const handlePlayGame = (game: (typeof games)[0]) => {
    setSelectedGame(game)
    setIsDialogOpen(true)
  }

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category)
  }

  return (
    <>
      <div className="mb-6 space-y-4">
        <div className="relative">
          <Input
            type="text"
            placeholder="搜索游戏..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        <GameCategoryFilter activeCategory={activeCategory} onCategoryChange={handleCategoryChange} />
      </div>

      {filteredGames.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredGames.map((game) => (
            <Card
              key={game.id}
              className="overflow-hidden hover:shadow-lg transition-shadow duration-300"
              onMouseEnter={() => setIsHovering(game.id)}
              onMouseLeave={() => setIsHovering(null)}
            >
              <div className="aspect-video relative">
                <Image
                  src={game.previewImage || game.image || "/placeholder.svg"}
                  alt={game.title}
                  fill
                  className="object-cover"
                />
                {isHovering === game.id && game.component && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <Button
                      variant="default"
                      size="icon"
                      className="rounded-full w-12 h-12"
                      onClick={() => handlePlayGame(game)}
                    >
                      <Play className="h-6 w-6" />
                    </Button>
                  </div>
                )}
              </div>
              <CardHeader className="p-4">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg">{game.title}</CardTitle>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">{game.category}</span>
                </div>
                <CardDescription className="line-clamp-2 h-10">{game.description}</CardDescription>
              </CardHeader>
              <CardFooter className="p-4 pt-0 flex gap-2">
                <Button className="flex-1" onClick={() => handlePlayGame(game)}>
                  快速游玩
                </Button>
                <Link href={`/games/${game.id}`} className="flex-1">
                  <Button variant="outline" className="w-full">
                    详情
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold mb-2">没有找到相关游戏</h3>
          <p className="text-muted-foreground">
            {searchQuery ? `没有找到与"${searchQuery}"相关的游戏` : "请尝试选择其他分类"}
          </p>
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        {selectedGame && (
          <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-auto">
            <DialogHeader>
              <DialogTitle>{selectedGame.title}</DialogTitle>
              <DialogDescription>{selectedGame.description}</DialogDescription>
            </DialogHeader>
            <div className="p-4 bg-muted rounded-lg">
              {selectedGame.component ? (
                <selectedGame.component />
              ) : (
                <div className="flex flex-col items-center justify-center min-h-[400px]">
                  <div className="text-center space-y-4">
                    <h3 className="text-xl font-bold">游戏开发中...</h3>
                    <p className="text-muted-foreground">这个游戏正在开发中，敬请期待！</p>
                    <Button onClick={() => setIsDialogOpen(false)}>关闭</Button>
                  </div>
                </div>
              )}
            </div>
            <div className="mt-4 flex justify-end">
              <Link href={`/games/${selectedGame.id}`}>
                <Button variant="outline">查看详情页</Button>
              </Link>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </>
  )
}
