import { createServiceRoleClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { FixUsersClient } from "./fix-users-client"

async function getBrokenUsers() {
  const serviceClient = createServiceRoleClient()

  const {
    data: { users },
    error: usersError,
  } = await serviceClient.auth.admin.listUsers({
    page: 1,
    perPage: 1000, // Fetch all users, not just first 50
  })

  if (usersError) {
    console.error("[v0] Error fetching users:", usersError)
    return []
  }

  const { data: profiles } = await serviceClient.from("profiles").select("id")
  const profileIds = new Set(profiles?.map((p) => p.id) || [])
  const brokenUsers = users.filter((user) => !profileIds.has(user.id))

  return brokenUsers.map((user) => ({
    id: user.id,
    email: user.email || "unknown",
    created_at: user.created_at,
    user_type: user.user_metadata?.user_type || "member",
    referred_by: user.user_metadata?.referred_by,
    display_name:
      user.user_metadata?.display_name || user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
  }))
}

async function fixBrokenUser(userData: {
  id: string
  email: string
  user_type: string
  referred_by?: string
  display_name: string
}) {
  "use server"

  const serviceClient = createServiceRoleClient()

  console.log(`[v0] Fixing user: ${userData.email}`)

  const { id: userId, email, user_type, referred_by, display_name } = userData
  const referredBy = referred_by || null
  const intendedType = user_type === "supporter" ? "supporter" : "member"

  console.log(`[v0] User ${email}: type=${intendedType}, referred_by=${referredBy ? "yes" : "no"}`)

  try {
    const referralCode = `${Math.random().toString(36).substring(2, 6).toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`

    console.log(`[v0] Creating profile for ${email}...`)
    const { error: profileError } = await serviceClient
      .from("profiles")
      .insert({
        id: userId,
        display_name: display_name,
        bio: intendedType === "supporter" ? "Apoiador da comunidade" : "",
        points: 10,
        referral_code: referralCode,
        referred_by: referredBy,
        user_type: intendedType,
        is_admin: false,
      })
      .select()
      .single()

    if (profileError) {
      if (profileError.code === "23505") {
        console.log(`[v0] Profile already exists for ${email}`)
        return { success: true, message: "Profile already exists" }
      }
      console.error(`[v0] Profile creation failed for ${email}:`, profileError)
      return { success: false, error: `Profile creation failed: ${profileError.message}` }
    }

    console.log(`[v0] ✓ Profile created for ${email}`)

    if (intendedType === "supporter") {
      console.log(`[v0] Creating supporter record for ${email}...`)
      const { error: supporterError } = await serviceClient
        .from("supporters")
        .insert({
          auth_user_id: userId,
          email: email,
          name: display_name,
          referred_by: referredBy,
        })
        .select()
        .single()

      if (supporterError && supporterError.code !== "23505") {
        console.error(`[v0] Supporter creation failed for ${email}:`, supporterError)
      } else {
        console.log(`[v0] ✓ Supporter record created for ${email}`)
      }
    }

    if (referredBy) {
      console.log(`[v0] Awarding points to referrer...`)
      const points = intendedType === "supporter" ? 10 : 20
      const { error: pointsError } = await serviceClient
        .from("profiles")
        .update({ points: serviceClient.raw(`points + ${points}`) })
        .eq("id", referredBy)

      if (pointsError) {
        console.error(`[v0] Points award failed for referrer:`, pointsError)
      } else {
        console.log(`[v0] ✓ Awarded ${points} points to referrer`)
      }
    }

    console.log(`[v0] ✓ Successfully fixed user ${email}`)
    return { success: true }
  } catch (error: any) {
    console.error(`[v0] Error fixing user ${userId}:`, error)
    return { success: false, error: error.message }
  }
}

async function fixAllBrokenUsers() {
  "use server"

  console.log(`[v0] Starting batch fix for all broken users`)
  const brokenUsers = await getBrokenUsers()
  console.log(`[v0] Found ${brokenUsers.length} broken users to fix`)

  const results = []

  for (const user of brokenUsers) {
    console.log(`[v0] Fixing user ${user.email}...`)
    try {
      const result = await Promise.race([
        fixBrokenUser(user),
        new Promise<{ success: false; error: string }>((_, reject) =>
          setTimeout(() => reject(new Error("Timeout after 30 seconds")), 30000),
        ),
      ])
      results.push({
        email: user.email,
        ...result,
      })
    } catch (error: any) {
      console.error(`[v0] Timeout or error fixing ${user.email}:`, error)
      results.push({
        email: user.email,
        success: false,
        error: error.message || "Timeout",
      })
    }
  }

  const successCount = results.filter((r) => r.success).length
  console.log(`[v0] Batch fix complete: ${successCount}/${results.length} successful`)

  return results
}

export default async function FixUsersPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).maybeSingle()

  if (!profile?.is_admin) {
    redirect("/dashboard")
  }

  const brokenUsers = await getBrokenUsers()

  return (
    <div className="container mx-auto p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Fix Broken User Accounts</h1>
        <p className="text-muted-foreground">
          Users who have auth accounts but no profiles (trigger failed during signup)
        </p>
      </div>

      <FixUsersClient initialUsers={brokenUsers} fixUserAction={fixBrokenUser} fixAllAction={fixAllBrokenUsers} />
    </div>
  )
}
