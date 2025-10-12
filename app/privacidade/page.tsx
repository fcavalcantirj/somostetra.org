import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Shield, Lock, Eye, UserCheck, Database, Mail, Code2, Heart } from "lucide-react"

export default function PrivacidadePage() {
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
              Voltar
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
            POLÍTICA DE
            <br />
            <span className="text-gradient">PRIVACIDADE</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Sua privacidade é nossa prioridade. Entenda como coletamos, usamos e protegemos seus dados.
          </p>
          <p className="text-sm text-muted-foreground">Última atualização: 12 de outubro de 2025</p>
        </div>
      </section>

      {/* Content */}
      <section className="pb-32 px-4 sm:px-6 lg:px-12">
        <div className="container mx-auto max-w-4xl space-y-16">
          {/* Introduction */}
          <div className="glass-strong p-8 md:p-12 rounded-3xl space-y-6">
            <h2 className="text-3xl font-black">Introdução</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              A plataforma SomosTetra está comprometida em proteger sua privacidade e seus dados pessoais. Esta Política
              de Privacidade descreve como coletamos, usamos, armazenamos e protegemos suas informações, em conformidade
              com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
            </p>
          </div>

          {/* Data Collection */}
          <div className="space-y-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl gradient-accent flex items-center justify-center flex-shrink-0">
                <Database className="w-6 h-6" />
              </div>
              <div className="space-y-4 flex-1">
                <h2 className="text-3xl font-black">Dados Coletados</h2>
                <div className="glass-strong p-8 rounded-2xl space-y-4">
                  <h3 className="text-xl font-bold">Informações de Cadastro</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• Nome de usuário</li>
                    <li>• Endereço de e-mail</li>
                    <li>• Senha (criptografada)</li>
                    <li>• Código de referência (quando aplicável)</li>
                  </ul>
                </div>
                <div className="glass-strong p-8 rounded-2xl space-y-4">
                  <h3 className="text-xl font-bold">Dados de Atividade</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• Participação em votações</li>
                    <li>• Convites e referências realizadas</li>
                    <li>• Pontos e badges conquistados</li>
                    <li>• Histórico de atividades na plataforma</li>
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
                <h2 className="text-3xl font-black">Como Usamos Seus Dados</h2>
                <div className="glass-strong p-8 rounded-2xl space-y-4">
                  <p className="text-muted-foreground leading-relaxed">Utilizamos seus dados pessoais para:</p>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• Autenticar e gerenciar sua conta</li>
                    <li>• Processar sua participação em votações e petições</li>
                    <li>• Calcular pontos e atribuir badges de gamificação</li>
                    <li>• Gerenciar o sistema de referências e convites</li>
                    <li>• Enviar notificações importantes sobre a plataforma</li>
                    <li>• Melhorar nossos serviços e experiência do usuário</li>
                    <li>• Cumprir obrigações legais e regulatórias</li>
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
                <h2 className="text-3xl font-black">Armazenamento e Segurança</h2>
                <div className="glass-strong p-8 rounded-2xl space-y-4">
                  <p className="text-muted-foreground leading-relaxed">
                    Seus dados são armazenados de forma segura utilizando a infraestrutura Supabase, com as seguintes
                    medidas de segurança:
                  </p>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>• Criptografia de dados em trânsito e em repouso</li>
                    <li>• Senhas protegidas com hash bcrypt</li>
                    <li>• Políticas de segurança em nível de linha (RLS)</li>
                    <li>• Backups regulares e redundância de dados</li>
                    <li>• Acesso restrito apenas a pessoal autorizado</li>
                    <li>• Monitoramento contínuo de segurança</li>
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
                <h2 className="text-3xl font-black">Seus Direitos</h2>
                <div className="glass-strong p-8 rounded-2xl space-y-4">
                  <p className="text-muted-foreground leading-relaxed">
                    De acordo com a LGPD, você tem os seguintes direitos:
                  </p>
                  <ul className="space-y-2 text-muted-foreground">
                    <li>
                      • <strong>Acesso:</strong> Solicitar acesso aos seus dados pessoais
                    </li>
                    <li>
                      • <strong>Correção:</strong> Corrigir dados incompletos ou desatualizados
                    </li>
                    <li>
                      • <strong>Exclusão:</strong> Solicitar a exclusão de seus dados
                    </li>
                    <li>
                      • <strong>Portabilidade:</strong> Receber seus dados em formato estruturado
                    </li>
                    <li>
                      • <strong>Revogação:</strong> Revogar consentimento a qualquer momento
                    </li>
                    <li>
                      • <strong>Oposição:</strong> Opor-se ao tratamento de seus dados
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Data Sharing */}
          <div className="glass-strong p-8 md:p-12 rounded-3xl space-y-6">
            <h2 className="text-3xl font-black">Compartilhamento de Dados</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Não vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros para fins comerciais. Seus
              dados podem ser compartilhados apenas nas seguintes situações:
            </p>
            <ul className="space-y-2 text-muted-foreground">
              <li>• Com provedores de serviços essenciais (Supabase, Vercel)</li>
              <li>• Quando exigido por lei ou ordem judicial</li>
              <li>• Para proteger direitos, propriedade ou segurança da plataforma</li>
              <li>• Com seu consentimento explícito</li>
            </ul>
          </div>

          {/* Cookies */}
          <div className="glass-strong p-8 md:p-12 rounded-3xl space-y-6">
            <h2 className="text-3xl font-black">Cookies e Tecnologias Similares</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Utilizamos cookies essenciais para autenticação e funcionamento da plataforma. Estes cookies são
              necessários para manter sua sessão ativa e garantir a segurança da sua conta.
            </p>
          </div>

          {/* Children */}
          <div className="glass-strong p-8 md:p-12 rounded-3xl space-y-6">
            <h2 className="text-3xl font-black">Menores de Idade</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Nossa plataforma é destinada a maiores de 18 anos. Não coletamos intencionalmente dados de menores de
              idade. Se você acredita que coletamos dados de um menor, entre em contato conosco imediatamente.
            </p>
          </div>

          {/* Transparency & Open Source */}
          <div className="space-y-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center flex-shrink-0">
                <Code2 className="w-6 h-6" />
              </div>
              <div className="space-y-4 flex-1">
                <h2 className="text-3xl font-black">Transparência e Código Aberto</h2>
                <div className="glass-strong p-8 rounded-2xl space-y-4">
                  <div className="flex items-start gap-3">
                    <Heart className="w-6 h-6 text-gradient flex-shrink-0 mt-1" />
                    <div className="space-y-3">
                      <p className="text-lg font-bold">Organização Sem Fins Lucrativos</p>
                      <p className="text-muted-foreground leading-relaxed">
                        A SomosTetra é uma <strong>ONG (Organização Não Governamental)</strong> sem fins lucrativos.
                        Nunca visamos lucro e toda nossa operação é voltada exclusivamente para o benefício da
                        comunidade de pessoas tetraplégicas e seus apoiadores.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 pt-4">
                    <Code2 className="w-6 h-6 text-gradient flex-shrink-0 mt-1" />
                    <div className="space-y-3">
                      <p className="text-lg font-bold">Código 100% Aberto</p>
                      <p className="text-muted-foreground leading-relaxed">
                        Todo o código-fonte da plataforma SomosTetra é <strong>totalmente aberto e público</strong>.
                        Qualquer pessoa pode auditar, contribuir e verificar como seus dados são tratados.
                      </p>
                      <div className="pt-2">
                        <a
                          href="https://github.com/fcavalcantirj/somostetra.org"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 text-gradient font-bold hover:underline"
                        >
                          <Code2 className="w-5 h-5" />
                          Ver código no GitHub →
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
            <h2 className="text-3xl font-black">Alterações na Política</h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos você sobre mudanças
              significativas por e-mail ou através de aviso na plataforma. A data da última atualização será sempre
              indicada no topo desta página.
            </p>
          </div>

          {/* Contact */}
          <div className="space-y-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl gradient-accent flex items-center justify-center flex-shrink-0">
                <Mail className="w-6 h-6" />
              </div>
              <div className="space-y-4 flex-1">
                <h2 className="text-3xl font-black">Contato</h2>
                <div className="glass-strong p-8 rounded-2xl space-y-4">
                  <p className="text-muted-foreground leading-relaxed">
                    Para exercer seus direitos ou esclarecer dúvidas sobre esta Política de Privacidade, entre em
                    contato conosco:
                  </p>
                  <div className="space-y-3 text-muted-foreground">
                    <p>
                      <strong>E-mail:</strong> privacidade@soutetra.com
                    </p>
                    <div>
                      <p className="font-bold mb-2">Plataforma (domínios oficiais):</p>
                      <ul className="space-y-1 ml-4">
                        <li>• https://somostetra.org</li>
                        <li>• https://soutetra.com</li>
                        <li>• https://soutetra.org</li>
                      </ul>
                      <p className="text-sm mt-2 italic">
                        Todos os domínios acima pertencem à mesma plataforma SomosTetra.
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground pt-4">
                    Responderemos sua solicitação em até 15 dias úteis, conforme estabelecido pela LGPD.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="gradient-primary p-12 rounded-3xl text-center space-y-6">
            <h2 className="text-4xl font-black">Dúvidas?</h2>
            <p className="text-lg opacity-90 max-w-2xl mx-auto">
              Estamos aqui para ajudar. Entre em contato conosco se tiver qualquer dúvida sobre como tratamos seus
              dados.
            </p>
            <Button
              asChild
              size="lg"
              variant="secondary"
              className="font-bold bg-background text-foreground hover:bg-background/90"
            >
              <Link href="/">Voltar ao Início</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
