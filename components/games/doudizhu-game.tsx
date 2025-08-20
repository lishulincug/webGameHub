"use client"

import { useEffect, useRef } from "react"

const GAME_URL = "https://rococo-cobbler-a5244d.netlify.app/"

export function DoudizhuGame() {
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      window.open(GAME_URL, "_blank", "noopener,noreferrer")
    }, 1200)
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const handleManualOpen = () => {
    window.open(GAME_URL, "_blank", "noopener,noreferrer")
  }

  return (
    <div>
      <div>正在跳转到 斗地主 游戏...</div>
      <button onClick={handleManualOpen} style={{ marginTop: 12, backgroundColor: "#1677ff", color: "#fff" }}>
        如果没有自动跳转，请点击这里
      </button>
    </div>
  )
}