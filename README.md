# Espeto F.C. — Landing Page Oficial

Landing page interativa e de alta performance do **Espeto F.C.** (São José do Rio Preto - SP), desenvolvida com React, Vite e Tailwind CSS.

---

## 🚀 Como Rodar Localmente

### Pré-requisitos
- [Node.js](https://nodejs.org/) (versão 18 ou superior recomendada)
- npm (já incluso com o Node.js)

### Instalação e Execução
1. **Instalar dependências:**
   ```bash
   npm install
   ```

2. **Iniciar servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```
   O projeto estará acessível em `http://localhost:3000` (ou na porta indicada no terminal).

3. **Gerar build de produção:**
   ```bash
   npm run build
   ```
   Os arquivos finais otimizados serão gerados na pasta `dist/`.

4. **Visualizar build localmente:**
   ```bash
   npm run preview
   ```

---

## 🛠️ Onde Alterar Dados e Links (Guia Rápido)

Todos os parâmetros principais e dados de contato estão concentrados no topo do arquivo [`src/App.tsx`](src/App.tsx):

- **Número do WhatsApp:**
  ```ts
  const WHATSAPP_NUMBER = "5517991056116"; // Formato: 55 + DDD + Número
  ```
- **Link do Instagram:**
  ```ts
  const INSTAGRAM_URL = "https://www.instagram.com/espeto.fc/";
  ```
- **Link do Cardápio (Google Drive):**
  ```ts
  const CARDAPIO_URL = "https://drive.google.com/drive/folders/1kYDVXrNFm3-TOz_M9Mk9lHc6Hhk5nldm";
  ```
- **Slides dos Destaques da Chapa:** Array `VISUAL_HIGHLIGHTS` em `src/App.tsx`.
- **Slides do Ambiente (Clima de Arquibancada):** Array `AMBIENTE_SLIDES` em `src/App.tsx`.
- **Endereço e Horários de Funcionamento:** Seção "Como Chegar" em `src/App.tsx` (linhas ~1050-1080).

---

## 🌐 Deploy na Vercel

O projeto segue a estrutura padrão do **Vite + React**:
1. Conecte o repositório no dashboard da [Vercel](https://vercel.com).
2. O framework preset será detectado automaticamente como **Vite**.
3. **Build Command:** `npm run build`
4. **Output Directory:** `dist`
5. Nenhum arquivo `vercel.json` adicional é necessário.
