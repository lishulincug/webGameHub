import Link from "next/link"
import { Gamepad2, Search } from "lucide-react"
import { Button } from "@/components/ui/button"

export function SiteHeader() {
  return (
    <header className="w-full border-b bg-background">
      <div className="container flex h-16 items-center px-4 md:px-6">
        <Link href="/" className="flex items-center gap-2">
          <Gamepad2 className="h-6 w-6" />
          <span className="text-lg font-bold">游戏汇总</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link href="#" className="text-sm font-medium hover:underline underline-offset-4">
            首页
          </Link>
          <Link href="#" className="text-sm font-medium hover:underline underline-offset-4">
            分类
          </Link>
          <Link href="#" className="text-sm font-medium hover:underline underline-offset-4">
            排行榜
          </Link>
          <Link href="#" className="text-sm font-medium hover:underline underline-offset-4">
            新游戏
          </Link>
        </nav>
        <div className="hidden md:flex ml-4">
          <Button variant="ghost" size="icon">
            <Search className="h-5 w-5" />
            <span className="sr-only">搜索</span>
          </Button>
        </div>
        <div className="absolute right-5 top-5 z-10">
          <a 
            href="https://codeprogramcug.github.io/autoSignIn/" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            <Button className="flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-white">
              <span>游戏中心</span>
            </Button>
          </a>
        </div>
      </div>
    </header>
  )
}
