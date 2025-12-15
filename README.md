<div align="center">

<img src="public/logo_somos_tetra.jpeg" alt="SomosTetra Logo" width="180"/>

# SomosTetra

### A primeira plataforma que conecta a comunidade tetraplégica do Brasil a estudos clínicos, realiza desejos e amplifica sua voz.

[![Live](https://img.shields.io/badge/🌐_Live-somostetra.org-00A86B?style=for-the-badge)](https://somostetra.org)
[![Open Source](https://img.shields.io/badge/100%25-Open_Source-00A86B?style=for-the-badge&logo=github)](https://github.com/fcavalcantirj/somostetra.org)
[![Non Profit](https://img.shields.io/badge/ONG-Sem_Fins_Lucrativos-blue?style=for-the-badge)](#)

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript)](https://typescriptlang.org)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?style=flat-square&logo=supabase)](https://supabase.com)
[![Tailwind](https://img.shields.io/badge/Tailwind-v4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com)

---

[🔬 Estudos Clínicos](#-estudos-clínicos) •
[⭐ Sistema de Desejos](#-sistema-de-desejos) •
[🗳️ Votações](#️-votações) •
[🌐 Perfis Públicos](#-perfis-públicos) •
[🏆 Gamificação](#-gamificação) •
[🛠️ Arquitetura](#️-arquitetura)

</div>

---

## 🎯 Nossa Missão

Pessoas com tetraplegia enfrentam desafios únicos e precisam de uma **voz coletiva forte**. SomosTetra é essa voz.

Uma plataforma **100% gratuita, sem fins lucrativos e open source** que:

- 🔬 **Conecta** pessoas a estudos clínicos que podem mudar suas vidas
- ⭐ **Realiza desejos** conectando quem precisa a quem pode ajudar
- 🗳️ **Amplifica a voz** da comunidade em causas importantes
- 🌐 **Dá visibilidade** através de perfis públicos personalizados

> *"Juntos somos mais fortes. Sua voz importa. Sua participação faz a diferença."*

---

## 🔬 Estudos Clínicos

<div align="center">

**Encontre pesquisas que podem mudar sua vida**

</div>

Nossa integração com [ClinicalTrials.gov](https://clinicaltrials.gov) permite que membros encontrem estudos clínicos relevantes para sua condição.

### Funcionalidades

| Feature | Descrição |
|---------|-----------|
| 🔍 **Busca Inteligente** | Pesquise por condição, localização e fase do estudo |
| 📍 **Filtro por Localização** | Encontre estudos próximos a você em qualquer estado brasileiro |
| 🔔 **Notificações** | Administradores notificam membros sobre novos estudos relevantes |
| 📊 **Analytics** | Rastreamento de buscas para melhorar recomendações |

### Microserviço de Estudos Clínicos

A busca de estudos clínicos é alimentada por nosso microserviço dedicado:

<div align="center">

[![Clinical Trials Microservice](https://img.shields.io/badge/🔬_Microservice-clinical--trials--microservice-00A86B?style=for-the-badge)](https://github.com/fcavalcantirj/clinical-trials-microservice)

</div>

> **[clinical-trials-microservice](https://github.com/fcavalcantirj/clinical-trials-microservice)** - API Node.js/Express que consulta ClinicalTrials.gov e filtra estudos relacionados a lesões medulares (tetraplegia, quadriplegia, paraplegia).

---

## ⭐ Sistema de Desejos

<div align="center">

**Conectamos quem precisa com quem pode ajudar**

</div>

Membros podem cadastrar desejos/necessidades e a comunidade se mobiliza para ajudar.

### Categorias de Desejos

- 🦽 **Cadeiras de rodas** e equipamentos de mobilidade
- 💊 **Medicamentos** e suprimentos médicos
- 🏥 **Equipamentos médicos** (cateteres, sondas, etc.)
- 🔧 **Adaptações** e tecnologia assistiva
- 📚 **Educação** e capacitação
- ❤️ **Outros** apoios diversos

### Fluxo do Sistema

```
Membro cadastra → Admin aprova → Comunidade ajuda → Desejo realizado!
     desejo          categoria        voluntário         🎉
```

### Para Apoiadores

Apoiadores podem visualizar desejos aprovados e oferecer ajuda diretamente, criando uma rede de solidariedade ativa.

---

## 🗳️ Votações

<div align="center">

**Decisões importantes são tomadas pela comunidade**

</div>

Sistema de votação democrático onde membros e apoiadores participam de decisões sobre:

- 🏥 **Saúde** - Prioridades em assistência médica
- ♿ **Acessibilidade** - Demandas por infraestrutura
- 📚 **Educação** - Iniciativas de capacitação
- ⚖️ **Direitos** - Pautas de advocacia e políticas públicas

> Cada voto conta. Quanto maior a comunidade, mais forte nossa voz para pressionar autoridades.

---

## 🌐 Perfis Públicos

<div align="center">

**Sua história merece ser contada**

`somostetra.org/p/seu-nome`

</div>

Cada membro pode criar uma página pública personalizada para:

- 📖 **Compartilhar sua história** com bio personalizada
- 🏆 **Exibir conquistas** e badges ganhas
- ⭐ **Mostrar desejos** que precisa de ajuda
- 🔗 **Link único** fácil de compartilhar

---

## 🏆 Gamificação

<div align="center">

**Participação que é reconhecida e recompensada**

</div>

### Sistema de Pontos

| Ação | Pontos |
|------|--------|
| ✅ Cadastro inicial | +10 pts |
| 🗳️ Cada voto | +5 pts |
| 👥 Indicar membro | +20 pts |
| 🤝 Indicar apoiador | +10 pts |
| 📝 Completar perfil | +50 pts |

### Badges

| Badge | Nome | Requisito |
|-------|------|-----------|
| 🎯 | **Primeiro Passo** | 1 ponto |
| ⭐ | **Engajado** | 50 pontos |
| 🌟 | **Influenciador** | 100 pontos |
| 🗳️ | **Ativista** | 150 pontos |
| 👑 | **Líder Comunitário** | 500+ pontos |

### Ranking

Acompanhe os membros mais engajados no **[Leaderboard](https://somostetra.org/leaderboard)**.

---

## 🛠️ Arquitetura

### Stack Tecnológico

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                │
│  Next.js 15 + React 19 + TypeScript + Tailwind CSS v4           │
│  Radix UI + React Hook Form + Zod                               │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND                                 │
│  Supabase (PostgreSQL + Auth + RLS + Real-time)                 │
│  41 RLS Policies │ 28 Triggers │ 25+ Functions                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    EXTERNAL SERVICES                            │
│  ┌──────────────────┐    ┌──────────────────────────────────┐   │
│  │ Clinical Trials  │    │ ClinicalTrials.gov API           │   │
│  │ Microservice     │───▶│ (U.S. National Library of        │   │
│  │ (Railway)        │    │  Medicine)                       │   │
│  └──────────────────┘    └──────────────────────────────────┘   │
│  ┌──────────────────┐    ┌──────────────────────────────────┐   │
│  │ Vercel Analytics │    │ Google Analytics (GA4)           │   │
│  └──────────────────┘    └──────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Banco de Dados

**14 tabelas principais:**

- `profiles` - Dados de usuários (70+ campos incluindo info médica)
- `supporters` - Dados de apoiadores
- `votes` / `user_votes` - Sistema de votação
- `badges` / `user_badges` - Sistema de conquistas
- `wishes` / `wish_categories` / `wish_help_requests` - Sistema de desejos
- `clinical_trial_notifications` / `clinical_trial_searches` - Estudos clínicos
- `referrals` / `activities` / `platform_statistics` - Engajamento

---

## 🚀 Começando

### Pré-requisitos

- Node.js 18+
- pnpm (recomendado) ou npm
- Conta Supabase

### Instalação

```bash
# Clone o repositório
git clone https://github.com/fcavalcantirj/somostetra.org.git
cd somostetra.org

# Instale dependências
pnpm install

# Configure variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com suas credenciais Supabase

# Execute o servidor de desenvolvimento
pnpm dev
```

### Variáveis de Ambiente

```env
NEXT_PUBLIC_SUPABASE_URL=sua_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anon
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role
NEXT_PUBLIC_SITE_URL=http://localhost:3000
CLINICAL_TRIALS_API_URL=url_do_microservico
```

---

## 🤝 Como Contribuir

Adoramos contribuições! Veja como você pode ajudar:

### 👥 Como Membro/Apoiador

1. **[Cadastre-se](https://somostetra.org)** na plataforma
2. **Vote** nas causas importantes
3. **Convide** amigos e familiares
4. **Compartilhe** nas redes sociais

### 💻 Como Desenvolvedor

1. 🐛 **[Reporte bugs](https://github.com/fcavalcantirj/somostetra.org/issues)**
2. 💡 **[Sugira melhorias](https://github.com/fcavalcantirj/somostetra.org/issues)**
3. 🔧 **Fork & envie PRs** - toda ajuda é bem-vinda!

### 🎨 Como Designer

- Sugira melhorias de UI/UX
- Ajude com acessibilidade
- Crie materiais visuais

---

## 📂 Projetos Relacionados

| Projeto | Descrição |
|---------|-----------|
| [**clinical-trials-microservice**](https://github.com/fcavalcantirj/clinical-trials-microservice) | API para busca de estudos clínicos em ClinicalTrials.gov |

---

## 🛡️ Privacidade & Segurança

**Seus dados são seus.** Nossa promessa:

- ❌ **Sem venda de dados** - Nunca
- ❌ **Zero anúncios** - 100% livre de publicidade
- ❌ **Sem mensalidades** - Gratuito para sempre
- ✅ **Open Source** - Código auditável por qualquer pessoa
- ✅ **Row-Level Security** - Proteção em nível de banco de dados

---

## 📞 Contato

<div align="center">

[![Email](https://img.shields.io/badge/Email-fcavalcanti@somostetra.org.br-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:fcavalcanti@somostetra.org.br)
[![Instagram](https://img.shields.io/badge/Instagram-@sou.tetra-E4405F?style=for-the-badge&logo=instagram&logoColor=white)](https://instagram.com/sou.tetra)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-SomosTetra-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/company/sou-tetra)
[![GitHub](https://img.shields.io/badge/GitHub-@fcavalcantirj-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/fcavalcantirj)

</div>

---

<div align="center">

## 🚀 Pronto Para Fazer a Diferença?

**Sua voz importa. Junte-se a nós.**

### [🌐 Acesse somostetra.org](https://somostetra.org)

---

**Feito com ❤️ pela e para a comunidade tetraplégica brasileira**

[⭐ Star no GitHub](https://github.com/fcavalcantirj/somostetra.org) •
[🐛 Reportar Bug](https://github.com/fcavalcantirj/somostetra.org/issues) •
[💡 Sugerir Melhoria](https://github.com/fcavalcantirj/somostetra.org/issues) •
[📊 Ver Leaderboard](https://somostetra.org/leaderboard)

---

*Múltiplos domínios, uma comunidade:*
**[somostetra.org](https://somostetra.org)** •
[soutetra.org](https://soutetra.org) •
[soutetra.com](https://soutetra.com)

</div>
