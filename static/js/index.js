function stopOldStream() {
    // Remove qualquer <img> com id 'lousa' (usado nos templates lousa.html e arduino.html)
    const oldImg = document.getElementById('lousa');
    if (oldImg) {
        // Remove o src para parar o stream
        oldImg.src = '';
        // Remove o elemento do DOM
        oldImg.remove();
    }
}

function loadContent(id) {
    stopOldStream();
    if (id === 1) {
        fetch('/arduino')
        .then(response => response.text())
        .then(html => {
            document.getElementById('content').innerHTML = html;
        });
    }
    else if (id === 2) {
        fetch('/lousa')
        .then(response => response.text())
        .then(html => {
            document.getElementById('content').innerHTML = html;
        });
    }
    else if (id === 3) {
        fetch('/jokenpo')
        .then(response => response.text())
        .then(html => {
            document.getElementById('content').innerHTML = html;
        });
    }
    else {
        fetch(`/conteudo/${id}`)
        .then(response => response.json())
        .then(data => {
            document.getElementById('content').innerHTML = `<p>${data.conteudo}</p>`;
        });
    }
}