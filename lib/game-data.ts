import type React from "react"
import { BlockEliminationGame } from "@/components/games/block-elimination-game"
import { PlaneShooterGame } from "@/components/games/plane-shooter-game"
import { JumpAdventureGame } from "@/components/games/jump-adventure-game"
import { RacingGame } from "@/components/games/racing-game"

export interface GameType {
  id: number
  title: string
  description: string
  image: string
  category: string
  component?: React.ComponentType<any>
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
  },
  {
    id: 2,
    title: "飞机大战",
    description: "控制飞机躲避障碍物并击落敌机",
    image: "/placeholder.svg?height=200&width=300",
    category: "射击",
    component: PlaneShooterGame,
  },
  {
    id: 3,
    title: "跳跃冒险",
    description: "帮助角色跳跃平台，收集金币并到达终点",
    image: "/placeholder.svg?height=200&width=300",
    category: "平台",
    component: JumpAdventureGame,
  },
  {
    id: 5,
    title: "赛车竞速",
    description: "体验刺激的赛车游戏，超越对手获得胜利",
    image: "/placeholder.svg?height=200&width=300",
    category: "竞速",
    component: RacingGame,
  },
  {
    id: 4,
    title: "数独挑战",
    description: "填充数字，完成经典数独游戏",
    image: "/placeholder.svg?height=200&width=300",
    category: "益智",
  },
  {
    id: 6,
    title: "记忆配对",
    description: "翻转卡片，找到配对的图案",
    image: "/placeholder.svg?height=200&width=300",
    category: "益智",
  },
  {
    id: 7,
    title: "迷宫探险",
    description: "在复杂的迷宫中找到出路",
    image: "/placeholder.svg?height=200&width=300",
    category: "冒险",
  },
  {
    id: 8,
    title: "单词猜谜",
    description: "猜测隐藏的单词，挑战你的词汇量",
    image: "/placeholder.svg?height=200&width=300",
    category: "文字",
  },
]
