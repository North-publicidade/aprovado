# Projeto: Aprovado — briefing para continuidade no Claude Code

## O que é
App de recomendação de estabelecimentos de comida (Porto Alegre, RS, para começar). A ideia central: diferente do Google/Yelp, que mostra tudo (bom e ruim), o Aprovado só mostra o que já foi validado pela comunidade. Curadoria via nota 0-10 dada pelos próprios usuários.

Frases já definidas:
- Dentro do app: "só indico o que é bom"
- Divulgação: "vá só aonde vale a pena"

## Regra de curadoria (já implementada no protótipo)
Um estabelecimento só aparece na lista pública quando atinge nota média ≥ 7 com pelo menos 3 avaliações. Antes disso, fica numa seção "quase lá" (com cadeado, mostrando quantas avaliações faltam).

## Cadastro de estabelecimento
Não existe cadastro manual de estabelecimentos pela equipe. Ele "nasce" quando um usuário busca o nome e não encontra — aí escolhe a categoria e vira o primeiro avaliador. Dados de endereço/telefone viriam de uma API de localização (decidimos usar OpenStreetMap por ser gratuito nessa fase, com opção de trocar por Google Places API depois).

## Arquivos anexados
- `aprovado-prototipo.jsx` — protótipo do app do usuário final (React), com estas telas: Início (busca + filtro por categoria + lista de bem avaliados), Detalhe do estabelecimento (nota, endereço, telefone, Instagram, avaliações, etiquetas de ambiente), Avaliar (buscar ou cadastrar um lugar novo), Etiquetas opcionais pós-avaliação (ambiente agradável, bom para grupo, etc.), Listas compartilhadas (criar lista com amigos/família, adicionar lugares aprovados, marcar "já fomos").
- `aprovado-painel.jsx` — painel administrativo (React), separado do app do usuário. Tem: Visão geral (métricas), Estabelecimentos (editar dados, cadastrar promoções), Moderação (avaliações sinalizadas).

## Decisões técnicas já combinadas
- **Fase 1 (agora): só versão web**, sem publicar em App Store/Google Play ainda.
- **Sem cadastro/login nessa fase** — qualquer pessoa acessa, avalia e cria lista livremente. (Retomar login mais adiante, quando o app tiver volume, para evitar fraude em avaliações.)
- **Frontend**: React (mesma tecnologia do protótipo).
- **Dados de localização**: OpenStreetMap (gratuito) nessa fase inicial.
- **Banco de dados**: Firebase (quando formos adicionar persistência).
- **Hospedagem**: Vercel (gratuito).
- Se um dia for pra nativo: React Native com Expo.

## O que preciso agora
1. Transformar o protótipo num projeto React publicável de verdade.
2. Conectar um banco de dados para os dados pararem de sumir ao fechar a aba (hoje tudo é só estado em memória).
3. Subir o código para o GitHub.
4. Publicar no Vercel com um link público.

Pode ir me perguntando o que precisar decidir no caminho — mas já sabendo o contexto acima, sem precisar eu explicar tudo de novo.
