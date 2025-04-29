"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { motion } from "framer-motion"
import { Clock, RefreshCw, Trophy } from "lucide-react"

// 卡片图标
const CARD_ICONS = [
  "🐶",
  "🐱",
  "🐭",
  "🐹",
  "🐰",
  "🦊",
  "🐻",
  "🐼",
  "🐨",
  "🐯",
  "🦁",
  "🐮",
  "🐷",
  "🐸",
  "🐵",
  "🐔",
  "🐧",
  "🐦",
  "🦆",
  "🦅",
  "🦉",
  "🦇",
  "🐺",
  "🐗",
  "🐴",
  "🦄",
  "🐝",
  "🐛",
  "🦋",
  "🐌",
  "🐞",
  "🐜",
  "🦗",
  "🕷",
  "🦂",
  "🦟",
  "🦠",
  "🐢",
  "🐍",
  "🦎",
  "🦖",
  "🦕",
  "🐙",
  "🦑",
  "🦐",
  "🦞",
  "🦀",
  "🐡",
]

// 难度设置
const DIFFICULTY_SETTINGS = {
  easy: { pairs: 6, gridSize: "grid-cols-3 grid-rows-4" },
  medium: { pairs: 8, gridSize: "grid-cols-4 grid-rows-4" },
  hard: { pairs: 12, gridSize: "grid-cols-4 grid-rows-6" },
}

