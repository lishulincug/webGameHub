"use client"

import { useEffect, useRef } from "react"

export function AnimatedBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // 设置画布大小
    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resizeCanvas()
    window.addEventListener("resize", resizeCanvas)

    // 粒子系统
    const particles: Array<{
      x: number
      y: number
      vx: number
      vy: number
      size: number
      color: string
      opacity: number
      type: "circle" | "triangle" | "square" | "gamepad"
    }> = []

    // 游戏相关的图标路径
    const gameIcons = [
      { type: "gamepad" as const, color: "#3B82F6" },
      { type: "circle" as const, color: "#10B981" },
      { type: "triangle" as const, color: "#F59E0B" },
      { type: "square" as const, color: "#EF4444" },
    ]

    // 初始化粒子
    const initParticles = () => {
      particles.length = 0
      for (let i = 0; i < 50; i++) {
        const icon = gameIcons[Math.floor(Math.random() * gameIcons.length)]
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          size: Math.random() * 20 + 10,
          color: icon.color,
          opacity: Math.random() * 0.3 + 0.1,
          type: icon.type,
        })
      }
    }

    // 绘制游戏手柄图标
    const drawGamepad = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number) => {
      ctx.beginPath()
      // 主体
      ctx.roundRect(x - size / 2, y - size / 3, size, size * 0.6, size * 0.1)
      // 左摇杆
      ctx.arc(x - size * 0.25, y, size * 0.1, 0, Math.PI * 2)
      // 右摇杆
      ctx.arc(x + size * 0.25, y, size * 0.1, 0, Math.PI * 2)
      // 十字键
      ctx.rect(x - size * 0.35, y - size * 0.05, size * 0.1, size * 0.1)
      ctx.rect(x - size * 0.4, y - size * 0.1, size * 0.2, size * 0.05)
      // 按钮
      ctx.arc(x + size * 0.3, y - size * 0.1, size * 0.03, 0, Math.PI * 2)
      ctx.arc(x + size * 0.35, y, size * 0.03, 0, Math.PI * 2)
      ctx.arc(x + size * 0.3, y + size * 0.1, size * 0.03, 0, Math.PI * 2)
      ctx.arc(x + size * 0.25, y, size * 0.03, 0, Math.PI * 2)
    }

    // 绘制粒子
    const drawParticle = (particle: (typeof particles)[0]) => {
      ctx.save()
      ctx.globalAlpha = particle.opacity
      ctx.fillStyle = particle.color
      ctx.strokeStyle = particle.color

      switch (particle.type) {
        case "circle":
          ctx.beginPath()
          ctx.arc(particle.x, particle.y, particle.size / 2, 0, Math.PI * 2)
          ctx.fill()
          break
        case "triangle":
          ctx.beginPath()
          ctx.moveTo(particle.x, particle.y - particle.size / 2)
          ctx.lineTo(particle.x - particle.size / 2, particle.y + particle.size / 2)
          ctx.lineTo(particle.x + particle.size / 2, particle.y + particle.size / 2)
          ctx.closePath()
          ctx.fill()
          break
        case "square":
          ctx.fillRect(particle.x - particle.size / 2, particle.y - particle.size / 2, particle.size, particle.size)
          break
        case "gamepad":
          drawGamepad(ctx, particle.x, particle.y, particle.size)
          ctx.fill()
          break
      }
      ctx.restore()
    }

    // 动画循环
    let animationId: number
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // 绘制渐变背景
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height)
      gradient.addColorStop(0, "rgba(59, 130, 246, 0.05)")
      gradient.addColorStop(0.3, "rgba(147, 51, 234, 0.05)")
      gradient.addColorStop(0.6, "rgba(236, 72, 153, 0.05)")
      gradient.addColorStop(1, "rgba(16, 185, 129, 0.05)")
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // 更新和绘制粒子
      particles.forEach((particle) => {
        // 更新位置
        particle.x += particle.vx
        particle.y += particle.vy

        // 边界检查
        if (particle.x < -particle.size) particle.x = canvas.width + particle.size
        if (particle.x > canvas.width + particle.size) particle.x = -particle.size
        if (particle.y < -particle.size) particle.y = canvas.height + particle.size
        if (particle.y > canvas.height + particle.size) particle.y = -particle.size

        // 透明度动画
        particle.opacity += (Math.random() - 0.5) * 0.01
        particle.opacity = Math.max(0.05, Math.min(0.4, particle.opacity))

        drawParticle(particle)
      })

      // 绘制连接线
      ctx.strokeStyle = "rgba(59, 130, 246, 0.1)"
      ctx.lineWidth = 1
      particles.forEach((particle, i) => {
        particles.slice(i + 1).forEach((otherParticle) => {
          const dx = particle.x - otherParticle.x
          const dy = particle.y - otherParticle.y
          const distance = Math.sqrt(dx * dx + dy * dy)

          if (distance < 150) {
            ctx.beginPath()
            ctx.moveTo(particle.x, particle.y)
            ctx.lineTo(otherParticle.x, otherParticle.y)
            ctx.globalAlpha = ((150 - distance) / 150) * 0.2
            ctx.stroke()
            ctx.globalAlpha = 1
          }
        })
      })

      animationId = requestAnimationFrame(animate)
    }

    initParticles()
    animate()

    return () => {
      window.removeEventListener("resize", resizeCanvas)
      if (animationId) {
        cancelAnimationFrame(animationId)
      }
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
      style={{ background: "linear-gradient(135deg, #667eea 0%, #764ba200 100%)" }}
    />
  )
}
