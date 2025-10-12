# 🌱 SomosTetra

**Plataforma comunitária de engajamento democrático e participação cidadã**

[![Deployed on Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=for-the-badge&logo=vercel)](https://vercel.com/flowcoders/v0-somos-tetra-mvp-plan)
[![Open Source](https://img.shields.io/badge/Open-Source-green?style=for-the-badge)](https://github.com/fcavalcantirj/somostetra.org)
[![Built with Next.js](https://img.shields.io/badge/Built%20with-Next.js-black?style=for-the-badge&logo=next.js)](https://nextjs.org)

---

## 🎯 Sobre o Projeto

**SomosTetra** é uma plataforma open-source desenvolvida para fortalecer a participação democrática e o engajamento comunitário. Como uma **ONG sem fins lucrativos**, nossa missão é criar ferramentas digitais que empoderem comunidades a se organizarem, votarem em causas importantes e construírem redes de apoio mútuo.

### 🌐 Acesse a Plataforma

- **Principal**: [somostetra.org](https://somostetra.org)
- **Alternativo**: [soutetra.com](https://soutetra.com)
- **Alternativo**: [soutetra.org](https://soutetra.org)

---

## ✨ Funcionalidades

### 🗳️ Sistema de Votação
- Criação e participação em votações comunitárias
- Categorias: Saúde, Educação, Meio Ambiente, Infraestrutura, Cultura
- Votações ativas e históricas
- Painel administrativo para gestão de votações

### 🏆 Gamificação e Conquistas
- Sistema de pontos por participação
- 5 badges progressivas (Primeiro Passo, Engajado, Influenciador, Líder Comunitário, Guardião da Comunidade)
- Ranking da comunidade
- Reconhecimento por contribuições

### 🤝 Sistema de Indicações
- Links personalizados de convite
- Compartilhamento via WhatsApp e e-mail
- Pontos por membros e apoiadores indicados
- Rastreamento de conexões comunitárias

### 📊 Dashboard Personalizado
- Estatísticas de participação
- Progresso de conquistas
- Histórico de atividades
- Gestão de perfil

---

## 🛠️ Tecnologias

### Frontend
- **[Next.js 15](https://nextjs.org)** - Framework React com App Router
- **[React 19](https://react.dev)** - Biblioteca UI
- **[TypeScript](https://www.typescriptlang.org)** - Tipagem estática
- **[Tailwind CSS v4](https://tailwindcss.com)** - Estilização
- **[shadcn/ui](https://ui.shadcn.com)** - Componentes UI

### Backend & Database
- **[Supabase](https://supabase.com)** - Backend as a Service
- **PostgreSQL** - Banco de dados relacional
- **Row Level Security (RLS)** - Segurança de dados
- **Database Triggers** - Automação de estatísticas

### Infraestrutura
- **[Vercel](https://vercel.com)** - Hospedagem e deploy
- **GitHub** - Controle de versão
- **Vercel Analytics** - Monitoramento

---

## 🚀 Começando

### Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- Conta Supabase (gratuita)

### Instalação

1. **Clone o repositório**
\`\`\`bash
git clone https://github.com/fcavalcantirj/somostetra.org.git
cd somostetra.org
\`\`\`

2. **Instale as dependências**
\`\`\`bash
npm install
\`\`\`

3. **Configure as variáveis de ambiente**

Crie um arquivo `.env.local` com as seguintes variáveis:

\`\`\`env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=sua_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
SUPABASE_SERVICE_ROLE_KEY=sua_chave_service_role

# Site
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=http://localhost:3000
\`\`\`

4. **Execute os scripts SQL**

No painel do Supabase, execute os scripts na pasta `scripts/` em ordem:
- `001_create_tables.sql` - Cria as tabelas
- `002_seed_badges.sql` - Popula badges
- `003_create_rls_policies.sql` - Configura segurança
- `004_add_admin_flag.sql` - Adiciona funcionalidade admin
- `005_add_vote_categories.sql` - Adiciona categorias
- `006_add_vote_constraints.sql` - Adiciona índices
- `007_restrict_vote_creation_to_admins.sql` - Restringe criação de votos
- `008_create_supporters_table.sql` - Cria tabela de apoiadores
- `009_add_increment_points_function.sql` - Função de pontos
- `010_create_statistics_table_and_triggers.sql` - Estatísticas automáticas
- `011_add_comprehensive_indexes.sql` - Índices de performance
- `012_add_duplicate_protection.sql` - Proteção contra duplicatas

5. **Inicie o servidor de desenvolvimento**
\`\`\`bash
npm run dev
\`\`\`

Acesse [http://localhost:3000](http://localhost:3000) no navegador.

---

## 📁 Estrutura do Projeto

\`\`\`
somostetra.org/
├── app/                      # App Router do Next.js
│   ├── admin/               # Painel administrativo
│   ├── auth/                # Autenticação (login, signup)
│   ├── badges/              # Página de conquistas
│   ├── dashboard/           # Dashboard do usuário
│   ├── leaderboard/         # Ranking da comunidade
│   ├── referrals/           # Sistema de indicações
│   ├── votes/               # Sistema de votação
│   ├── privacidade/         # Política de privacidade
│   └── page.tsx             # Landing page
├── components/              # Componentes React
│   ├── ui/                  # Componentes shadcn/ui
│   └── ...                  # Componentes customizados
├── lib/                     # Utilitários e configurações
├── scripts/                 # Scripts SQL do banco de dados
└── public/                  # Arquivos estáticos
\`\`\`

---

## 🤝 Como Contribuir

Adoramos contribuições da comunidade! Aqui está como você pode ajudar:

### 1. Reporte Bugs
Encontrou um problema? [Abra uma issue](https://github.com/fcavalcantirj/somostetra.org/issues) descrevendo:
- O que aconteceu
- O que você esperava que acontecesse
- Passos para reproduzir o problema

### 2. Sugira Funcionalidades
Tem uma ideia? [Abra uma issue](https://github.com/fcavalcantirj/somostetra.org/issues) com a tag `enhancement` explicando:
- Qual problema a funcionalidade resolve
- Como você imagina que funcionaria
- Por que seria útil para a comunidade

### 3. Contribua com Código

\`\`\`bash
# 1. Fork o projeto
# 2. Crie uma branch para sua feature
git checkout -b feature/minha-feature

# 3. Commit suas mudanças
git commit -m 'feat: adiciona minha feature'

# 4. Push para a branch
git push origin feature/minha-feature

# 5. Abra um Pull Request
\`\`\`

### Padrões de Commit
Seguimos o [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` - Nova funcionalidade
- `fix:` - Correção de bug
- `docs:` - Documentação
- `style:` - Formatação
- `refactor:` - Refatoração de código
- `test:` - Testes
- `chore:` - Manutenção

---

## 📄 Licença

Este projeto é **100% open-source** e está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 🌟 Transparência

### Open Source
Todo o código desta plataforma é aberto e auditável. Acreditamos em transparência total e convidamos a comunidade a revisar, contribuir e melhorar o projeto.

**Repositório**: [github.com/fcavalcantirj/somostetra.org](https://github.com/fcavalcantirj/somostetra.org)

### ONG Sem Fins Lucrativos
SomosTetra é uma organização sem fins lucrativos. **Nunca** haverá monetização, anúncios ou venda de dados. Nossa missão é servir a comunidade, não lucrar com ela.

---

## 📞 Contato

- **E-mail**: privacidade@somostetra.org
- **GitHub**: [@fcavalcantirj](https://github.com/fcavalcantirj)
- **Instagram**: [@sou.tetra](https://instagram.com/sou.tetra)
- **LinkedIn**: [SomosTetra](https://linkedin.com/company/sou-tetra)

---

## 🙏 Agradecimentos

Agradecemos a todos os contribuidores, apoiadores e membros da comunidade que tornam este projeto possível. Juntos, estamos construindo uma plataforma mais democrática e participativa.

---

<div align="center">

**Feito com ❤️ pela comunidade SomosTetra**

[⭐ Star no GitHub](https://github.com/fcavalcantirj/somostetra.org) • [🐛 Reportar Bug](https://github.com/fcavalcantirj/somostetra.org/issues) • [💡 Sugerir Feature](https://github.com/fcavalcantirj/somostetra.org/issues)

</div>
