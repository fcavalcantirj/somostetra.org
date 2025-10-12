import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { Heart, Users, TrendingUp } from "lucide-react"

export default async function SupporterSignupPage({
  searchParams,
}: {
  searchParams: { ref?: string }
}) {
  const supabase = await createClient()
  const referralCode = searchParams.ref

  let referrerName = null
  if (referralCode) {
    const { data: referrer } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("referral_code", referralCode)
      .maybeSingle()

    referrerName = referrer?.display_name
  }

  async function handleSignup(formData: FormData) {
    "use server"

    const supabase = await createClient()
    const name = formData.get("name") as string
    const email = formData.get("email") as string
    const phone = formData.get("phone") as string
    const referralCode = formData.get("referralCode") as string

    // Find referrer
    let referrerId = null
    if (referralCode) {
      const { data: referrer } = await supabase
        .from("profiles")
        .select("id")
        .eq("referral_code", referralCode)
        .maybeSingle()

      referrerId = referrer?.id
    }

    // Insert supporter
    const { error } = await supabase.from("supporters").insert({
      name,
      email,
      phone,
      referred_by: referrerId,
    })

    if (error) {
      console.error("[v0] Error creating supporter:", error)
      redirect(`/auth/supporter-signup?ref=${referralCode}&error=true`)
    }

    // Award points to referrer
    if (referrerId) {
      // Add 10 points for supporter referral
      await supabase.rpc("increment_user_points", {
        user_id: referrerId,
        points_to_add: 10,
      })

      // Log activity
      await supabase.from("activities").insert({
        user_id: referrerId,
        activity_type: "supporter_referral",
        points: 10,
        description: `Convidou ${name} como apoiador`,
      })
    }

    redirect("/auth/supporter-success")
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden">
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-1/4 right-1/4 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[140px] animate-pulse" />
        <div className="absolute bottom-1/4 left-1/4 w-[600px] h-[600px] bg-accent/15 rounded-full blur-[140px] animate-pulse [animation-delay:1s]" />
      </div>

      <div className="w-full max-w-2xl">
        <div className="text-center mb-12 space-y-6">
          <Link href="/" className="inline-block text-3xl font-bold">
            SOMOS<span className="text-gradient">TETRA</span>
          </Link>

          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 glass px-6 py-3 rounded-full">
              <Heart className="w-4 h-4 text-accent" />
              <span className="text-sm font-bold uppercase tracking-wider">Seja um Apoiador</span>
            </div>

            <h1 className="text-5xl lg:text-6xl font-black tracking-tighter">
              Junte-se à <span className="text-gradient">Causa</span>
            </h1>

            {referrerName && (
              <Alert className="glass-strong border-accent/50">
                <Users className="h-4 w-4 text-accent" />
                <AlertDescription className="text-lg">
                  <span className="font-bold">{referrerName}</span> convidou você para apoiar a comunidade!
                </AlertDescription>
              </Alert>
            )}

            <p className="text-xl text-muted-foreground leading-relaxed">
              Ajude-nos a pressionar autoridades e fazer a diferença na vida de pessoas tetraplégicas
            </p>
          </div>
        </div>

        <form action={handleSignup} className="glass-strong p-10 rounded-3xl space-y-8">
          <input type="hidden" name="referralCode" value={referralCode || ""} />

          <div className="grid gap-6">
            <div className="space-y-3">
              <Label htmlFor="name" className="text-base font-bold">
                Nome completo
              </Label>
              <Input id="name" name="name" type="text" placeholder="Seu nome" required className="h-14 text-lg glass" />
            </div>

            <div className="space-y-3">
              <Label htmlFor="email" className="text-base font-bold">
                Email
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="seu@email.com"
                required
                className="h-14 text-lg glass"
              />
            </div>

            <div className="space-y-3">
              <Label htmlFor="phone" className="text-base font-bold">
                Telefone (opcional)
              </Label>
              <Input id="phone" name="phone" type="tel" placeholder="(00) 00000-0000" className="h-14 text-lg glass" />
            </div>
          </div>

          <div className="space-y-4 pt-4">
            <Button type="submit" size="lg" className="w-full gradient-primary font-bold h-14 text-lg">
              Tornar-me Apoiador
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Ao se cadastrar, você receberá atualizações sobre nossas campanhas e ações
            </p>
          </div>
        </form>

        <div className="mt-12 grid sm:grid-cols-3 gap-6">
          <div className="glass p-6 rounded-2xl text-center space-y-2">
            <Users className="w-8 h-8 mx-auto text-accent" />
            <p className="font-bold">Fortaleça</p>
            <p className="text-sm text-muted-foreground">Nossa voz coletiva</p>
          </div>
          <div className="glass p-6 rounded-2xl text-center space-y-2">
            <TrendingUp className="w-8 h-8 mx-auto text-accent" />
            <p className="font-bold">Pressione</p>
            <p className="text-sm text-muted-foreground">Autoridades</p>
          </div>
          <div className="glass p-6 rounded-2xl text-center space-y-2">
            <Heart className="w-8 h-8 mx-auto text-accent" />
            <p className="font-bold">Transforme</p>
            <p className="text-sm text-muted-foreground">Vidas</p>
          </div>
        </div>
      </div>
    </div>
  )
}
