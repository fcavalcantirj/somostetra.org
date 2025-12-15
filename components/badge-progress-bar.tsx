"use client"

import { useTranslations } from "next-intl"

interface Badge {
  name: string
  icon: string
  points_required: number
}

interface BadgeProgressBarProps {
  currentPoints: number
  badges: Badge[]
}

export function BadgeProgressBar({ currentPoints, badges }: BadgeProgressBarProps) {
  const t = useTranslations("badgeProgress")

  // Sort badges by points_required
  const sortedBadges = [...badges].sort((a, b) => a.points_required - b.points_required)

  // Find next badge to unlock
  const nextBadge = sortedBadges.find((b) => b.points_required > currentPoints)
  const currentBadge = [...sortedBadges].reverse().find((b) => b.points_required <= currentPoints)

  // If no next badge, user is at max level
  if (!nextBadge) {
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="font-bold text-accent">👑 {t("maxLevelTitle")}</span>
          <span className="text-sm font-bold text-accent">{currentPoints} pts</span>
        </div>
        <div className="h-3 glass rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-accent to-primary w-full animate-pulse" />
        </div>
        <p className="text-xs text-muted-foreground text-center">{t("maxLevelDescription")}</p>
      </div>
    )
  }

  // Calculate progress percentage
  const previousPoints = currentBadge?.points_required || 0
  const pointsNeeded = nextBadge.points_required - previousPoints
  const pointsEarned = currentPoints - previousPoints
  const progress = Math.min((pointsEarned / pointsNeeded) * 100, 100)
  const pointsRemaining = nextBadge.points_required - currentPoints

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="font-bold">
          {t("nextBadge", { icon: nextBadge.icon, name: nextBadge.name })}
        </span>
        <span className="text-sm text-muted-foreground">
          {currentPoints}/{nextBadge.points_required} pts
        </span>
      </div>
      <div className="h-3 glass rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-xs text-muted-foreground text-center">
        {t.rich("pointsRemaining", {
          points: pointsRemaining,
        })}
      </p>
    </div>
  )
}
