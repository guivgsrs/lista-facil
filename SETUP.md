# Como configurar o Lista Fácil

## O que você precisa criar (15 min no total)

---

### 1. Chave do Gemini (OCR gratuito)

1. Acesse **aistudio.google.com** e entre com sua conta Google
2. Clique em **"Get API Key"** → **"Create API key"**
3. Copie a chave (começa com `AIzaSy...`)

---

### 2. Projeto no Supabase (banco de dados gratuito)

1. Acesse **supabase.com** → entre com Google
2. Clique **"New project"**
   - Nome: `lista-facil`
   - Senha: qualquer uma forte (anote em algum lugar)
   - Região: **South America (São Paulo)**
3. Aguarde ~2 minutos para criar
4. Vá em **Settings → API** e copie:
   - `URL` → é o `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → é o `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → é o `SUPABASE_SERVICE_ROLE_KEY`
5. Vá em **SQL Editor → New Query**
6. Cole o conteúdo do arquivo `supabase_schema.sql` e clique em **Run**

---

### 3. Deploy no Vercel

1. Suba o projeto para o GitHub:
   ```
   cd lista-facil
   git init
   git add .
   git commit -m "Initial commit"
   ```
   Depois crie um repositório no GitHub e faça o push.

2. Acesse **vercel.com** → entre com GitHub
3. Clique **"Add New → Project"** e escolha o repositório
4. Antes de clicar em Deploy, clique em **"Environment Variables"** e adicione:
   - `NEXT_PUBLIC_SUPABASE_URL` = URL do Supabase
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = anon key do Supabase
   - `SUPABASE_SERVICE_ROLE_KEY` = service role key do Supabase
   - `GEMINI_API_KEY` = chave do Google Gemini
5. Clique **Deploy** — em ~2 minutos o site estará no ar

---

### 4. Usando o app

- **Esposa:** acesse `seusite.vercel.app/edit`
  - Tire foto da lista → lista é digitalizada automaticamente
  - Corrija se precisar, ative itens frequentes
  - Clique "Finalizar lista"

- **Marido:** acesse `seusite.vercel.app/shop`
  - Lista aparece organizada por corredor (Assaí primeiro, Covabra no final)
  - ✓ verde = peguei
  - "Não achei" = move o item para a seção Covabra automaticamente

---

### Testar localmente (opcional)

```
npm install
cp .env.local.example .env.local
# Edite .env.local com seus valores reais
npm run dev
```
Acesse http://localhost:3000
