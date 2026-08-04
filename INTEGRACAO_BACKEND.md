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
