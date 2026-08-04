# Frontend conectado ao backend — fase 1

Nesta versão, categorias e produtos deixaram de usar dados mockados/localStorage e passaram a utilizar a API.

## Configuração

1. Copie `.env.example` para `.env`.
2. Confirme o endereço:

```env
VITE_API_URL=http://localhost:3000/api
```

3. Instale e execute:

```bash
npm install
npm run dev
```

## Fluxos conectados

- login administrativo via `POST /api/login`;
- listagem pública de categorias e produtos;
- cadastro, edição, ativação e exclusão de categorias;
- cadastro, edição, disponibilidade e exclusão de produtos.

## Fluxos ainda locais

Os módulos abaixo ainda permanecem no localStorage nesta fase e precisam das próximas entidades/rotas no backend:

- grupos de adicionais e vínculo com produtos;
- promoções;
- configurações completas da loja;
- checkout e pedidos completos;
- funcionários, cargos e permissões;
- entregadores no formato esperado pelo frontend.

O carrinho pode continuar local no navegador até o pedido ser finalizado.

## Persistência sem localStorage

Esta versão não usa `localStorage` para gravar dados do sistema.

- Categorias e produtos são gravados exclusivamente pela API.
- O pedido é enviado para `POST /api/pedidos` antes de abrir o WhatsApp.
- Se a API falhar, o sistema exibe a mensagem de erro e mantém o carrinho.
- Módulos ainda não integrados ao backend (promoções, grupos de adicionais, funcionários, cargos, entregadores e configurações completas) não salvam dados no navegador. Ao tentar gravar, o sistema informa que não foi possível salvar.
- Apenas dados temporários da sessão, como token, carrinho e etapas do checkout, usam `sessionStorage`. Eles são apagados ao encerrar a sessão do navegador e não funcionam como banco de dados.

## Fluxo de checkout e compartilhamento

- Ao abrir o carrinho sem identificação, o cliente é direcionado primeiro para o cadastro rápido de nome e telefone.
- Depois da identificação, o carrinho recupera o último endereço usado por aquele telefone durante a sessão atual.
- Para recuperar o endereço em outros dispositivos ou após fechar o navegador, o backend deve disponibilizar o cadastro/login do cliente e a consulta do endereço por cliente.
- O pedido mínimo agora aceita `null`; o backend de configurações deve tratar esse campo como opcional.
- A aba **Link do cardápio** gera uma URL no formato `/?loja=identificador`. A persistência e a validação de unicidade do identificador dependem da futura rota de configurações da loja.

## Funcionários e pedido mínimo

- O cadastro de funcionário deve utilizar o campo `email` como credencial de acesso, em vez de `username`.
- O backend também deve validar o formato do e-mail e impedir duplicidade por estabelecimento.
- A senha não possui limite mínimo definido pelo frontend, mas continua obrigatória. Regras adicionais de segurança devem ser aplicadas no backend conforme a política do sistema.
- O valor de `minimumOrder` deve ser retornado como `number | null`. Valores nulos ou menores/iguais a zero desativam a regra.
- O backend deve repetir a validação do pedido mínimo ao criar o pedido; a barra e o bloqueio do frontend não substituem a validação do servidor.

## Telefones e cargos padrão

- Os telefones são enviados pelo frontend somente com dígitos. O backend deve repetir a sanitização e a validação antes de persistir.
- O WhatsApp da loja pode conter DDI, DDD e número, com até 15 dígitos.
- O frontend sincroniza os cargos padrão pela rota de cargos:
  - **Gerente:** todas as permissões;
  - **Caixa:** `view_orders`, `manage_orders` e `cancel_orders`;
  - **Entregador:** `manage_deliveries`.
- O JWT retornado por `POST /api/login` deve incluir o nome do cargo no campo `role`, usando `Gerente`, `Caixa` ou `Entregador`, para que o frontend direcione e restrinja corretamente as telas administrativas.
- A autorização também deve ser aplicada no backend. Ocultar menus e bloquear rotas no frontend não substitui a validação do token e do cargo na API.
