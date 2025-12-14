"use client"

import { useState } from "react"
import { Heart, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { submitWishHelp } from "@/app/actions/wish-help"

interface HelpWishButtonProps {
  wishId: string
  memberName: string
}

export function HelpWishButton({ wishId, memberName }: HelpWishButtonProps) {
  const [open, setOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [message, setMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    const result = await submitWishHelp({
      wishId,
      name,
      email,
      phone: phone || undefined,
      message: message || undefined,
    })

    if (result.success) {
      setSuccess(true)
      // Reset form
      setName("")
      setEmail("")
      setPhone("")
      setMessage("")
    } else {
      setError(result.error || "Erro ao enviar. Tente novamente.")
    }

    setIsSubmitting(false)
  }

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen)
    if (!newOpen) {
      // Reset state when closing
      setSuccess(false)
      setError(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-pink-500/50 text-pink-400 hover:bg-pink-500/10 hover:text-pink-300"
        >
          <Heart className="h-4 w-4" />
          Quero Ajudar
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Quero Ajudar</DialogTitle>
          <DialogDescription>
            Preencha seus dados para ajudar {memberName} a realizar este desejo.
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-6 text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-emerald-600 flex items-center justify-center">
              <Heart className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-emerald-400">Obrigado!</h3>
              <p className="text-sm text-muted-foreground mt-2">
                Sua oferta de ajuda foi registrada. Entraremos em contato em breve para coordenar a doação.
              </p>
            </div>
            <Button onClick={() => setOpen(false)} className="mt-4">
              Fechar
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="help-name">Seu Nome *</Label>
              <Input
                id="help-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Como podemos te chamar?"
                required
                minLength={2}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="help-email">Seu Email *</Label>
              <Input
                id="help-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="help-phone">Telefone / WhatsApp</Label>
              <Input
                id="help-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 99999-9999"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="help-message">Mensagem</Label>
              <Textarea
                id="help-message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Conte como você pode ajudar..."
                rows={3}
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-pink-600 hover:bg-pink-700 text-white"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Enviando...
                  </>
                ) : (
                  <>
                    <Heart className="h-4 w-4 mr-2" />
                    Enviar
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
