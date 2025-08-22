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
import { DoudizhuGame } from "@/components/games/doudizhu-game"
import { GomokuGame } from "@/components/games/gomoku-game"
import { ChineseChessGame } from "@/components/games/chinese-chess-game"
import { GoGame } from "@/components/games/go-game"
import { ArmyChessGame } from "@/components/games/army-chess-game"
import { DroneSimulator } from "@/components/games/drone-simulator"
import { FlightSimulator } from "@/components/games/flight-simulator"
import { CarSimulator } from "@/components/games/car-simulator"

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
    previewImage: "/images/game-previews/block-elimination-preview.png",
  },
  {
    id: 2,
    title: "飞机大战",
    description: "控制飞机躲避障碍物并击落敌机",
    image: "/placeholder.svg?height=200&width=300",
    category: "射击",
    component: PlaneShooterGame,
    previewImage: "/images/game-previews/plane-shooter-preview.png",
  },
  {
    id: 3,
    title: "跳跃冒险",
    description: "帮助角色跳跃平台，收集金币并到达终点",
    image: "/placeholder.svg?height=200&width=300",
    category: "平台",
    component: JumpAdventureGame,
    previewImage: "/images/game-previews/jump-adventure-preview.png",
  },
  {
    id: 5,
    title: "赛车竞速",
    description: "体验刺激的赛车游戏，超越对手获得胜利",
    image: "/placeholder.svg?height=200&width=300",
    category: "竞速",
    component: RacingGame,
    previewImage: "/images/game-previews/racing-preview.png",
  },
  {
    id: 4,
    title: "数独挑战",
    description: "填充数字，完成经典数独游戏",
    image: "/placeholder.svg?height=200&width=300",
    category: "益智",
    component: SudokuGame,
    previewImage: "/images/game-previews/sudoku-preview.png",
  },
  {
    id: 6,
    title: "记忆配对",
    description: "翻转卡片，找到配对的图案",
    image: "/placeholder.svg?height=200&width=300",
    category: "益智",
    component: MemoryMatchGame,
    previewImage: "/images/game-previews/memory-match-preview.png",
  },
  {
    id: 7,
    title: "迷宫探险",
    description: "在复杂的迷宫中找到出路",
    image: "/placeholder.svg?height=200&width=300",
    category: "冒险",
    component: MazeGame,
    previewImage: "/images/game-previews/maze-preview.png",
  },
  {
    id: 8,
    title: "单词猜谜",
    description: "猜测隐藏的单词，挑战你的词汇量",
    image: "/placeholder.svg?height=200&width=300",
    category: "文字",
    component: WordGuessGame,
    previewImage: "/images/game-previews/word-guess-preview.png",
  },
  {
    id: 9,
    title: "俄罗斯方块",
    description: "经典的俄罗斯方块游戏，旋转和移动方块消除行",
    image: "/placeholder.svg?height=200&width=300",
    category: "益智",
    component: TetrisGame,
    previewImage: "/images/game-previews/tetris-preview.png",
  },
  {
    id: 10,
    title: "Flappy Bird",
    description: "控制小鸟飞行，穿过管道间的缝隙获得分数",
    image: "/placeholder.svg?height=200&width=300",
    category: "休闲",
    component: FlappyBirdGame,
    previewImage: "/images/game-previews/flappy-bird-preview.png",
  },
  {
    id: 11,
    title: "五子棋",
    description: "经典五子棋游戏，先连成五子者获胜",
    image: "/placeholder.svg?height=200&width=300",
    category: "益智",
    component: GomokuGame,
    previewImage: "/images/game-previews/gomoku-preview.png",
  },
  {
    id: 12,
    title: "中国象棋",
    description: "传统中国象棋，楚河汉界智慧对决",
    image: "/placeholder.svg?height=200&width=300",
    category: "益智",
    component: ChineseChessGame,
    previewImage: "/images/game-previews/chinese-chess-preview.png",
  },
  {
    id: 13,
    title: "围棋",
    description: "古老的围棋游戏，黑白对弈围地制胜",
    image: "/placeholder.svg?height=200&width=300",
    category: "益智",
    component: GoGame,
    previewImage: "/images/game-previews/go-preview.png",
  },
  {
    id: 14,
    title: "军棋",
    description: "军棋翻棋模式，找到对方军旗获胜",
    image: "/placeholder.svg?height=200&width=300",
    category: "益智",
    component: ArmyChessGame,
    previewImage: "/images/game-previews/army-chess-preview.png",
  },
  {
    id: 15,
    title: "无人机模拟器",
    description: "3D无人机飞行模拟，体验真实的飞行操控",
    image: "/placeholder.svg?height=200&width=300",
    category: "模拟",
    component: DroneSimulator,
    previewImage: "/images/game-previews/drone-simulator-preview.png",
  },
  {
    id: 16,
    title: "飞行模拟器",
    description: "专业飞行模拟体验，驾驶飞机穿越云层",
    image: "/placeholder.svg?height=200&width=300",
    category: "模拟",
    component: FlightSimulator,
    previewImage: "/images/game-previews/flight-simulator-preview.png",
  },
  {
    id: 17,
    title: "汽车驾驶模拟器",
    description: "真实的汽车驾驶体验，挑战赛道圈速记录",
    image: "/placeholder.svg?height=200&width=300",
    category: "模拟",
    component: CarSimulator,
    previewImage: "/images/game-previews/car-simulator-preview.png",
  },
  {
    id: 18,
    title: "斗地主",
    description: "斗地主",
    image: "/placeholder.svg?height=200&width=300",
    category: "扑克",
    component: DoudizhuGame,
    previewImage: "/images/game-previews/doudizhu-preview.png",
  },
]
