# Aprovado

App de recomendação de estabelecimentos (Porto Alegre, RS) — só mostra o que já foi validado pela comunidade.
Curadoria via nota 0-10: um lugar só aparece na lista pública com nota média ≥ 7 e pelo menos 3 avaliações.

- `/` — app do usuário final (busca, avaliação, listas compartilhadas)
- `/admin` — painel administrativo (estabelecimentos, promoções, moderação)

## Rodando localmente

```bash
npm install
npm run dev
```

Abre em `http://localhost:5173`. O painel admin fica em `http://localhost:5173/admin`.

## Persistência de dados

Sem nenhuma configuração extra, o app já salva os dados no `localStorage` do navegador — eles não somem mais
ao fechar a aba, mas ficam só naquele navegador (não são compartilhados entre pessoas).

Para dados de verdade, compartilhados entre todo mundo que acessa o app, conecte um projeto Firebase:

1. Crie um projeto em [console.firebase.google.com](https://console.firebase.google.com).
2. Ative o **Firestore Database** (modo produção).
3. Em Configurações do projeto → Seus apps, crie um app Web e copie as chaves.
4. Copie `.env.example` para `.env.local` e preencha as chaves.
5. Publique as regras de segurança do arquivo `firestore.rules` (Firestore → Regras).
6. Reinicie o servidor (`npm run dev`). O app passa a usar o Firestore automaticamente.

## Publicando no Vercel

1. Suba este repositório para o GitHub.
2. Em [vercel.com](https://vercel.com), importe o repositório (framework detectado automaticamente: Vite).
3. Se estiver usando Firebase, adicione as mesmas variáveis do `.env.local` nas *Environment Variables* do projeto Vercel.
4. Deploy — o Vercel te dá um link público.
