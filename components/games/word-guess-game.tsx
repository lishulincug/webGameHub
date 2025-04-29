"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw, Heart } from "lucide-react"

// 单词库
const WORD_LISTS = {
  easy: [
    "苹果",
    "香蕉",
    "橙子",
    "西瓜",
    "草莓",
    "猫咪",
    "狗狗",
    "老鼠",
    "兔子",
    "熊猫",
    "书本",
    "铅笔",
    "桌子",
    "椅子",
    "电脑",
    "学校",
    "医院",
    "公园",
    "商店",
    "家庭",
  ],
  medium: [
    "电影院",
    "图书馆",
    "博物馆",
    "游乐园",
    "动物园",
    "篮球场",
    "足球场",
    "游泳池",
    "健身房",
    "网球场",
    "电视机",
    "冰箱",
    "洗衣机",
    "微波炉",
    "空调器",
    "手机",
    "相机",
    "耳机",
    "键盘",
    "鼠标",
  ],
  hard: [
    "人工智能",
    "虚拟现实",
    "区块链技术",
    "量子计算",
    "机器学习",
    "生物工程",
    "纳米技术",
    "可再生能源",
    "太空探索",
    "基因编辑",
    "全球变暖",
    "生物多样性",
    "可持续发展",
    "环境保护",
    "气候变化",
    "文化遗产",
    "历史古迹",
    "艺术展览",
    "音乐会",
    "戏剧表演",
  ],
}

// 提示库
const HINT_LISTS = {
  easy: {
    苹果: "一种红色或绿色的水果，常见的水果之一",
    香蕉: "黄色的弯曲水果，猴子喜欢吃",
    橙子: "橙色的圆形水果，富含维生素C",
    西瓜: "夏天常吃的大型水果，里面是红色的",
    草莓: "红色的小型水果，表面有小籽",
    猫咪: "常见的宠物，会喵喵叫",
    狗狗: "人类的好朋友，会汪汪叫",
    老鼠: "小型啮齿动物，喜欢吃奶酪",
    兔子: "有长耳朵的动物，喜欢吃胡萝卜",
    熊猫: "中国特有的黑白色动物",
    书本: "用来阅读和学习的物品",
    铅笔: "用来写字和画画的工具",
    桌子: "放东西的家具",
    椅子: "用来坐的家具",
    电脑: "处理信息的电子设备",
    学校: "学生学习的地方",
    医院: "治疗疾病的地方",
    公园: "休闲娱乐的户外场所",
    商店: "购买物品的地方",
    家庭: "人们生活的基本单位",
  },
  medium: {
    电影院: "观看电影的场所",
    图书馆: "借阅和阅读书籍的地方",
    博物馆: "展示历史文物和艺术品的地方",
    游乐园: "有各种游乐设施的娱乐场所",
    动物园: "展示各种动物的场所",
    篮球场: "打篮球的场地",
    足球场: "踢足球的场地",
    游泳池: "游泳的场所",
    健身房: "锻炼身体的地方",
    网球场: "打网球的场地",
    电视机: "观看节目的电器",
    冰箱: "保存食物的电器",
    洗衣机: "清洗衣物的电器",
    微波炉: "快速加热食物的电器",
    空调器: "调节室内温度的电器",
    手机: "便携式通讯设备",
    相机: "拍照的设备",
    耳机: "听音乐的设备",
    键盘: "电脑输入设备",
    鼠标: "电脑指针控制设备",
  },
  hard: {
    人工智能: "模拟人类智能的计算机系统",
    虚拟现实: "创造一个虚拟的三维环境的技术",
    区块链技术: "一种分布式数据存储技术",
    量子计算: "利用量子力学原理进行计算的技术",
    机器学习: "让计算机从数据中学习的技术",
    生物工程: "应用工程原理于生物系统的学科",
    纳米技术: "在纳米尺度上操作物质的技术",
    可再生能源: "可以持续再生的能源",
    太空探索: "探索宇宙空间的活动",
    基因编辑: "修改生物体基因的技术",
    全球变暖: "地球平均温度上升的现象",
    生物多样性: "生物种类的丰富程度",
    可持续发展: "既满足当代人需求又不损害后代人发展能力的发展模式",
    环境保护: "保护自然环境的活动",
    气候变化: "气候系统的长期变化",
    文化遗产: "具有历史文化价值的遗产",
    历史古迹: "具有历史意义的建筑或遗址",
    艺术展览: "展示艺术作品的活动",
    音乐会: "现场演奏音乐的活动",
    戏剧表演: "在舞台上表演戏剧的活动",
  },
}

