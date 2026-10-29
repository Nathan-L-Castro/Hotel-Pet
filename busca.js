/* Hotel Pet - Busca nas listagens (Reservas, Pets, Usuários...)
 * Sem bibliotecas. Incluir nas páginas que têm <form class="barra-busca">
 * e uma <table class="tabela-listagem">, depois do navegacao.js:
 *   <script src="js/busca.js"></script>
 */
(function () {
  "use strict";

  // Remove acentos, ignora maiúsculas/minúsculas e espaços extras
  function normalizar(texto) {
    return String(texto)
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();
  }

  function iniciar() {
    var form = document.querySelector("form.barra-busca");
    var tabela = document.querySelector("table.tabela-listagem");
    if (!form || !tabela || !tabela.tBodies.length) return;

    var corpo = tabela.tBodies[0];
    var linhas = Array.prototype.slice.call(corpo.rows);
    var campoBusca = form.querySelector('input[type="search"], input[type="text"]');
    var filtros = Array.prototype.slice.call(form.querySelectorAll("select"));
    var colunas = tabela.tHead ? tabela.tHead.rows[0].cells.length : 1;

    // Guarda o texto de cada linha (sem a coluna de ações) e de cada célula
    var indice = linhas.map(function (linha) {
      var celulas = Array.prototype.slice.call(linha.cells).map(function (c) {
        // Colunas de ação (links/botões como "Ver reserva") não entram na busca
        if (c.querySelector("a, button")) return "";
        return normalizar(c.textContent);
      });
      return { linha: linha, celulas: celulas, texto: celulas.join(" ") };
    });

    // Mensagem de "sem resultados" e contador
    var vazio = document.createElement("tr");
    vazio.className = "sem-resultados";
    vazio.hidden = true;
    var tdVazio = document.createElement("td");
    tdVazio.colSpan = colunas;
    tdVazio.textContent = "Nenhum resultado encontrado.";
    tdVazio.style.textAlign = "center";
    vazio.appendChild(tdVazio);
    corpo.appendChild(vazio);

    var contador = document.createElement("p");
    contador.className = "contador-resultados";
    contador.setAttribute("aria-live", "polite");
    form.insertAdjacentElement("afterend", contador);

    function filtroSelecionado(select) {
      var opcao = select.options[select.selectedIndex];
      if (!opcao || opcao.value === "") return "";
      return normalizar(opcao.textContent);
    }

    function buscar() {
      var termos = campoBusca ? normalizar(campoBusca.value).split(" ").filter(Boolean) : [];
      var selecionados = filtros.map(filtroSelecionado).filter(Boolean);
      var visiveis = 0;

      indice.forEach(function (item) {
        // Todos os termos digitados precisam aparecer na linha
        var okTexto = termos.every(function (t) {
          return item.texto.indexOf(t) !== -1;
        });
        // Cada filtro (ex.: status) precisa bater com alguma célula
        var okFiltros = selecionados.every(function (sel) {
          return item.celulas.some(function (c) {
            return c === sel || c.indexOf(sel) !== -1;
          });
        });
        var mostrar = okTexto && okFiltros;
        item.linha.hidden = !mostrar;
        if (mostrar) visiveis++;
      });

      vazio.hidden = visiveis !== 0;

      var filtrando = termos.length > 0 || selecionados.length > 0;
      if (!filtrando) {
        contador.textContent = "";
      } else {
        contador.textContent =
          visiveis === 1 ? "1 resultado encontrado." : visiveis + " resultados encontrados.";
      }
    }

    // Busca enquanto digita, ao trocar o filtro e ao clicar em "Buscar"
    if (campoBusca) campoBusca.addEventListener("input", buscar);
    filtros.forEach(function (s) {
      s.addEventListener("change", buscar);
    });
    form.addEventListener("submit", function (evento) {
      evento.preventDefault();
      buscar();
    });
    form.addEventListener("reset", function () {
      setTimeout(buscar, 0);
    });

    // Permite abrir a página já filtrada: reservas.html?busca=thor
    var params = new URLSearchParams(window.location.search);
    if (campoBusca && params.get("busca")) campoBusca.value = params.get("busca");
    buscar();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
})();
