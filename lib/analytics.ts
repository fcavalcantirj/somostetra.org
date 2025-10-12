// Google Analytics event tracking utility

declare global {
  interface Window {
    gtag: (command: string, ...args: any[]) => void
  }
}

export const GA_TRACKING_ID = "G-7ZTKBPSL4B"

// Track page views
export const pageview = (url: string) => {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("config", GA_TRACKING_ID, {
      page_path: url,
    })
  }
}

// Track custom events
export const event = ({
  action,
  category,
  label,
  value,
}: {
  action: string
  category: string
  label?: string
  value?: number
}) => {
  if (typeof window !== "undefined" && window.gtag) {
    window.gtag("event", action, {
      event_category: category,
      event_label: label,
      value: value,
    })
  }
}

// Predefined event tracking functions
export const trackSignup = (userType: "member" | "supporter", referralCode?: string) => {
  event({
    action: "signup",
    category: "User",
    label: userType,
    value: referralCode ? 1 : 0,
  })
}

export const trackLogin = () => {
  event({
    action: "login",
    category: "User",
  })
}

export const trackEmailConfirmation = (userType: "member" | "supporter") => {
  event({
    action: "email_confirmation",
    category: "User",
    label: userType,
  })
}

export const trackVoteSubmission = (voteId: string, voteTitle: string) => {
  event({
    action: "vote_submitted",
    category: "Engagement",
    label: voteTitle,
  })
}

export const trackVoteCreated = (voteId: string, voteTitle: string, category: string) => {
  event({
    action: "vote_created",
    category: "Admin",
    label: `${category}: ${voteTitle}`,
  })
}

export const trackReferralClick = (type: "member" | "supporter") => {
  event({
    action: "referral_link_clicked",
    category: "Referral",
    label: type,
  })
}

export const trackReferralLinkCopied = (type: "member" | "supporter") => {
  event({
    action: "referral_link_copied",
    category: "Referral",
    label: type,
  })
}

export const trackBadgeEarned = (badgeName: string, points: number) => {
  event({
    action: "badge_earned",
    category: "Achievement",
    label: badgeName,
    value: points,
  })
}

export const trackShareClick = (platform: "whatsapp" | "email", type: "member" | "supporter") => {
  event({
    action: "share_clicked",
    category: "Social",
    label: `${platform}_${type}`,
  })
}

export const trackAdminAction = (action: string, target: string) => {
  event({
    action: action,
    category: "Admin",
    label: target,
  })
}

export const trackUserTypeSelection = (userType: "member" | "supporter", hasReferral: boolean) => {
  event({
    action: "user_type_selected",
    category: "Onboarding",
    label: userType,
    value: hasReferral ? 1 : 0,
  })
}

export const trackLeaderboardView = (source: "homepage" | "navigation" | "direct") => {
  event({
    action: "leaderboard_viewed",
    category: "Engagement",
    label: source,
  })
}

export const trackHowItWorksInteraction = (action: "view" | "cta_click") => {
  event({
    action: action === "view" ? "how_it_works_viewed" : "how_it_works_cta_clicked",
    category: "Engagement",
    label: "Como Funciona Section",
  })
}

export const trackPasswordReset = (email: string) => {
  event({
    action: "password_reset_requested",
    category: "Auth",
    label: email,
  })
}

export const trackEvent = event