export function WordGuessGame() {
  const [word, setWord] = useState("")
  const [hint, setHint] = useState("")
  const [guessedLetters, setGuessedLetters] = useState(new Set())
  const [wrongGuesses, setWrongGuesses] = useState(0)
  const [gameState, setGameState] = useState({
    isGameStarted: false,
    isGameOver: false,
    isGameWon: false,
  })
  const [difficulty, setDifficulty] = useState("easy")
  const [showHint, setShowHint] = useState(false)

  const MAX_WRONG_GUESSES = 6

  // 初始化游戏
  const initGame = useCallback((selectedDifficulty) => {
    const wordList = WORD_LISTS[selectedDifficulty]
    const randomIndex = Math.floor(Math.random() * wordList.length)
    const selectedWord = wordList[randomIndex]
    const wordHint = HINT_LISTS[selectedDifficulty][selectedWord]

    setWord(selectedWord)
    setHint(wordHint)
    setGuessedLetters(new Set())
    setWrongGuesses(0)
    setGameState({
      isGameStarted: true,
      isGameOver: false,
      isGameWon: false,
    })
    setDifficulty(selectedDifficulty)
    setShowHint(false)
  }, [])

  // 处理字母猜测
  const handleLetterGuess = (letter) => {
    if (gameState.isGameOver || guessedLetters.has(letter)) return

    const newGuessedLetters = new Set(guessedLetters)
    newGuessedLetters.add(letter)
    setGuessedLetters(newGuessedLetters)

    // 检查猜测是否正确
    if (!word.includes(letter)) {
      const newWrongGuesses = wrongGuesses + 1
      setWrongGuesses(newWrongGuesses)

      // 检查游戏是否结束
      if (newWrongGuesses >= MAX_WRONG_GUESSES) {
        setGameState({
          ...gameState,
          isGameOver: true,
          isGameWon: false,
        })
      }
    } else {
      // 检查是否猜对了所有字母
      const isWordGuessed = [...word].every((char) => newGuessedLetters.has(char))
      if (isWordGuessed) {
        setGameState({
          ...gameState,
          isGameOver: true,
          isGameWon: true,
        })
      }
    }
  }

  // 重新开始游戏
  const restartGame = () => {
    initGame(difficulty)
  }

  // 显示提示
  const toggleHint = () => {
    setShowHint(!showHint)
  }

  // 渲染单词显示
  const renderWord = () => {
    return [...word].map((letter, index) => (
      <div key={index} className="w-8 h-10 border-b-2 border-gray-400 flex items-center justify-center mx-1">
        <span className="text-xl font-bold">{guessedLetters.has(letter) || gameState.isGameOver ? letter : ""}</span>
      </div>
    ))
  }

  // 渲染可选字母
  const renderLetters = () => {
    // 创建中文常用字符数组
    const commonChars = [
      "一",
      "二",
      "三",
      "四",
      "五",
      "六",
      "七",
      "八",
      "九",
      "十",
      "人",
      "口",
      "日",
      "月",
      "水",
      "火",
      "木",
      "金",
      "土",
      "山",
      "田",
      "白",
      "石",
      "目",
      "米",
      "车",
      "马",
      "牛",
      "羊",
      "鸟",
      "鱼",
      "虫",
      "龙",
      "门",
      "雨",
      "云",
      "风",
      "花",
      "草",
      "虎",
      "狗",
      "猫",
      "鼠",
      "牙",
      "齿",
      "心",
      "手",
      "足",
      "耳",
      "目",
      "口",
      "鼻",
      "头",
      "发",
      "衣",
      "食",
      "住",
      "行",
      "坐",
      "立",
      "言",
      "语",
      "文",
      "字",
      "书",
      "画",
      "歌",
      "舞",
      "思",
      "想",
    ]

    // 过滤出当前单词中包含的字符和一些额外字符
    const wordChars = [...new Set([...word])]
    const extraChars = commonChars.filter((char) => !wordChars.includes(char))

    // 根据难度选择额外字符数量
    const extraCharCount = {
      easy: 10,
      medium: 15,
      hard: 20,
    }[difficulty]

    // 随机选择额外字符
    const selectedExtraChars = extraChars.sort(() => 0.5 - Math.random()).slice(0, extraCharCount)

    // 合并单词字符和额外字符，并打乱顺序
    const allChars = [...wordChars, ...selectedExtraChars].sort(() => 0.5 - Math.random())

    return allChars.map((char, index) => (
      <Button
        key={index}
        variant={guessedLetters.has(char) ? "secondary" : "outline"}
        className="w-8 h-8 p-0 text-sm"
        disabled={guessedLetters.has(char) || gameState.isGameOver}
        onClick={() => handleLetterGuess(char)}
      >
        {char}
      </Button>
    ))
  }

  // 渲染小人
  const renderHangman = () => {
    return (
      <div className="w-32 h-32 relative border-b-2 border-gray-400">
        {/* 绞刑架 */}
        <div className="absolute top-0 left-4 w-1 h-32 bg-gray-800"></div>
        <div className="absolute top-0 left-4 w-16 h-1 bg-gray-800"></div>
        <div className="absolute top-0 right-12 w-1 h-6 bg-gray-800"></div>

        {/* 头 */}
        {wrongGuesses >= 1 && (
          <div className="absolute top-6 right-12 w-6 h-6 rounded-full border-2 border-gray-800"></div>
        )}

        {/* 身体 */}
        {wrongGuesses >= 2 && <div className="absolute top-12 right-12 w-1 h-10 bg-gray-800"></div>}

        {/* 左臂 */}
        {wrongGuesses >= 3 && (
          <div className="absolute top-14 right-12 w-6 h-1 bg-gray-800 origin-left transform -rotate-45"></div>
        )}

        {/* 右臂 */}
        {wrongGuesses >= 4 && (
          <div className="absolute top-14 right-12 w-6 h-1 bg-gray-800 origin-right transform rotate-45"></div>
        )}

        {/* 左腿 */}
        {wrongGuesses >= 5 && (
          <div className="absolute top-22 right-12 w-6 h-1 bg-gray-800 origin-left transform -rotate-45"></div>
        )}

        {/* 右腿 */}
        {wrongGuesses >= 6 && (
          <div className="absolute top-22 right-12 w-6 h-1 bg-gray-800 origin-right transform rotate-45"></div>
        )}
      </div>
    )
  }

  // 渲染生命值
  const renderLives = () => {
    return Array(MAX_WRONG_GUESSES - wrongGuesses)
      .fill(0)
      .map((_, index) => <Heart key={index} className="w-5 h-5 text-red-500 fill-red-500" />)
  }

  return (
    <div className="flex flex-col items-center w-full">
      <div className="flex justify-between w-full mb-4">
        <div className="text-lg font-bold">
          剩余生命: <span className="flex inline-flex">{renderLives()}</span>
        </div>
        <div className="text-lg font-bold">
          难度: {difficulty === "easy" ? "简单" : difficulty === "medium" ? "中等" : "困难"}
        </div>
      </div>

      <div className="relative w-full" style={{ height: "400px" }}>
        {!gameState.isGameStarted && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 z-10">
            <h3 className="text-xl font-bold mb-4">单词猜谜</h3>
            <p className="text-center mb-4">猜测隐藏的单词，每次错误猜测会失去一条生命！</p>
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
            <h3 className="text-xl font-bold mb-2">{gameState.isGameWon ? "恭喜！" : "游戏结束"}</h3>
            <p className="text-lg mb-4">{gameState.isGameWon ? "你成功猜出了单词！" : `正确的单词是: ${word}`}</p>
            <div className="flex gap-2">
              <Button onClick={restartGame}>再玩一次</Button>
              <Button variant="outline" onClick={() => setGameState({ isGameStarted: false, isGameOver: false })}>
                更换难度
              </Button>
            </div>
          </div>
        )}

        {gameState.isGameStarted && !gameState.isGameOver && (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="flex items-center justify-center mb-8">
              {renderHangman()}
              <div className="ml-4">
                <Button variant="outline" size="sm" onClick={toggleHint}>
                  {showHint ? "隐藏提示" : "显示提示"}
                </Button>
                {showHint && (
                  <div className="mt-2 p-2 bg-gray-100 rounded-md max-w-xs">
                    <p className="text-sm">{hint}</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap justify-center mb-8">{renderWord()}</div>

            <div className="grid grid-cols-10 gap-2">{renderLetters()}</div>
          </div>
        )}
      </div>

      {gameState.isGameStarted && !gameState.isGameOver && (
        <div className="mt-4 flex justify-center">
          <Button variant="outline" onClick={restartGame}>
            <RefreshCw className="w-4 h-4 mr-1" /> 重新开始
          </Button>
        </div>
      )}

      <div className="mt-4 text-sm text-muted-foreground">
        <p>游戏说明: 猜测隐藏的单词，每次错误猜测会失去一条生命。可以使用提示按钮获取帮助。</p>
      </div>
    </div>
  )
}
