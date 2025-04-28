import { GameDetail } from "@/components/game-detail"
import { SiteHeader } from "@/components/site-header"
import { games } from "@/lib/game-data"
import { notFound } from "next/navigation"

export function generateStaticParams() {
  return games.map((game) => ({
    id: game.id.toString(),
  }))
}

export default function GameDetailPage({ params }: { params: { id: string } }) {
  const gameId = Number.parseInt(params.id)
  const game = games.find((g) => g.id === gameId)

  if (!game) {
    notFound()
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <GameDetail game={game} />
      </main>
      <footer className="w-full border-t py-6">
        <div className="container flex flex-col items-center justify-center gap-4 px-4 md:px-6 md:flex-row">
          <p className="text-sm text-muted-foreground text-center md:text-left">
            &copy; {new Date().getFullYear()} 游戏汇总平台. 保留所有权利.
          </p>
        </div>
      </footer>
    </div>
  )
}
