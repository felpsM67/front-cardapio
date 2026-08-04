# Alterações realizadas

## Checkout

1. O cliente que abre o carrinho sem estar identificado é enviado primeiro para o cadastro de nome e telefone.
2. Após o cadastro, ele retorna ao carrinho.
3. O último endereço usado pelo telefone é preenchido automaticamente durante a sessão atual.
4. O fluxo seguinte passou diretamente do carrinho para o pagamento.

## Configurações

1. O campo de pedido mínimo passou a ser opcional e aceita valor vazio (`null`).
2. Foi criada a aba **Link do cardápio**.
3. A aba permite gerar o identificador pelo nome da loja, editar o identificador, copiar o link e abrir o cardápio em uma nova guia.

## Backend necessário

A persistência definitiva do endereço, do pedido mínimo e do identificador do link depende das respectivas rotas no backend. O frontend não usa `localStorage` para gravar esses dados.

## Funcionários

1. O campo **Nome de usuário** foi substituído por **E-mail**.
2. O e-mail é normalizado em letras minúsculas e validado antes do cadastro.
3. A listagem e a busca de funcionários agora utilizam o e-mail.
4. Foi removida a quantidade mínima de caracteres da senha no cadastro; a senha continua obrigatória.

## Regra de pedido mínimo no carrinho

1. Quando a loja possuir pedido mínimo maior que zero, o carrinho exibe uma barra de progresso.
2. A barra informa o valor atual, o valor mínimo e quanto ainda falta.
3. O botão para continuar fica bloqueado até o subtotal atingir o mínimo.
4. A revisão do pedido também valida o mínimo para impedir finalização por acesso direto à rota.

## Telefones e WhatsApp

1. Os campos de telefone do cliente, funcionário e entregador aceitam somente números.
2. O WhatsApp da loja também aceita somente números, incluindo o código do país quando necessário.
3. Caracteres colados por engano, como espaços, parênteses e hífens, são removidos automaticamente.

## Cargos padrão e acesso administrativo

1. A criação livre de cargos foi removida da tela de cargos.
2. O sistema mantém somente os cargos **Gerente**, **Caixa** e **Entregador**.
3. **Gerente** possui acesso completo a todas as áreas do painel.
4. **Caixa** possui acesso somente às telas de pedidos e caixa.
5. **Entregador** possui acesso somente à tela de entregas.
6. O menu administrativo e as rotas agora são filtrados de acordo com o cargo informado no token de login.
7. Os três cargos padrão são criados ou atualizados automaticamente no backend ao abrir a tela de cargos ou funcionários.
