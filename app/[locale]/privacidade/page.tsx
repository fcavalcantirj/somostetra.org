import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Shield, Lock, Eye, UserCheck, Database, Mail, Code2, Heart } from "lucide-react"
import { getTranslations } from "next-intl/server"

export default async function PrivacidadePage() {
  const t = await getTranslations("privacyPage")

  const registrationItems = t.raw("dataCollection.registration.items") as string[]
  const activityItems = t.raw("dataCollection.activity.items") as string[]
  const dataUsageItems = t.raw("dataUsage.items") as string[]
  const dataStorageItems = t.raw("dataStorage.items") as string[]
  const dataSharingItems = t.raw("dataSharing.items") as string[]

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 glass border-b border-border/50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-12 py-6 flex items-center justify-between">
          <Link href="/" className="text-2xl font-bold tracking-tight">
            SOMOS<span className="text-gradient">TETRA</span>
          </Link>
          <Button asChild variant="ghost" size="sm">
            <Link href="/">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t("back")}
            </Link>
          </Button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-12">
        <div className="container mx-auto max-w-4xl text-center space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl gradient-primary mb-4">
            <Shield className="w-10 h-10" />
          </div>
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter">
            {t("title")}
            <br />
            <span className="text-gradient">{t("titleHighlight")}</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {t("subtitle")}
          </p>
          <p className="text-sm text-muted-foreground">{t("lastUpdate")}</p>
        </div>
      </section>

      {/* Content */}
      <section className="pb-32 px-4 sm:px-6 lg:px-12">
        <div className="container mx-auto max-w-4xl space-y-16">
          {/* Introduction */}
          <div className="glass-strong p-8 md:p-12 rounded-3xl space-y-6">
            <h2 className="text-3xl font-black">{t("introduction.title")}</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {t("introduction.text")}
            </p>
          </div>

          {/* Data Collection */}
          <div className="space-y-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl gradient-accent flex items-center justify-center flex-shrink-0">
                <Database className="w-6 h-6" />
              </div>
              <div className="space-y-4 flex-1">
                <h2 className="text-3xl font-black">{t("dataCollection.title")}</h2>
                <div className="glass-strong p-8 rounded-2xl space-y-4">
                  <h3 className="text-xl font-bold">{t("dataCollection.registration.title")}</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    {registrationItems.map((item, i) => (
                      <li key={i}>• {item}</li>
                    ))}
                  </ul>
                </div>
                <div className="glass-strong p-8 rounded-2xl space-y-4">
                  <h3 className="text-xl font-bold">{t("dataCollection.activity.title")}</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    {activityItems.map((item, i) => (
                      <li key={i}>• {item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Data Usage */}
          <div className="space-y-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
                <Eye className="w-6 h-6" />
              </div>
              <div className="space-y-4 flex-1">
                <h2 className="text-3xl font-black">{t("dataUsage.title")}</h2>
                <div className="glass-strong p-8 rounded-2xl space-y-4">
                  <p className="text-muted-foreground leading-relaxed">{t("dataUsage.intro")}</p>
                  <ul className="space-y-2 text-muted-foreground">
                    {dataUsageItems.map((item, i) => (
                      <li key={i}>• {item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Data Storage */}
          <div className="space-y-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl gradient-accent flex items-center justify-center flex-shrink-0">
                <Lock className="w-6 h-6" />
              </div>
              <div className="space-y-4 flex-1">
                <h2 className="text-3xl font-black">{t("dataStorage.title")}</h2>
                <div className="glass-strong p-8 rounded-2xl space-y-4">
                  <p className="text-muted-foreground leading-relaxed">
                    {t("dataStorage.intro")}
                  </p>
                  <ul className="space-y-2 text-muted-foreground">
                    {dataStorageItems.map((item, i) => (
                      <li key={i}>• {item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* User Rights */}
          <div className="space-y-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
                <UserCheck className="w-6 h-6" />
              </div>
              <div className="space-y-4 flex-1">
                <h2 className="text-3xl font-black">{t("userRights.title")}</h2>
                <div className="glass-strong p-8 rounded-2xl space-y-4">
                  <p className="text-muted-foreground leading-relaxed">
                    {t("userRights.intro")}
                  </p>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>
                      • <strong>Access:</strong> {t("userRights.access")}
                    </li>
                    <li>
                      • <strong>Correction:</strong> {t("userRights.correction")}
                    </li>
                    <li>
                      • <strong>Deletion:</strong> {t("userRights.deletion")}
                    </li>
                    <li>
                      • <strong>Portability:</strong> {t("userRights.portability")}
                    </li>
                    <li>
                      • <strong>Revocation:</strong> {t("userRights.revocation")}
                    </li>
                    <li>
                      • <strong>Opposition:</strong> {t("userRights.opposition")}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Data Sharing */}
          <div className="glass-strong p-8 md:p-12 rounded-3xl space-y-6">
            <h2 className="text-3xl font-black">{t("dataSharing.title")}</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {t("dataSharing.intro")}
            </p>
            <ul className="space-y-2 text-muted-foreground">
              {dataSharingItems.map((item, i) => (
                <li key={i}>• {item}</li>
              ))}
            </ul>
          </div>

          {/* Cookies */}
          <div className="glass-strong p-8 md:p-12 rounded-3xl space-y-6">
            <h2 className="text-3xl font-black">{t("cookies.title")}</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {t("cookies.text")}
            </p>
          </div>

          {/* Children */}
          <div className="glass-strong p-8 md:p-12 rounded-3xl space-y-6">
            <h2 className="text-3xl font-black">{t("minors.title")}</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {t("minors.text")}
            </p>
          </div>

          {/* Transparency & Open Source */}
          <div className="space-y-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
                <Code2 className="w-6 h-6" />
              </div>
              <div className="space-y-4 flex-1">
                <h2 className="text-3xl font-black">{t("transparency.title")}</h2>
                <div className="glass-strong p-8 rounded-2xl space-y-4">
                  <div className="flex items-start gap-3">
                    <Heart className="w-6 h-6 text-gradient flex-shrink-0 mt-1" />
                    <div className="space-y-3">
                      <p className="text-lg font-bold">{t("transparency.nonprofit.title")}</p>
                      <p className="text-muted-foreground leading-relaxed">
                        {t("transparency.nonprofit.text")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 pt-4">
                    <Code2 className="w-6 h-6 text-gradient flex-shrink-0 mt-1" />
                    <div className="space-y-3">
                      <p className="text-lg font-bold">{t("transparency.openSource.title")}</p>
                      <p className="text-muted-foreground leading-relaxed">
                        {t("transparency.openSource.text")}
                      </p>
                      <div className="pt-2">
                        <a
                          href="https://github.com/fcavalcantirj/somostetra.org"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-gradient font-bold hover:underline"
                        >
                          <Code2 className="w-5 h-5" />
                          {t("transparency.openSource.link")} →
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Changes */}
          <div className="glass-strong p-8 md:p-12 rounded-3xl space-y-6">
            <h2 className="text-3xl font-black">{t("changes.title")}</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {t("changes.text")}
            </p>
          </div>

          {/* Contact */}
          <div className="space-y-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl gradient-accent flex items-center justify-center flex-shrink-0">
                <Mail className="w-6 h-6" />
              </div>
              <div className="space-y-4 flex-1">
                <h2 className="text-3xl font-black">{t("contact.title")}</h2>
                <div className="glass-strong p-8 rounded-2xl space-y-4">
                  <p className="text-muted-foreground leading-relaxed">
                    {t("contact.intro")}
                  </p>
                  <div className="space-y-3 text-muted-foreground">
                    <p>
                      <strong>{t("contact.email")}:</strong> privacidade@somostetra.org
                    </p>
                    <div>
                      <p className="font-bold mb-2">{t("contact.platform")}:</p>
                      <ul className="space-y-1 ml-4">
                        <li>• https://somostetra.org ({t("contact.mainDomain")})</li>
                      </ul>
                      <p className="text-sm mt-2 italic">
                        {t("contact.redirectNote")}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground pt-4">
                    {t("contact.responseTime")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="gradient-primary p-12 rounded-3xl text-center space-y-6">
            <h2 className="text-4xl font-black">{t("cta.title")}</h2>
            <p className="text-lg opacity-90 max-w-2xl mx-auto">
              {t("cta.text")}
            </p>
            <Button
              asChild
              size="lg"
              variant="secondary"
              className="font-bold bg-background text-foreground hover:bg-background/90"
            >
              <Link href="/">{t("cta.button")}</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
