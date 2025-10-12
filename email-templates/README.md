# Email Templates - SomosTetra

Modelos de e-mail profissionais e responsivos para a plataforma SomosTetra.

## 📧 Templates Disponíveis

1. **confirmation-email.html** - E-mail de confirmação de cadastro
2. **password-reset-email.html** - E-mail de redefinição de senha
3. **invite-user-email.html** - E-mail de convite para novos usuários
4. **magic-link-email.html** - E-mail com link mágico de acesso
5. **change-email-email.html** - E-mail de confirmação de mudança de e-mail
6. **reauthentication-email.html** - E-mail de reautenticação com código

## 🎨 Características

- ✅ Design responsivo (mobile-friendly)
- ✅ Cores da marca SomosTetra (gradiente verde)
- ✅ Gradientes modernos
- ✅ Botões de call-to-action destacados
- ✅ Links alternativos para compatibilidade
- ✅ Avisos de segurança
- ✅ Footer com informações da ONG

## 📝 Como Usar

### 1. Acesse o Supabase Dashboard

Vá para: https://supabase.com/dashboard/project/[SEU_PROJECT_ID]/auth/templates

### 2. Configure os Templates

#### E-mail de Confirmação (Confirm signup)

1. Clique em **"Confirm signup"**
2. Cole o conteúdo de `confirmation-email.html`
3. Clique em **"Save"**

#### E-mail de Redefinição de Senha (Reset password)

1. Clique em **"Reset password"**
2. Cole o conteúdo de `password-reset-email.html`
3. Clique em **"Save"**

#### E-mail de Convite (Invite user)

1. Clique em **"Invite user"**
2. Cole o conteúdo de `invite-user-email.html`
3. Clique em **"Save"**

#### E-mail de Link Mágico (Magic Link)

1. Clique em **"Magic Link"**
2. Cole o conteúdo de `magic-link-email.html`
3. Clique em **"Save"**

#### E-mail de Mudança de E-mail (Change Email Address)

1. Clique em **"Change Email Address"**
2. Cole o conteúdo de `change-email-email.html`
3. Clique em **"Save"**

#### E-mail de Reautenticação (Reauthentication)

1. Clique em **"Reauthentication"**
2. Cole o conteúdo de `reauthentication-email.html`
3. Clique em **"Save"**

### 3. Variáveis Disponíveis

O Supabase substitui automaticamente estas variáveis:

- `{{ .ConfirmationURL }}` - Link de confirmação/redefinição
- `{{ .Token }}` - Token/código de confirmação ou reautenticação
- `{{ .TokenHash }}` - Hash do token
- `{{ .SiteURL }}` - URL do seu site

## 🎯 Customização

Para personalizar os templates:

1. **Cores**: Altere os valores hexadecimais no CSS inline
2. **Logo**: Substitua o texto "SOMOSTETRA" por uma imagem se desejar
3. **Texto**: Edite o conteúdo em português conforme necessário
4. **Links**: Atualize os links do footer com suas redes sociais

## 🔧 Testando

Após configurar os templates:

1. Crie uma nova conta de teste
2. Verifique se o e-mail chegou com o design correto
3. Teste em diferentes clientes de e-mail (Gmail, Outlook, etc.)
4. Verifique a responsividade no mobile

## 📱 Compatibilidade

Os templates são compatíveis com:

- ✅ Gmail (web e app)
- ✅ Outlook (web e desktop)
- ✅ Apple Mail
- ✅ Yahoo Mail
- ✅ Dispositivos móveis (iOS e Android)

## 🎨 Paleta de Cores

- **Verde Principal**: #4a7c59
- **Verde Claro**: #7fa85c
- **Verde Accent (TETRA)**: #a8d08d
- **Texto Escuro**: #2d3748
- **Texto Médio**: #4a5568
- **Texto Claro**: #718096
- **Background**: #f0f4f0

## 📄 Licença

Código aberto - SomosTetra ONG
