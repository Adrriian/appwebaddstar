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
  mensagem.textContent = "Enviando...";

  try {
    const formData = new FormData(form);

    // Verifica se imagem foi escolhida
    const imagem = inputImagem.files[0];
    if (!imagem) {
      mensagem.textContent = "Por favor, selecione uma imagem.";
      return;
    }

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

      // 1. Gerar novo ID sequencial
      const ids = dadosExistentes.map(d => parseInt(d.id)).filter(n => !isNaN(n));
      const novoId = (Math.max(...ids, 0) + 1).toString();

      // 2. Procurar linha onde só a coluna 'codigo' está preenchida
let atualizarId = null;
let maiorId = 0;

// Passo 1: Encontrar o maior ID na planilha
dadosExistentes.forEach(registro => {
  const idNum = parseInt(registro.id);
  if (!isNaN(idNum) && idNum > maiorId) {
    maiorId = idNum;
  }
});

// Passo 2: Procurar pela linha específica (por exemplo, linha 24)
const linhaParaAlterar = dadosExistentes[23];  // Linha 24 (índice 23)

if (linhaParaAlterar) {
  const colunasExcetoCodigo = Object.entries(linhaParaAlterar)
    .filter(([key]) => key !== "id" && key !== "codigo");

  const todasCom1 = colunasExcetoCodigo.every(([_, value]) => value === "1");

  // Passo 3: Se todas as colunas exceto `codigo` estiverem com "1", substituir os dados (exceto `codigo`)
  if (todasCom1) {
    // Atualiza a linha mantendo o valor de `codigo` e substituindo as outras informações
    linhaParaAlterar.nome = novoNome;
    linhaParaAlterar.cidade = novaCidade;
    linhaParaAlterar.tipo = novoTipo;
    linhaParaAlterar.endereco = novoEndereco;
    linhaParaAlterar.numero = novoNumero;
    linhaParaAlterar.bairro = novoBairro;
    linhaParaAlterar.instagram = novoInstagram;
    linhaParaAlterar.whats = novoWhats;
    linhaParaAlterar.telefone = novoTelefone;
    linhaParaAlterar.desconto = novoDesconto;
    linhaParaAlterar.imagem = novaImagemUrl;  // O link da imagem
    linhaParaAlterar.alt = novaAlt;
  }
}






      // 3. Formatar descontos (benefícios)
      let beneficios = formData.get("desconto")
        .split(/[\n,;]/)
        .map(b => b.trim())
        .filter(b => b)
        .join("; ");

      // Dados para envio
      const dados = {
        id: novoId,
        nome: formData.get("nome"),
        endereco: formData.get("endereco"),
        numero: formData.get("numero"),
        bairro: formData.get("bairro"),
        telefone: formData.get("telefone"),
        cidade: formData.get("cidade"),
        instagram: formData.get("instagram"),
        tipo: formData.get("tipo"),
        desconto: beneficios,
        imagem: linkImagem,
        alt: altText,
      };

      let resposta;

      // 4. Atualizar linha existente ou adicionar nova
      if (atualizarId) {
        resposta = await fetch(`${API_SHEETDB}/id/${atualizarId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: dados })
        });
      } else {
        resposta = await fetch(API_SHEETDB, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: dados })
        });
      }

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
