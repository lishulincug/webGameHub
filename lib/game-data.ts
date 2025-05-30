import type React from "react"
import { BlockEliminationGame } from "@/components/games/block-elimination-game"
import { PlaneShooterGame } from "@/components/games/plane-shooter-game"
import { JumpAdventureGame } from "@/components/games/jump-adventure-game"
import { RacingGame } from "@/components/games/racing-game"
import { TetrisGame } from "@/components/games/tetris"
import { FlappyBirdGame } from "@/components/games/flappy-bird-game"
import { SudokuGame } from "@/components/games/sudoku-game"
import { MemoryMatchGame } from "@/components/games/memory-match-game"
import { MazeGame } from "@/components/games/maze-game"
import { WordGuessGame } from "@/components/games/word-guess-game"

export interface GameType {
  id: number
  title: string
  description: string
  image: string
  category: string
  component?: React.ComponentType<any>
  previewImage?: string
}

// 游戏数据
export const games: GameType[] = [
  {
    id: 1,
    title: "方块消除",
    description: "经典的三消游戏，连接相同颜色的方块获得高分",
    image: "/placeholder.svg?height=200&width=300",
    category: "休闲",
    component: BlockEliminationGame,
    previewImage:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/block-elimination-preview-Yx9Yd9Yx9Yd9Yx9Yd9.png",
  },
  {
    id: 2,
    title: "飞机大战",
    description: "控制飞机躲避障碍物并击落敌机",
    image: "/placeholder.svg?height=200&width=300",
    category: "射击",
    component: PlaneShooterGame,
    previewImage:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/plane-shooter-preview-Yx9Yd9Yx9Yd9Yx9Yd9.png",
  },
  {
    id: 3,
    title: "跳跃冒险",
    description: "帮助角色跳跃平台，收集金币并到达终点",
    image: "/placeholder.svg?height=200&width=300",
    category: "平台",
    component: JumpAdventureGame,
    previewImage:
      "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/jump-adventure-preview-Yx9Yd9Yx9Yd9Yx9Yd9.png",
  },
  {
    id: 5,
    title: "赛车竞速",
    description: "体验刺激的赛车游戏，超越对手获得胜利",
    image: "/placeholder.svg?height=200&width=300",
    category: "竞速",
    component: RacingGame,
    previewImage: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/racing-preview-Yx9Yd9Yx9Yd9Yx9Yd9.png",
  },
  {
    id: 4,
    title: "数独挑战",
    description: "填充数字，完成经典数独游戏",
    image: "/placeholder.svg?height=200&width=300",
    category: "益智",
    component: SudokuGame,
    previewImage: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/sudoku-preview-Yx9Yd9Yx9Yd9Yx9Yd9.png",
  },
  {
    id: 6,
    title: "记忆配对",
    description: "翻转卡片，找到配对的图案",
    image: "/placeholder.svg?height=200&width=300",
    category: "益智",
    component: MemoryMatchGame,
    previewImage: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/memory-match-preview-Yx9Yd9Yx9Yd9Yx9Yd9.png",
  },
  {
    id: 7,
    title: "迷宫探险",
    description: "在复杂的迷宫中找到出路",
    image: "/placeholder.svg?height=200&width=300",
    category: "冒险",
    component: MazeGame,
    previewImage: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/maze-preview-Yx9Yd9Yx9Yd9Yx9Yd9.png",
  },
  {
    id: 8,
    title: "单词猜谜",
    description: "猜测隐藏的单词，挑战你的词汇量",
    image: "/placeholder.svg?height=200&width=300",
    category: "文字",
    component: WordGuessGame,
    previewImage: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/word-guess-preview-Yx9Yd9Yx9Yd9Yx9Yd9.png",
  },
  {
    id: 9,
    title: "俄罗斯方块",
    description: "经典的俄罗斯方块游戏，旋转和移动方块消除行",
    image: "/placeholder.svg?height=200&width=300",
    category: "益智",
    component: TetrisGame,
    previewImage: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/tetris-preview-Yx9Yd9Yx9Yd9Yx9Yd9.png",
  },
  {
    id: 10,
    title: "Flappy Bird",
    description: "控制小鸟飞行，穿过管道间的缝隙获得分数",
    image: "/placeholder.svg?height=200&width=300",
    category: "休闲",
    component: FlappyBirdGame,
    previewImage: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/flappy-bird-preview-Yx9Yd9Yx9Yd9Yx9Yd9.png",
  },
]
