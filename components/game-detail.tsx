"use client"

import type React from "react"

import { useState } from "react"
import Image from "next/image"
import { ArrowLeft, Clock, GamepadIcon as GameController, MessageSquare, Star, ThumbsUp, Users } from "lucide-react"
import Link from "next/link"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import type { GameType } from "@/lib/game-data"

// 模拟评论数据
interface Comment {
  id: number
  username: string
  avatar: string
  date: string
  content: string
  rating: number
}

const MOCK_COMMENTS: Record<number, Comment[]> = {
  1: [
    {
      id: 1,
      username: "游戏爱好者",
      avatar: "/placeholder.svg?height=40&width=40",
      date: "2023-10-15",
      content: "这个游戏非常有趣！我很喜欢消除方块的感觉，非常解压。希望能增加更多的关卡和特殊方块。",
      rating: 4,
    },
    {
      id: 2,
      username: "休闲玩家",
      avatar: "/placeholder.svg?height=40&width=40",
      date: "2023-10-10",
      content: "简单但是上瘾，很适合打发时间。操作简单，容易上手。",
      rating: 5,
    },
    {
      id: 3,
      username: "方块大师",
      avatar: "/placeholder.svg?height=40&width=40",
      date: "2023-09-28",
      content: "玩了很多类似的游戏，这个算是不错的。但是感觉难度曲线有点陡峭，希望能调整一下。",
      rating: 3,
    },
  ],
  2: [
    {
      id: 1,
      username: "飞行员",
      avatar: "/placeholder.svg?height=40&width=40",
      date: "2023-10-12",
      content: "非常经典的飞机射击游戏，操作流畅，敌人AI设计得很好。希望能增加更多的武器和道具。",
      rating: 5,
    },
    {
      id: 2,
      username: "射击游戏迷",
      avatar: "/placeholder.svg?height=40&width=40",
      date: "2023-10-05",
      content: "画面简洁，但是游戏性很强。控制灵敏，打击感不错。就是敌人种类可以再多一些。",
      rating: 4,
    },
  ],
}

// 游戏难度
const DIFFICULTY: Record<number, { level: string; stars: number }> = {
  1: { level: "简单", stars: 2 },
  2: { level: "中等", stars: 3 },
  3: { level: "困难", stars: 4 },
  4: { level: "中等", stars: 3 },
  5: { level: "困难", stars: 4 },
  6: { level: "简单", stars: 2 },
  7: { level: "困难", stars: 4 },
  8: { level: "中等", stars: 3 },
}

// 游戏说明
const GAME_INSTRUCTIONS: Record<number, string> = {
  1: "方块消除是一款经典的消除类游戏。游戏规则很简单：点击相邻的相同颜色方块来消除它们。消除的方块越多，获得的分数就越高。游戏有60秒的时间限制，在时间结束前尽可能获得高分。\n\n游戏技巧：\n- 优先寻找大片相同颜色的方块\n- 从底部开始消除，可能会触发连锁反应\n- 注意时间，合理规划消除策略",
  2: "飞机大战是一款经典的射击游戏。玩家控制一架飞机，躲避敌机并发射子弹击落它们。每击落一架敌机可以获得10分。玩家有3条生命，与敌机相撞会损失一条生命，生命耗尽游戏结束。\n\n操作方法：\n- 使用方向键或WASD移动飞机\n- 按空格键发射子弹\n\n游戏技巧：\n- 保持移动，不要停留在一个位置\n- 优先击落靠近的敌机\n- 注意屏幕边缘，避免被限制移动",
}

