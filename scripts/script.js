function initalState() {
    const stateESP = document.getElementById('stateESP').innerText
    if (stateESP !== 'Online') {
        document.getElementById('on').disabled = true
        document.getElementById('off').disabled = true
    } else {
        document.getElementById('on').disabled = false
        document.getElementById('off').disabled = false
    }
}

setInterval(()=>{
    const stateLamp = document.getElementById('stateLamp').innerText
    const disabledButtonTimer = document.getElementById('timerResult').innerText
    

    if (disabledButtonTimer === '0') {
        document.getElementById('initTimer').disabled = false
    } else document.getElementById('initTimer').disabled = true


    if (stateLamp === 'l') {
        document.getElementById('lamp').style.backgroundColor = 'yellow'

    } else if (stateLamp === 'd') {
        document.getElementById('lamp').style.backgroundColor = 'rgb(59, 59, 2)'

    } else {
        document.getElementById('lamp').style.backgroundColor = 'gray'
    }
    initalState() //Desbilitar ou habilita os botões quando desconectado ou iniciando a conexão

    // Atualiza os valores do servido na página
    $('#stateESP').load(window.location.href + " " + '#stateESP');
    $('#stateLamp').load(window.location.href + " " + '#stateLamp');
    $('#timerResult').load(window.location.href + " " + '#timerResult')
    
},100)




// Mostrar ou retirar da tela a parte de programação ao clicar no botão
const Schedule = {
    open() {
        document.querySelector('.schedule-week').classList.add('active')
    },
    close() {
        document.querySelector('.schedule-week').classList.remove('active')
    }
}