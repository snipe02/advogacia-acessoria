(function () {
  "use strict";

  /* ====== CONFIG DO FIREBASE (mesma dos dois arquivos) ====== */
  const firebaseConfig = {
    apiKey: "AIzaSyA-C1fhpSDs-mclzyCrfnhq17Y6Yol1P7I",
    authDomain: "lucas-advogado.firebaseapp.com",
    databaseURL: "https://lucas-advogado-default-rtdb.firebaseio.com",
    projectId: "lucas-advogado",
    storageBucket: "lucas-advogado.firebasestorage.app",
    messagingSenderId: "921214898505",
    appId: "1:921214898505:web:8669bda60e29f38e710a98",
  };
  /* ========================================================== */

  const WHATSAPP = "558694622189";
  const TIMEOUT_MS = 12000;

  const form = document.getElementById("clientForm");
  const modal = document.getElementById("successModal");
  const erroBox = document.getElementById("erro");
  const erroMsg = document.getElementById("erroMsg");
  const wFallback = document.getElementById("whatsFallback");
  const statusEl = document.getElementById("status");
  const telInput = document.getElementById("telefone");
  const btn = document.getElementById("btnEnviar");
  const btnTexto = document.getElementById("btnTexto");

  let db = null;
  let pronto = false;
  let enviando = false;

  function setStatus(tipo, html) {
    statusEl.className = "text-center text-xs mb-6 ";
    statusEl.classList.add(
      tipo === "ok"
        ? "text-green-600"
        : tipo === "err"
          ? "text-red-600"
          : "text-gray-400",
    );
    statusEl.innerHTML = html;
  }

  function comTimeout(promise, ms) {
    return new Promise(function (resolve, reject) {
      let finalizado = false;
      const timer = setTimeout(function () {
        if (!finalizado) {
          finalizado = true;
          reject(new Error("timeout"));
        }
      }, ms);
      promise.then(
        function (v) {
          if (!finalizado) {
            finalizado = true;
            clearTimeout(timer);
            resolve(v);
          }
        },
        function (e) {
          if (!finalizado) {
            finalizado = true;
            clearTimeout(timer);
            reject(e);
          }
        },
      );
    });
  }

  /* ---------- Inicialização do Firebase ---------- */
  try {
    if (typeof firebase === "undefined")
      throw new Error(
        "SDK do Firebase não carregou. Verifique sua internet.",
      );
    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
    db = firebase.firestore();
    pronto = true;
    setStatus(
      "ok",
      '<i class="fa-solid fa-circle text-[8px] mr-1"></i> Conectado ao servidor',
    );
    console.log("✅ Firebase inicializado:", firebaseConfig.projectId);
  } catch (e) {
    console.error("❌ Erro ao inicializar Firebase:", e);
    pronto = false;
    setStatus(
      "err",
      '<i class="fa-solid fa-triangle-exclamation mr-1"></i> ' + e.message,
    );
  }

  /* ---------- Máscara de telefone ---------- */
  telInput.addEventListener("input", function (e) {
    let v = e.target.value.replace(/\D/g, "").slice(0, 11);
    if (v.length > 10)
      v = "(" + v.slice(0, 2) + ") " + v.slice(2, 7) + "-" + v.slice(7);
    else if (v.length > 6)
      v = "(" + v.slice(0, 2) + ") " + v.slice(2, 6) + "-" + v.slice(6);
    else if (v.length > 2) v = "(" + v.slice(0, 2) + ") " + v.slice(2);
    else if (v.length > 0) v = "(" + v;
    e.target.value = v;
  });

  /* ---------- Modal ---------- */
  function toggleModal(show) {
    modal.classList.toggle("modal-visible", show);
    modal.classList.toggle("modal-hidden", !show);
  }

  document.getElementById("closeModal").onclick = function () {
    toggleModal(false);
  };

  modal.addEventListener("click", function (e) {
    if (e.target === modal) toggleModal(false);
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") toggleModal(false);
  });

  /* ---------- Link do WhatsApp ---------- */
  function linkWhatsApp(dados) {
    const texto =
      "Olá! Acabei de preencher o formulário no site:\n\n" +
      "*Nome:* " +
      (dados.nome || "") +
      "\n" +
      "*Telefone:* " +
      (dados.telefone || "") +
      "\n" +
      "*Endereço:* " +
      (dados.endereco || "");
    return "https://wa.me/" + WHATSAPP + "?text=" + encodeURIComponent(texto);
  }

  function mostrarErro(texto, dados) {
    erroMsg.textContent = texto;
    if (dados) {
      wFallback.href = linkWhatsApp(dados);
      wFallback.classList.remove("hidden");
    } else {
      wFallback.classList.add("hidden");
    }
    erroBox.classList.remove("hidden");
    erroBox.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  function esconderErro() {
    erroBox.classList.add("hidden");
    wFallback.classList.add("hidden");
  }

  /* ---------- ENVIO ---------- */
  form.addEventListener("submit", async function (e) {
    e.preventDefault();
    e.stopPropagation();
    if (enviando) return;
    esconderErro();

    const nome = document.getElementById("nome").value.trim();
    const telefone = telInput.value.trim();
    const endereco = document.getElementById("endereco").value.trim();

    if (nome.length < 3)
      return mostrarErro("Informe seu nome completo.", {
        nome,
        telefone,
        endereco,
      });

    if (telefone.replace(/\D/g, "").length < 10)
      return mostrarErro("Informe um telefone válido com DDD.", {
        nome,
        telefone,
        endereco,
      });

    if (endereco.length < 5)
      return mostrarErro("Informe seu endereço completo.", {
        nome,
        telefone,
        endereco,
      });

    if (!pronto) {
      return mostrarErro(
        "Sem conexão com o servidor de cadastro. Clique no botão verde abaixo para enviar seus dados pelo WhatsApp:",
        { nome, telefone, endereco },
      );
    }

    enviando = true;
    btn.disabled = true;
    btnTexto.textContent = "Enviando...";

    let sucesso = false;
    let ultimoErro = "";

    try {
      await comTimeout(
        db.collection("clientes").add({
          nome: nome,
          telefone: telefone,
          endereco: endereco,
          criadoEm: firebase.firestore.FieldValue.serverTimestamp(),
        }),
        TIMEOUT_MS,
      );
      sucesso = true;
      console.log("✅ Salvo no Firestore");
    } catch (err) {
      console.error("❌ Firestore:", err.code || err.message);
      ultimoErro = err.code || err.message;
    }

    enviando = false;
    btn.disabled = false;
    btnTexto.textContent = "Enviar Cadastro";

    if (sucesso) {
      form.reset();
      toggleModal(true);
      return;
    }

    /* Falhou → WhatsApp */
    let dica = "Não foi possível enviar para o servidor agora.";
    const c = String(ultimoErro).toLowerCase();

    if (c.includes("timeout"))
      dica = "O servidor demorou demais para responder.";
    else if (
      c.includes("permission-denied") ||
      c.includes("permission_denied")
    )
      dica =
        "As regras do Firebase estão bloqueando o envio. Libere a escrita na coleção 'clientes'.";
    else if (c.includes("not-found") || c.includes("failed-precondition"))
      dica = "O Firestore ainda não foi criado no console do Firebase.";
    else if (c.includes("unavailable") || c.includes("network"))
      dica = "Sem conexão com o servidor. Verifique sua internet.";

    mostrarErro(
      dica +
        " Clique no botão verde abaixo para enviar seus dados pelo WhatsApp:" +
        (ultimoErro ? " (Erro técnico: " + ultimoErro + ")" : ""),
      { nome, telefone, endereco },
    );
  });
})();