export function MemoryMatchGame() {
  const [cards, setCards] = useState([])
  const [flippedIndices, setFlippedIndices] = useState([])
  const [matchedPairs, setMatchedPairs] = useState([])
  const [moves, setMoves] = useState(0)
  const [timer, setTimer] = useState(0)
  const [timerInterval, setTimerInterval] = useState(null)
  const [difficulty, setDifficulty] = useState("medium")
  const [gameState, setGameState] = useState({
    isGameStarted: false,
    isGameOver: false,
  })
  const [bestScores, setBestScores] = useState({
    easy: { moves: Number.POSITIVE_INFINITY, time: Number.POSITIVE_INFINITY },
    medium: { moves: Number.POSITIVE_INFINITY, time: Number.POSITIVE_INFINITY },
    hard: { moves: Number.POSITIVE_INFINITY, time: Number.POSITIVE_INFINITY },
  })

  // 初始化游戏
  const initGame = useCallback(
    (selectedDifficulty) => {
      const { pairs } = DIFFICULTY_SETTINGS[selectedDifficulty]

      // 随机选择图标
      const shuffledIcons = [...CARD_ICONS]
      for (let i = shuffledIcons.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[shuffledIcons[i], shuffledIcons[j]] = [shuffledIcons[j], shuffledIcons[i]]
      }

      const selectedIcons = shuffledIcons.slice(0, pairs)

      // 创建卡片对
      const newCards = []
      selectedIcons.forEach((icon) => {
        newCards.push({ icon, isMatched: false })
        newCards.push({ icon, isMatched: false })
      })

      // 打乱卡片顺序
      for (let i = newCards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[newCards[i], newCards[j]] = [newCards[j], newCards[i]]
      }

      setCards(newCards)
      setFlippedIndices([])
      setMatchedPairs([])
      setMoves(0)
      setTimer(0)
      setDifficulty(selectedDifficulty)
      setGameState({
        isGameStarted: true,
        isGameOver: false,
      })

      // 启动计时器
      if (timerInterval) clearInterval(timerInterval)
      const interval = setInterval(() => {
        setTimer((prev) => prev + 1)
      }, 1000)
      setTimerInterval(interval)
    },
    [timerInterval],
  )

  // 处理卡片点击
  const handleCardClick = (index) => {
    // 如果游戏结束或卡片已匹配或已翻开，则不处理
    if (
      gameState.isGameOver ||
      matchedPairs.includes(cards[index].icon) ||
      flippedIndices.includes(index) ||
      flippedIndices.length >= 2
    ) {
      return
    }

    // 翻开卡片
    const newFlippedIndices = [...flippedIndices, index]
    setFlippedIndices(newFlippedIndices)

    // 如果翻开了两张卡片
    if (newFlippedIndices.length === 2) {
      setMoves((prev) => prev + 1)

      const [firstIndex, secondIndex] = newFlippedIndices

      // 检查是否匹配
      if (cards[firstIndex].icon === cards[secondIndex].icon) {
        setMatchedPairs((prev) => [...prev, cards[firstIndex].icon])
        setFlippedIndices([])

        // 检查游戏是否完成
        if (matchedPairs.length + 1 === DIFFICULTY_SETTINGS[difficulty].pairs) {
          handleGameComplete()
        }
      } else {
        // 不匹配，延迟翻回
        setTimeout(() => {
          setFlippedIndices([])
        }, 1000)
      }
    }
  }

  // 处理游戏完成
  const handleGameComplete = () => {
    clearInterval(timerInterval)
    setGameState({
      ...gameState,
      isGameOver: true,
    })

    // 更新最佳成绩
    const currentScore = { moves, time: timer }
    setBestScores((prev) => {
      const newBestScores = { ...prev }

      if (moves < prev[difficulty].moves || (moves === prev[difficulty].moves && timer < prev[difficulty].time)) {
        newBestScores[difficulty] = currentScore
      }

      return newBestScores
    })
  }

  // 重新开始游戏
  const restartGame = () => {
    initGame(difficulty)
  }

  // 格式化时间
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  // 组件卸载时清除计时器
  useEffect(() => {
    return () => {
      if (timerInterval) clearInterval(timerInterval)
    }
  }, [timerInterval])

  return (
    <div className="flex flex-col items-center w-full">
      <div className="flex justify-between w-full mb-4">
        <div className="text-lg font-bold flex items-center">
          <Clock className="w-5 h-5 mr-1" /> {formatTime(timer)}
        </div>
        <div className="text-lg font-bold">步数: {moves}</div>
      </div>

      <div className="relative w-full" style={{ height: "400px" }}>
        {!gameState.isGameStarted && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10">
            <h3 className="text-xl font-bold mb-4">记忆配对</h3>
            <p className="text-center mb-4">翻转卡片，找到所有匹配的对子！</p>
            <div className="flex flex-col gap-2 mb-4">
              <p className="text-center font-medium">选择难度:</p>
              <div className="flex gap-2">
                <Button onClick={() => initGame("easy")}>简单</Button>
                <Button onClick={() => initGame("medium")}>中等</Button>
                <Button onClick={() => initGame("hard")}>困难</Button>
              </div>
            </div>
          </div>
        )}

        {gameState.isGameOver && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10">
            <h3 className="text-xl font-bold mb-2">恭喜！</h3>
            <p className="text-lg mb-1">你完成了记忆配对游戏！</p>
            <p className="mb-4">
              步数: {moves} | 用时: {formatTime(timer)}
            </p>

            {moves === bestScores[difficulty].moves && timer === bestScores[difficulty].time && (
              <div className="flex items-center text-yellow-500 mb-4">
                <Trophy className="w-5 h-5 mr-1" /> 新纪录！
              </div>
            )}

            <div className="flex gap-2">
              <Button onClick={restartGame}>再玩一次</Button>
              <Button variant="outline" onClick={() => setGameState({ isGameStarted: false, isGameOver: false })}>
                更换难度
              </Button>
            </div>
          </div>
        )}

        <div className="flex justify-center items-center h-full overflow-auto">
          {gameState.isGameStarted && !gameState.isGameOver && (
            <div className={`grid gap-2 ${DIFFICULTY_SETTINGS[difficulty].gridSize}`}>
              {cards.map((card, index) => (
                <motion.div
                  key={index}
                  className={`w-16 h-16 sm:w-20 sm:h-20 rounded-md cursor-pointer flex items-center justify-center text-2xl sm:text-3xl select-none`}
                  initial={false}
                  animate={{
                    rotateY: flippedIndices.includes(index) || matchedPairs.includes(card.icon) ? 180 : 0,
                    backgroundColor: matchedPairs.includes(card.icon)
                      ? "#4ade80"
                      : flippedIndices.includes(index)
                        ? "#60a5fa"
                        : "#1e293b",
                  }}
                  transition={{ duration: 0.3 }}
                  onClick={() => handleCardClick(index)}
                >
                  <motion.div
                    className="absolute w-full h-full flex items-center justify-center"
                    initial={false}
                    animate={{
                      rotateY: flippedIndices.includes(index) || matchedPairs.includes(card.icon) ? 180 : 0,
                      opacity: flippedIndices.includes(index) || matchedPairs.includes(card.icon) ? 1 : 0,
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    {card.icon}
                  </motion.div>
                  <motion.div
                    className="absolute w-full h-full flex items-center justify-center text-white"
                    initial={false}
                    animate={{
                      rotateY: flippedIndices.includes(index) || matchedPairs.includes(card.icon) ? 0 : 180,
                      opacity: flippedIndices.includes(index) || matchedPairs.includes(card.icon) ? 0 : 1,
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    ?
                  </motion.div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {gameState.isGameStarted && !gameState.isGameOver && (
        <div className="mt-4 flex justify-center">
          <Button variant="outline" onClick={restartGame}>
            <RefreshCw className="w-4 h-4 mr-1" /> 重新开始
          </Button>
        </div>
      )}

      <div className="mt-4 text-sm text-muted-foreground">
        <p>游戏说明: 翻转卡片，找到所有匹配的对子。记住卡片的位置，用最少的步数完成游戏！</p>
      </div>
    </div>
  )
}