export function GameDetail({ game }: { game: GameType }) {
  const [newComment, setNewComment] = useState("")
  const [comments, setComments] = useState<Comment[]>(MOCK_COMMENTS[game.id] || [])
  const [userRating, setUserRating] = useState(0)
  const [activeTab, setActiveTab] = useState("play")

  const difficulty = DIFFICULTY[game.id] || { level: "中等", stars: 3 }
  const instructions = GAME_INSTRUCTIONS[game.id] || "游戏说明正在编写中..."

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || userRating === 0) return

    const newCommentObj: Comment = {
      id: comments.length + 1,
      username: "访客用户",
      avatar: "/placeholder.svg?height=40&width=40",
      date: new Date().toISOString().split("T")[0],
      content: newComment,
      rating: userRating,
    }

    setComments([newCommentObj, ...comments])
    setNewComment("")
    setUserRating(0)
  }

  // 计算平均评分
  const averageRating =
    comments.length > 0 ? comments.reduce((sum, comment) => sum + comment.rating, 0) / comments.length : 0

  // 渲染星级
  const renderStars = (count: number) => {
    return Array(5)
      .fill(0)
      .map((_, i) => (
        <Star key={i} className={`h-4 w-4 ${i < count ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`} />
      ))
  }

  // 获取游戏组件
  const GameComponent = game.component
    ? game.component
    : () => (
        <div className="flex flex-col items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <h3 className="text-xl font-bold">游戏开发中...</h3>
            <p className="text-muted-foreground">这个游戏正在开发中，敬请期待！</p>
          </div>
        </div>
      )

  return (
    <div className="container px-4 py-8 md:px-6">
      <div className="mb-6">
        <Link href="/" className="inline-flex items-center text-sm font-medium text-primary hover:underline">
          <ArrowLeft className="mr-1 h-4 w-4" />
          返回游戏列表
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="mb-6">
            <h1 className="text-3xl font-bold tracking-tight">{game.title}</h1>
            <div className="mt-2 flex items-center space-x-2">
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                {game.category}
              </span>
              <div className="flex items-center">
                <div className="flex">{renderStars(Math.round(averageRating))}</div>
                <span className="ml-1 text-sm text-muted-foreground">
                  ({averageRating.toFixed(1)}, {comments.length} 评论)
                </span>
              </div>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="play">开始游戏</TabsTrigger>
              <TabsTrigger value="info">游戏介绍</TabsTrigger>
              <TabsTrigger value="comments">评论 ({comments.length})</TabsTrigger>
            </TabsList>
            <TabsContent value="play" className="mt-4">
              <Card>
                <CardContent className="p-6">
                  <GameComponent />
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="info" className="mt-4">
              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-medium">游戏介绍</h3>
                      <p className="mt-2 text-muted-foreground">{game.description}</p>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium">游戏说明</h3>
                      <div className="mt-2 whitespace-pre-line text-muted-foreground">{instructions}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="comments" className="mt-4">
              <Card>
                <CardContent className="p-6">
                  <div className="mb-6">
                    <h3 className="text-lg font-medium">添加评论</h3>
                    <form onSubmit={handleCommentSubmit} className="mt-3 space-y-4">
                      <div>
                        <div className="mb-2 flex items-center">
                          <span className="mr-2 text-sm">评分:</span>
                          <div className="flex">
                            {Array(5)
                              .fill(0)
                              .map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-5 w-5 cursor-pointer ${
                                    i < userRating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                                  }`}
                                  onClick={() => setUserRating(i + 1)}
                                />
                              ))}
                          </div>
                        </div>
                        <Textarea
                          placeholder="分享您对这个游戏的看法..."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          className="min-h-[100px]"
                        />
                      </div>
                      <Button type="submit" disabled={!newComment.trim() || userRating === 0}>
                        提交评论
                      </Button>
                    </form>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">用户评论 ({comments.length})</h3>
                    {comments.length > 0 ? (
                      <div className="space-y-4">
                        {comments.map((comment) => (
                          <div key={comment.id} className="rounded-lg border p-4">
                            <div className="flex items-start justify-between">
                              <div className="flex items-center">
                                <Avatar className="h-8 w-8">
                                  <AvatarImage src={comment.avatar || "/placeholder.svg"} alt={comment.username} />
                                  <AvatarFallback>{comment.username[0]}</AvatarFallback>
                                </Avatar>
                                <div className="ml-2">
                                  <p className="text-sm font-medium">{comment.username}</p>
                                  <div className="flex items-center">
                                    <div className="flex">{renderStars(comment.rating)}</div>
                                    <span className="ml-2 text-xs text-muted-foreground">{comment.date}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <p className="mt-2 text-sm">{comment.content}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-center text-muted-foreground">暂无评论，成为第一个评论的人吧！</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div>
          <Card>
            <CardContent className="p-6">
              <div className="aspect-video relative mb-4 overflow-hidden rounded-lg">
                <Image src={game.image || "/placeholder.svg"} alt={game.title} fill className="object-cover" />
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-medium">游戏信息</h3>
                  <div className="mt-2 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm">
                        <GameController className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>类型</span>
                      </div>
                      <span className="text-sm">{game.category}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm">
                        <Star className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>难度</span>
                      </div>
                      <div className="flex items-center">
                        <span className="mr-1 text-sm">{difficulty.level}</span>
                        <div className="flex">{renderStars(difficulty.stars)}</div>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm">
                        <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>游戏时长</span>
                      </div>
                      <span className="text-sm">3-5 分钟</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm">
                        <Users className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>游玩次数</span>
                      </div>
                      <span className="text-sm">{1000 + game.id * 234}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm">
                        <ThumbsUp className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>好评率</span>
                      </div>
                      <span className="text-sm">{85 + (game.id % 10)}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm">
                        <MessageSquare className="mr-2 h-4 w-4 text-muted-foreground" />
                        <span>评论数</span>
                      </div>
                      <span className="text-sm">{comments.length}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <Button className="w-full" onClick={() => setActiveTab("play")}>
                    立即游玩
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
