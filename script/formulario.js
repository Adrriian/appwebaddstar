const API_SHEETDB = "https://sheetdb.io/api/v1/ur52ycgftenen";
const API_IMGBB = "https://api.imgbb.com/1/upload?key=5c298eb2a1382aeb9277e4da5696b77d";

// Elementos
const form = document.getElementById("formLoja");
const inputImagem = document.getElementById("inputImagem");
const btnUpload = document.getElementById("btnUpload");
const nomeArquivo = document.getElementById("nomeArquivo");
const btnEnviar = document.getElementById("btnEnviar");
const mensagem = document.getElementById("mensagem");

// Mostrar nome do arquivo selecionado
btnUpload.addEventListener("click", () => inputImagem.click());
inputImagem.addEventListener("change", () => {
  nomeArquivo.textContent = inputImagem.files[0]?.name || "Nenhum arquivo selecionado";
});

// Apenas números no campo telefone
const inputTelefone = form.querySelector('input[name="telefone"]');
inputTelefone.addEventListener("input", () => {
  inputTelefone.value = inputTelefone.value.replace(/\D/g, "");
});
btnEnviar.addEventListener("click", async (e) => {
  e.preventDefault();
  mensagem.textContent = "";

  // Limpa bordas anteriores
  document.querySelectorAll(".input-invalido").forEach(el => el.classList.remove("input-invalido"));

  try {
    const formData = new FormData(form);
    const camposObrigatorios = ["nome", "endereco", "bairro", "telefone", "cidade", "tipo", "desconto"];
    let formularioValido = true;

    for (const campo of camposObrigatorios) {
      const input = form.querySelector(`[name="${campo}"]`);
      const valor = formData.get(campo)?.trim();

      if (!valor) {
        input.classList.add("input-invalido");
        formularioValido = false;
      }
    }

    // Verifica se imagem foi escolhida
    const imagem = inputImagem.files[0];
    if (!imagem) {
      mensagem.textContent = "Por favor, selecione uma imagem.";
      formularioValido = false;
      inputImagem.classList.add("input-invalido");
    }

    if (!formularioValido) {
      mensagem.textContent = "Por favor, preencha todos os campos obrigatórios.";
      return;
    }

    mensagem.textContent = "Enviando...";

    // Ler imagem como base64
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result.split(',')[1];

      // Upload imagem no ImgBB
      const imgbbRes = await fetch(API_IMGBB, {
        method: "POST",
        body: new URLSearchParams({ image: base64 }),
      });

      const imgbbData = await imgbbRes.json();
      const linkImagem = imgbbData.data?.url;
      const altText = imagem.name;

      if (!linkImagem) {
        mensagem.textContent = "Erro ao enviar imagem.";
        return;
      }

      // Pega os dados existentes da planilha
      const dadosExistentesRes = await fetch(API_SHEETDB);
      const dadosExistentes = await dadosExistentesRes.json();

      // Gera novo ID
      const ids = dadosExistentes.map(d => parseInt(d.id)).filter(n => !isNaN(n));
      const novoId = (Math.max(...ids, 0) + 1).toString();

      // Geração de código único
      const codigosExistentes = new Set(dadosExistentes.map(d => d.codigo));
      let novoCodigo;
      do {
        novoCodigo = Math.floor(1000 + Math.random() * 9000).toString();
      } while (codigosExistentes.has(novoCodigo));

      // Formatar descontos
      const beneficios = formData.get("desconto")
        .split(/[\n,;]/)
        .map(b => b.trim())
        .filter(b => b)
        .join("; ");

      const dados = {
        id: novoId,
        codigo: novoCodigo,
        nome: formData.get("nome"),
        endereco: formData.get("endereco"),
        numero: formData.get("numero"),
        bairro: formData.get("bairro"),
        telefone: formData.get("telefone"),
        cidade: formData.get("cidade"),
        instagram: formData.get("instagram") || "",
        tipo: formData.get("tipo"),
        desconto: beneficios,
        imagem: linkImagem,
        alt: altText,
      };

      const resposta = await fetch(API_SHEETDB, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: dados })
      });

      if (resposta.ok) {
        mensagem.textContent = "Loja adicionada com sucesso!";
        form.reset();
        nomeArquivo.textContent = "Nenhum arquivo selecionado";
      } else {
        mensagem.textContent = "Erro ao enviar dados para a planilha.";
      }
    };

    reader.readAsDataURL(imagem);
  } catch (error) {
    console.error(error);
    mensagem.textContent = "Erro inesperado. Tente novamente.";
  }
});
