/* Hotel Pet - Busca nas listagens (Reservas, Pets, Usuários)
 * Sem bibliotecas. Funciona com:
 *  - tabelas:  <table class="tabela-listagem"> (Reservas, Usuários)
 *  - cartões:  <div class="grade-cartoes"> com <a class="cartao-pet"> (Pets)
 * Incluir depois do navegacao.js, nas páginas com <form class="barra-busca">.
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

  function textoDe(elemento) {
    // Ignora colunas de ação (links/botões como "Ver reserva")
    if (elemento.querySelector && elemento.querySelector("a, button")) return "";
    return normalizar(elemento.textContent);
  }

  function iniciar() {
    var form = document.querySelector("form.barra-busca");
    if (!form) return;

    var tabela = document.querySelector("table.tabela-listagem");
    var grade = document.querySelector(".grade-cartoes");
    var itens = []; // { elemento, celulas[], texto }
    var recipiente, mensagem;

    if (tabela && tabela.tBodies.length) {
      recipiente = tabela.tBodies[0];
      var colunas = tabela.tHead ? tabela.tHead.rows[0].cells.length : 1;
      Array.prototype.forEach.call(recipiente.rows, function (linha) {
        var celulas = Array.prototype.map.call(linha.cells, textoDe);
        itens.push({ elemento: linha, celulas: celulas, texto: celulas.join(" ") });
      });
      mensagem = document.createElement("tr");
      var td = document.createElement("td");
      td.colSpan = colunas;
      td.textContent = "Nenhum resultado encontrado.";
      td.style.textAlign = "center";
      mensagem.appendChild(td);
    } else if (grade) {
      recipiente = grade;
      Array.prototype.forEach.call(grade.children, function (cartao) {
        // Cartão inteiro é um link: aqui o texto do cartão é o que se busca
        var t = normalizar(cartao.textContent);
        itens.push({ elemento: cartao, celulas: [t], texto: t });
      });
      mensagem = document.createElement("p");
      mensagem.textContent = "Nenhum resultado encontrado.";
    } else {
      return;
    }

    mensagem.className = "sem-resultados";
    mensagem.style.display = "none";
    recipiente.appendChild(mensagem);

    var campoBusca = form.querySelector('input[type="search"], input[type="text"]');
    var filtros = Array.prototype.slice.call(form.querySelectorAll("select"));

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

      itens.forEach(function (item) {
        // Todos os termos digitados precisam aparecer no item
        var okTexto = termos.every(function (t) {
          return item.texto.indexOf(t) !== -1;
        });
        // Cada filtro (status, tamanho, função...) precisa bater com alguma célula
        var okFiltros = selecionados.every(function (sel) {
          return item.celulas.some(function (c) {
            return c !== "" && c.indexOf(sel) !== -1;
          });
        });
        var mostrar = okTexto && okFiltros;
        item.elemento.style.display = mostrar ? "" : "none";
        if (mostrar) visiveis++;
      });

      mensagem.style.display = visiveis === 0 ? "" : "none";
      var filtrando = termos.length > 0 || selecionados.length > 0;
      contador.textContent = !filtrando
        ? ""
        : visiveis === 1
        ? "1 resultado encontrado."
        : visiveis + " resultados encontrados.";
    }

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

    // Abre a página já filtrada: reservas.html?busca=thor
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
