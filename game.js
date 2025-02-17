import { getMusicas } from "./firebase.js";

// Função para carregar músicas no menu inicial
async function carregarMusicas() {
    const musicas = await getMusicas();
    const container = document.getElementById("screen-home");

    musicas.forEach(musica => {
        const btn = document.createElement("button");
        btn.classList.add("btn");
        btn.textContent = musica.titulo;
        btn.onclick = () => carregarMusica(musica);
        container.appendChild(btn);
    });
}

let currentMusic = null; // Variável global para guardar a música atual

// Função para carregar a música escolhida
function carregarMusica(musica) {
    currentMusic = musica; // Guarda a música atual
    document.getElementById("screen-home").style.display = "none";

    if (musica.tipo === "drag") {
        document.getElementById("screen-drag").style.display = "block";
        exibirLetraDrag(musica);
    } else {
        document.getElementById("screen-write").style.display = "block";
        exibirLetraWrite(musica);
    }
}

// Exibir letra no modo Drag and Drop
function exibirLetraDrag(musica) {
    const lyricsContainer = document.getElementById("lyricsDrag");
    lyricsContainer.innerHTML = "";

    let palavrasDisponiveis = musica.palavras.map(p => p.toLowerCase());
    let letraComEspacos = musica.letra.split(" ").map(palavra => {
        // Remove chaves, vírgulas, pontos, interrogações, exclamações e converte para minúsculas
        let palavraLimpa = palavra.replace(/[{}.,?!]/g, "").toLowerCase();

        if (palavrasDisponiveis.includes(palavraLimpa)) {
            return `<span class="blank droppable" data-answer="${palavraLimpa}"
                    ondragover="allowDrop(event)" ondrop="dropWord(event)"></span>`;
        }
        return palavra;
    }).join(" ");

    lyricsContainer.innerHTML = letraComEspacos;
    
    // Preenche o word bank com as palavras arrastáveis
    const wordBank = document.getElementById("word-bank");
    wordBank.innerHTML = "";
    palavrasDisponiveis.forEach(palavra => {
        wordBank.innerHTML += `<span class="draggable" draggable="true" data-word="${palavra}" ondragstart="dragWord(event)">${palavra}</span>`;
    });
}

// Exibir letra no modo Escrevendo
function exibirLetraWrite(musica) {
    const lyricsContainer = document.getElementById("lyricsWrite");
    lyricsContainer.innerHTML = "";

    let palavrasDisponiveis = [...musica.palavras];
    let letraComEspacos = musica.letra.split(" ").map(palavra => {
        if (palavrasDisponiveis.includes(palavra.replace(/[{}]/g, ""))) {
            return `<span class="blank" data-answer="${palavra.replace(/[{}]/g, "")}">
                      <input type="text">
                    </span>`;
        }
        return palavra;
    }).join(" ");

    lyricsContainer.innerHTML = letraComEspacos;
}

// *** Funções para Drag and Drop ***

// Inicia o arraste: guarda o texto da palavra que está sendo arrastada
function dragWord(event) {
    event.dataTransfer.setData("text/plain", event.target.dataset.word);
}

// Permite que o drop aconteça (precisa prevenir o comportamento padrão)
function allowDrop(event) {
    event.preventDefault();
}

// Ao soltar, preenche a lacuna com a palavra arrastada e remove ela do word bank
function dropWord(event) {
    event.preventDefault();
    const droppedWord = event.dataTransfer.getData("text/plain");

    // Se a lacuna já estiver preenchida, não sobrescreve
    if (event.target.textContent.trim() === "") {
        event.target.textContent = droppedWord;
        event.target.classList.add("filled");

        /* Remove a palavra do banco para não permitir múltiplas inserções
        const wordBankEl = document.querySelector(`#word-bank [data-word="${droppedWord}"]`);
        if (wordBankEl) {
            wordBankEl.remove();
        }*/
    }
}

// Função para conferir se as respostas estão corretas
function checkAnswersDrag() {
    const blanks = document.querySelectorAll("#lyricsDrag .blank");
    let isCorrect = true;

    blanks.forEach(blank => {
        const respostaCorreta = blank.dataset.answer;
        if (blank.textContent.trim() !== respostaCorreta) {
            blank.classList.add("wrong"); // Adiciona classe para destacar erro (você pode definir o estilo no CSS)
            isCorrect = false;
        } else {
            blank.classList.remove("wrong");
        }
    });

    // Seleciona o container de feedback e limpa seu conteúdo anterior
    const feedbackContainer = document.getElementById("feedback");
    feedbackContainer.innerHTML = "";
        
    if (isCorrect) {
        feedbackContainer.innerHTML = `<p class="feedback success">\u{1F604} Parabéns! Você completou a música corretamente.</p>`;
    } else {
        feedbackContainer.innerHTML = `<p class="feedback error">\u{1F622} Algumas respostas estão incorretas. Tente novamente.</p>
                                       <button class="btn" onclick="tryAgain()">Try Again</button>`;
    }
}

// Função para reiniciar a tela de Drag and Drop com a mesma música
function tryAgain() {
    // Verifica se currentMusic está definida
    if (!currentMusic) {
        console.error("Nenhuma música atual definida!");
        return;
    }
    console.log("Reiniciando com a música:", currentMusic);

    // Limpa o container de feedback
    document.getElementById("feedback").innerHTML = "";
    
    // Reinicia o modo Drag and Drop com a mesma música
    exibirLetraDrag(currentMusic);
}


// Função para voltar para a tela inicial
function goBack() {
    document.getElementById("screen-home").style.display = "block";
    document.getElementById("screen-drag").style.display = "none";
    document.getElementById("screen-write").style.display = "none";
}

// Inicia o carregamento das músicas
carregarMusicas();

// Para que as funções de drag and drop sejam acessíveis via atributos HTML, anexa-as ao objeto window
window.dragWord = dragWord;
window.allowDrop = allowDrop;
window.dropWord = dropWord;
window.checkAnswersDrag = checkAnswersDrag;
window.goBack = goBack;
window.tryAgain = tryAgain;
