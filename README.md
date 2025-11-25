# Dragon Ball Legends Team Builder

Este projeto é uma ferramenta completa para criar e analisar equipas para o jogo **Dragon Ball Legends**. O projeto está dividido em duas partes principais: um **Webscraper** para recolher dados e uma **Web App** para a construção de equipas.

## 1. Webscraper (`scraper_dbl.py`)

O Webscraper é um script em **Python** responsável por recolher a base de dados de personagens.

*   **Tecnologias**: Utiliza `requests` para fazer pedidos HTTP e `BeautifulSoup` (bs4) para fazer o parsing do HTML.
*   **Fonte de Dados**: O script acede ao site [dblegends.net](https://dblegends.net) para obter a lista de personagens e os seus detalhes.
*   **Funcionalidades**:
    *   Percorre a lista de todos os personagens.
    *   Entra na página de cada personagem para extrair detalhes profundos como: Stats, Z-Abilities, Zenkai Abilities, Main/Unique/Ultra Abilities, Arts Cards e Tags Visuais.
    *   Trata e limpa os dados (ex: extração de percentagens, separação de condições de Z-Ability).
*   **Output**: Gera um ficheiro `dbl_characters_full.json` que contém toda a informação estruturada necessária para a Web App.

## 2. Web App (`index.html`, `script.js`, `style.css`)

A Web App é a interface visual onde o utilizador interage com os dados recolhidos. É uma aplicação **Single Page Application (SPA)** construída com tecnologias web standard.

*   **Tecnologias**: HTML5, CSS3 (com variáveis para temas e layout em Grid/Flexbox) e JavaScript (Vanilla).
*   **Funcionalidades**:
    *   **Carregamento de Dados**: Permite carregar o ficheiro JSON gerado pelo scraper.
    *   **Filtragem e Pesquisa**: Pesquisa por nome e filtragem avançada por Tags (ex: "Saiyan", "Regeneration").
    *   **Team Building**: Sistema de "Drag and Drop" simplificado (clique para adicionar/remover) com 6 slots (1 Líder + 5 Membros).
    *   **Cálculo de Stats**: Calcula automaticamente o Power Level total e o Ability Bonus estimado da equipa.
    *   **Análise de Sinergia**:
        *   Analisa as **Z-Abilities** para mostrar quem recebe buff de quem (Completo, Parcial ou Nenhum).
        *   Analisa as **Zenkai Abilities** e aplica-as corretamente aos personagens elegíveis.
        *   Mostra detalhes visuais e links diretos para a página do personagem.

## Como Usar

1.  **Gerar Dados (Opcional)**:
    *   Certifica-te que tens Python instalado.
    *   Instala as dependências: `pip install requests beautifulsoup4`
    *   Corre o script: `python scraper_dbl.py`
    *   Isto irá criar/atualizar o ficheiro `dbl_characters_full.json`.

2.  **Usar a App**:
    *   Abre o ficheiro `index.html` no teu browser.
    *   Clica no botão "📂 Carregar JSON" e seleciona o ficheiro `dbl_characters_full.json`.
    *   Começa a criar a tua equipa!

## Agradecimentos

Um agradecimento especial ao **[dblegends.net](https://dblegends.net)**.
Este projeto não seria possível sem a excelente base de dados e organização de informação disponibilizada por eles. Todos os dados de personagens e imagens utilizados neste projeto foram recolhidos do seu website.
