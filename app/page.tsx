import { GameGrid } from "@/components/game-grid"
import { SiteHeader } from "@/components/site-header"
import { AnimatedBackground } from "@/components/animated-background"

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col relative">
      <AnimatedBackground />
      <SiteHeader />
      <main className="flex-1 relative z-10">
        <section className="w-full py-12 md:py-24 lg:py-32 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-50/80 via-purple-50/80 to-pink-50/80 backdrop-blur-sm"></div>
          <div className="container px-4 md:px-6 relative z-10">
            <div className="flex flex-col items-center justify-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-5xl bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-pulse">
                  游戏汇总平台
                </h1>
                <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                  发现并畅玩各种精彩网页游戏，一键点击即可开始游戏体验
                </p>
              </div>
            </div>
          </div>
        </section>
        <section className="w-full py-12 md:py-24 lg:py-32 relative">
          <div className="absolute inset-0 bg-white/70 backdrop-blur-sm"></div>
          <div className="container px-4 md:px-6 relative z-10">
            <h2 className="text-2xl font-bold tracking-tighter sm:text-3xl mb-8 bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent">
              热门游戏
            </h2>
            <GameGrid />
          </div>
        </section>
      </main>
      <footer className="w-full border-t py-6 relative z-10 bg-white/80 backdrop-blur-sm">
        <div className="container flex flex-col items-center justify-center gap-4 px-4 md:px-6 md:flex-row">
          <p className="text-sm text-muted-foreground text-center md:text-left">
            &copy; {new Date().getFullYear()} 游戏汇总平台. 保留所有权利.
          </p>
        </div>
      </footer>
    </div>
  )
}
