import { getMusicas } from "./firebase.js";

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

let currentMusic = null;

function carregarMusica(musica) {
    currentMusic = musica;
    document.getElementById("screen-home").style.display = "none";

    if (musica.tipo === "drag") {
        document.getElementById("screen-drag").style.display = "block";
        exibirLetraDrag(musica);
        exibirYoutubePlayer(musica);
    } else {
        document.getElementById("screen-write").style.display = "block";
        exibirLetraWrite(musica);
    }
}

function formatLyricsEveryNWords(lyrics, n) {
    const words = lyrics.split(" ");
    let formattedLyrics = "";

    words.forEach((word, index) => {
        formattedLyrics += word + " ";
        if ((index + 1) % n === 0) {
            formattedLyrics += "\n";
        }
    });
    return formattedLyrics;
}

function exibirLetraDrag(musica) {
    const lyricsContainer = document.getElementById("lyricsDrag");
    lyricsContainer.innerHTML = "";

    let palavrasDisponiveis = musica.palavras.map(p => p.toLowerCase());
    // Insere quebras de linha a cada n palavras
    const letraFormatada = formatLyricsEveryNWords(musica.letra, 4);
    let linhas = letraFormatada.split("\n");

    let letraComEspacos = linhas.map(linha => {
        return linha.split(" ").map(palavra => {
            // Remove chaves, vírgulas, pontos, interrogações, exclamações e converte para minúsculas
            let palavraLimpa = palavra.replace(/[{}.,?!]/g, "").toLowerCase();

            if (palavrasDisponiveis.includes(palavraLimpa)) {
                return `<span class="blank droppable" data-answer="${palavraLimpa}"
                        ondragover="allowDrop(event)" ondrop="dropWord(event)"></span>`;
            }
            return palavra;
        }).join(" ");
    }).join("<br>");

    lyricsContainer.innerHTML = letraComEspacos;
    
    const wordCount = {};
    musica.letra.split(" ").forEach(word => {
        let wordClean = word.replace(/[{}.,?!]/g, "").toLowerCase();
        if (palavrasDisponiveis.includes(wordClean)) {
            wordCount[wordClean] = (wordCount[wordClean] || 0) + 1;
        }
    });

    const wordBank = document.getElementById("word-bank");
    wordBank.innerHTML = "";
    for (let palavra in wordCount) {
        for (let i = 0; i < wordCount[palavra]; i++) {
            wordBank.innerHTML += `<span class="draggable" draggable="true" data-word="${palavra}" ondragstart="dragWord(event)">${palavra}</span>`;
        }
    }
}

function extrairVideoId(url) {
    const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[7].length === 11) ? match[7] : null;
}

function exibirYoutubePlayer(musica) {
    const playerContainer = document.getElementById("player-container");
    playerContainer.innerHTML = ""; 

    if (musica.URL) {

        const videoId = extrairVideoId(musica.URL);
        if (!videoId) {
            console.error("ID do vídeo não encontrado!");
            return;
        }
    
        const embedUrl = `https://www.youtube.com/embed/${videoId}`;
        const iframe = document.createElement("iframe");
        iframe.setAttribute("width", "560");
        iframe.setAttribute("height", "315");
        iframe.setAttribute("src", embedUrl);
        iframe.setAttribute("frameborder", "0");
        iframe.setAttribute("allow", "accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture");
        iframe.setAttribute("allowfullscreen", "true");

        playerContainer.appendChild(iframe);
    }
}
  
function dragWord(event) {
    event.dataTransfer.setData("application/my-word", event.target.dataset.word);
    event.dataTransfer.effectAllowed = "copy";
}
function allowDrop(event) {
    event.preventDefault();
}

function dropWord(event) {
    event.preventDefault();
    const dropTarget = event.currentTarget;
    const droppedWord = event.dataTransfer.getData("application/my-word");

    if (!droppedWord) {
        return;
    }
    
    if (!dropTarget.querySelector('.dropped-word')) {

        const span = document.createElement('span');
        span.textContent = droppedWord;
        span.className = 'dropped-word';

        span.onclick = () => {
            span.remove();
            // Recria o elemento "draggable" 
            const wordBank = document.getElementById('word-bank');
            const novoElemento = document.createElement('span');
            novoElemento.textContent = droppedWord;
            novoElemento.className = 'draggable';
            novoElemento.setAttribute('draggable', 'true');
            novoElemento.dataset.word = droppedWord;
            novoElemento.ondragstart = dragWord;
            wordBank.appendChild(novoElemento);
        };
        dropTarget.appendChild(span);

        const wordBankEl = document.querySelector(`#word-bank [data-word="${droppedWord}"]`);
        if (wordBankEl) {
            wordBankEl.remove();
        }
    }
}

function checkAnswersDrag() {
    const blanks = document.querySelectorAll("#lyricsDrag .blank");
    let isCorrect = true;

    blanks.forEach(blank => {
        const respostaCorreta = blank.dataset.answer;
        if (blank.textContent.trim() !== respostaCorreta) {
            blank.classList.add("wrong");
            isCorrect = false;
        } else {
            blank.classList.remove("wrong");
        }
    });

    const feedbackContainer = document.getElementById("feedback");
    feedbackContainer.innerHTML = "";
        
    if (isCorrect) {
        feedbackContainer.innerHTML = `<p class="feedback success">\u{1F604} Parabéns! Você completou a música corretamente.</p>`;
    } else {
        feedbackContainer.innerHTML = `<p class="feedback error">\u{1F622} Algumas respostas estão incorretas. Tente novamente.</p>
                                       <button class="btn" onclick="tryAgain()">Try Again</button>`;
    }
}

function tryAgain() {
    if (!currentMusic) {
        console.error("Nenhuma música atual definida!");
        return;
    }
    console.log("Reiniciando com a música:", currentMusic);

    document.getElementById("feedback").innerHTML = "";
    
    exibirLetraDrag(currentMusic);
}

function goBack() {
    document.getElementById("screen-home").style.display = "block";
    document.getElementById("screen-drag").style.display = "none";
}

carregarMusicas();

window.dragWord = dragWord;
window.allowDrop = allowDrop;
window.dropWord = dropWord;
window.checkAnswersDrag = checkAnswersDrag;
window.goBack = goBack;
window.tryAgain = tryAgain;
