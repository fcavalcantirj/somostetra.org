export type WishStatus = 'pending' | 'approved' | 'fulfilled' | 'rejected'

export interface WishCategory {
  id: string
  name: string
  icon: string
  description: string | null
  is_active: boolean
  created_at: string
}

export interface Wish {
  id: string
  user_id: string
  content: string
  status: WishStatus
  category_id: string | null
  fulfilled_at: string | null
  fulfiller_user_id: string | null
  fulfiller_name: string | null
  fulfiller_email: string | null
  fulfiller_is_member: boolean | null
  fulfiller_points_awarded: number
  fulfilled_notes: string | null
  admin_notes: string | null
  approved_by: string | null
  approved_at: string | null
  created_at: string
  updated_at: string
}

export interface WishWithProfile extends Wish {
  profiles: {
    display_name: string
    username: string | null
    profile_public: boolean
  }
}

export interface WishWithCategory extends Wish {
  wish_categories: WishCategory | null
}

export interface WishFormData {
  content: string
}

// Colors for wish status styling
export const WISH_STATUS_COLORS: Record<WishStatus, string> = {
  pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
  approved: 'bg-green-500/10 text-green-400 border-green-500/30',
  fulfilled: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
  rejected: 'bg-red-500/10 text-red-400 border-red-500/30',
}

// Legacy export for backwards compatibility (admin pages)
export const WISH_STATUS_LABELS: Record<WishStatus, { label: string; color: string }> = {
  pending: { label: 'Pendente', color: WISH_STATUS_COLORS.pending },
  approved: { label: 'Aprovado', color: WISH_STATUS_COLORS.approved },
  fulfilled: { label: 'Realizado', color: WISH_STATUS_COLORS.fulfilled },
  rejected: { label: 'Rejeitado', color: WISH_STATUS_COLORS.rejected },
}
