/* Hotel Pet - Semana 1: Navegação
 * Sem bibliotecas. Incluir em TODAS as páginas, antes de </body>:
 *   <script src="js/navegacao.js"></script>
 */
(function () {
  "use strict";

  // ---------- Configuração ----------
  var PAGINA_LOGIN = "index.html";
  var PAGINA_INICIAL = "reservas.html";
  var PAGINAS_PUBLICAS = ["index.html", "cadastro.html"];

  // Páginas internas -> item do menu que deve ficar "ativo"
  var MENU_POR_PAGINA = {
    "reservas.html": "reservas.html",
    "reserva-nova.html": "reservas.html",
    "reserva-detalhe.html": "reservas.html",
    "pets.html": "pets.html",
    "pet-novo.html": "pets.html",
    "pet-detalhe.html": "pets.html",
    "usuarios.html": "usuarios.html",
    "usuario-detalhe.html": "usuarios.html",
    "configuracoes.html": "configuracoes.html"
  };

  // Formulários de cadastro/edição -> para onde voltar após salvar
  var DESTINO_APOS_SALVAR = {
    "reserva-nova.html": "reservas.html",
    "reserva-detalhe.html": "reservas.html",
    "pet-novo.html": "pets.html",
    "pet-detalhe.html": "pets.html",
    "usuario-detalhe.html": "usuarios.html",
    "perfil.html": "reservas.html",
    "configuracoes.html": "configuracoes.html"
  };

  // ---------- Utilitários ----------
  function paginaAtual() {
    var nome = window.location.pathname.split("/").pop();
    return nome === "" ? PAGINA_LOGIN : nome;
  }

  function irPara(url) {
    window.location.href = url;
  }

  function getSessao() {
    try {
      return JSON.parse(sessionStorage.getItem("hotelpet_sessao"));
    } catch (e) {
      return null;
    }
  }

  function setSessao(dados) {
    try {
      sessionStorage.setItem("hotelpet_sessao", JSON.stringify(dados));
    } catch (e) {}
  }

  function limparSessao() {
    try {
      sessionStorage.removeItem("hotelpet_sessao");
    } catch (e) {}
  }

  function getUsuarios() {
    try {
      return JSON.parse(localStorage.getItem("hotelpet_usuarios")) || [];
    } catch (e) {
      return [];
    }
  }

  function salvarUsuarios(lista) {
    try {
      localStorage.setItem("hotelpet_usuarios", JSON.stringify(lista));
    } catch (e) {}
  }

  function nomeDoEmail(email) {
    var parte = String(email).split("@")[0].replace(/[._-]+/g, " ").trim();
    return parte.replace(/\b\w/g, function (c) {
      return c.toUpperCase();
    });
  }

  // ---------- 1. Proteção de rotas ----------
  function protegerRota() {
    var publica = PAGINAS_PUBLICAS.indexOf(paginaAtual()) !== -1;
    if (!publica && !getSessao()) {
      irPara(PAGINA_LOGIN);
      return false;
    }
    if (publica && getSessao() && paginaAtual() === PAGINA_LOGIN) {
      irPara(PAGINA_INICIAL);
      return false;
    }
    return true;
  }

  // ---------- 2. Login e criação de conta ----------
  function configurarLogin() {
    var form = document.querySelector("body.auth-page .auth-form");
    if (!form) return;

    form.addEventListener("submit", function (evento) {
      evento.preventDefault();
      var email = form.querySelector('input[type="email"]');
      var senha = form.querySelector('input[type="password"]');

      if (!email.value.trim() || !senha.value) {
        alert("Preencha e-mail e senha.");
        return;
      }

      var emailVal = email.value.trim().toLowerCase();
      var usuarios = getUsuarios();

      if (paginaAtual() === "cadastro.html") {
        var senhas = form.querySelectorAll('input[type="password"]');
        if (senhas.length > 1 && senhas[0].value !== senhas[1].value) {
          alert("As senhas não conferem.");
          return;
        }
        var existe = usuarios.some(function (u) {
          return u.email === emailVal;
        });
        if (existe) {
          alert("Já existe uma conta com esse e-mail.");
          return;
        }
        var campoNome = form.querySelector("#nome");
        var campoTel = form.querySelector("#telefone");
        usuarios.push({
          nome: campoNome ? campoNome.value.trim() : nomeDoEmail(emailVal),
          email: emailVal,
          telefone: campoTel ? campoTel.value.trim() : "",
          senha: senha.value
        });
        salvarUsuarios(usuarios);
        alert("Conta criada! Faça login para continuar.");
        irPara(PAGINA_LOGIN);
        return;
      }

      var usuario = usuarios.filter(function (u) {
        return u.email === emailVal && u.senha === senha.value;
      })[0];
      if (!usuario) {
        alert("E-mail ou senha incorretos. Se ainda não tem conta, clique em \"Criar conta\".");
        return;
      }

      setSessao({ email: usuario.email, nome: usuario.nome });
      irPara(PAGINA_INICIAL);
      return;
    });
  }

  // ---------- 3. Menu principal ----------
  function marcarMenuAtivo() {
    var alvo = MENU_POR_PAGINA[paginaAtual()];
    var links = document.querySelectorAll(".menu-principal a");
    for (var i = 0; i < links.length; i++) {
      var href = links[i].getAttribute("href");
      links[i].classList.toggle("ativo", href === alvo);
      if (href === alvo) {
        links[i].setAttribute("aria-current", "page");
      } else {
        links[i].removeAttribute("aria-current");
      }
    }
  }

  // ---------- 4. Cabeçalho: nome do usuário e botão Sair ----------
  function configurarCabecalho() {
    var topo = document.querySelector(".topo");
    if (!topo) return;

    var sessao = getSessao();
    var nome = document.querySelector(".perfil-topo span");
    if (nome && sessao) nome.textContent = sessao.nome;

    var sair = document.createElement("a");
    sair.href = PAGINA_LOGIN;
    sair.className = "btn btn-texto";
    sair.id = "btn-sair";
    sair.textContent = "Sair";
    sair.addEventListener("click", function (evento) {
      evento.preventDefault();
      if (confirm("Deseja sair do sistema?")) {
        limparSessao();
        irPara(PAGINA_LOGIN);
      }
    });
    topo.appendChild(sair);
  }

  // ---------- 5. Linhas das tabelas clicáveis ----------
  function configurarTabelas() {
    var linhas = document.querySelectorAll(".tabela-listagem tbody tr");
    for (var i = 0; i < linhas.length; i++) {
      (function (linha) {
        var link = linha.querySelector("a[href]");
        if (!link) return;
        linha.style.cursor = "pointer";
        linha.addEventListener("click", function (evento) {
          if (evento.target.closest("a, button, input, select")) return;
          irPara(link.getAttribute("href"));
        });
      })(linhas[i]);
    }
  }

  // ---------- 6. Botões "Voltar" / "Cancelar" ----------
  // Use data-voltar no HTML: <a href="reservas.html" data-voltar>Cancelar</a>
  function configurarVoltar() {
    var botoes = document.querySelectorAll("[data-voltar]");
    for (var i = 0; i < botoes.length; i++) {
      botoes[i].addEventListener("click", function (evento) {
        if (window.history.length > 1) {
          evento.preventDefault();
          window.history.back();
        }
      });
    }
  }

  // ---------- 7. Salvar formulários e voltar à listagem ----------
  function configurarFormularios() {
    var destino = DESTINO_APOS_SALVAR[paginaAtual()];
    if (!destino) return;

    var forms = document.querySelectorAll("main form:not(.barra-busca)");
    for (var i = 0; i < forms.length; i++) {
      forms[i].addEventListener("submit", function (evento) {
        evento.preventDefault();
        if (!this.checkValidity()) {
          this.reportValidity();
          return;
        }
        alert("Dados salvos com sucesso!");
        irPara(destino);
      });
    }
  }

  // ---------- Inicialização ----------
  function iniciar() {
    if (!protegerRota()) return;
    configurarLogin();
    marcarMenuAtivo();
    configurarCabecalho();
    configurarTabelas();
    configurarVoltar();
    configurarFormularios();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar);
  } else {
    iniciar();
  }
})();
