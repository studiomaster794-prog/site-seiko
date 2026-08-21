# Checklist de publicação — Studio Seiko

## Antes de enviar ao GitHub

- Abrir `index.html` em um servidor local e revisar em desktop e celular.
- Testar larguras de 320 px, 390 px, 768 px e 1440 px.
- Abrir as oito páginas da pasta `servicos/`.
- Testar menu, FAQ, galeria, lightbox, mapa, telefone, Instagram e WhatsApp.
- Confirmar nome, telefone, endereço e horários.
- Confirmar se todos os textos descrevem serviços realmente oferecidos.
- Verificar se nenhuma informação pessoal da pasta `mais sobre mim/` será enviada.
- Revisar o `git diff` antes do commit.

## Depois da publicação na Vercel

- Confirmar que a página inicial e todas as páginas de serviços retornam HTTP 200.
- Testar se Google Analytics recebe `page_view` e eventos de clique.
- Verificar no console do navegador se a Content Security Policy não bloqueou Analytics, fontes ou mapa.
- Confirmar os cabeçalhos `Content-Security-Policy`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy` e `X-Frame-Options`.
- Testar instalação pela opção “Adicionar à tela inicial” em um celular compatível.

## Google Search Console

- Adicionar e verificar a propriedade `studioseiko.com.br`.
- Enviar `https://studioseiko.com.br/sitemap.xml`.
- Inspecionar a URL `https://studioseiko.com.br/` e solicitar indexação.
- Inspecionar pelo menos as páginas dos serviços principais.
- Acompanhar páginas indexadas, experiência, consultas e erros de rastreamento.

## Perfil da Empresa no Google

- Confirmar nome, categoria, endereço completo, telefone e horários.
- Adicionar `https://studioseiko.com.br/` como site.
- Adicionar os serviços oferecidos com descrições consistentes.
- Publicar fotos reais da loja e dos trabalhos com autorização.
- Pedir avaliações a clientes satisfeitos e responder a todas.
- Usar sempre a mesma grafia de nome, endereço e telefone no site, Google e Instagram.

## Acompanhamento após 30 dias

- Conferir quais páginas e pesquisas receberam impressões no Search Console.
- Conferir quais botões e serviços geraram cliques no WhatsApp.
- Priorizar fotos, conteúdo e campanhas para os serviços com maior interesse.
- Só então testar novas variações de textos e chamadas.
