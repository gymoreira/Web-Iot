var horas = new Array();
var mes = [0,0,0,0,0,0,0,0,0,0,0,0];
var months = ["JANEIRO","FEVEREIRO","MARÇO","ABRIL","MAIO","JUNHO","JULHO","AGOSTO","SETEMBRO","OUTUBRO","NOVEMBRO ","DEZEMBRO"];

const Status = {
    on() {
        console.log('Ligar')
        document.getElementById('lamp').style.backgroundColor = 'yellow'
        ligarConsumo()
    },
    off() {
        console.log('Desligar')
        document.getElementById('lamp').style.backgroundColor = 'gray'
        limpaTable()
        desligarConsumo()
    }
}

setInterval(function () {
    const stateLamp = document.getElementById('stateLamp').innerText
    //console.log(color)

    if (stateLamp === 'l') {
        document.getElementById('lamp').style.backgroundColor = 'yellow'
        
    } else if (stateLamp === 'd') {
        document.getElementById('lamp').style.backgroundColor = 'rgb(59, 59, 2)'
        
    }else{
        document.getElementById('lamp').style.backgroundColor = 'gray'
        
    }
},50)

function delay(){
    setTimeout(()=>{
        location.reload()
    }, 1000);
}

/*
const bnt = document.getElementById('On');
bnt.addEventListener('click', function(e){
    e.preventDefault();
    console.log('Ligar')
    document.getElementById('lamp').style.backgroundColor= 'yellow'
})
*/

// Mostrar ou retirar da tela a parte de programação
const Schedule = {
    open(){
        document.querySelector('.schedule-program').classList.add('active')
        console.log("SSSSS")
       
    },
    close(){
       document.querySelector('.schedule-program').classList.remove('active')
        console.log("fechando")
    }
}

//Obter o dia da semana e a hora
const botao =  document.getElementById('save')

botao.addEventListener('click', (e)=>{
    //const select = document.getElementById('input[type="radio"]:checked')
    //console.log(select.value)
   
    console.log("sdsddasfd")
})


//ligarConsumo()//deixar essa linha comentada se o sistema vai assumir que ele inicia com a lampada apagada.
/* Pega o horario que o user ligou a lampada e o armazena */
function ligarConsumo() {
    var datanow = new Date();
    // botao Ligar
    var horario = Date.parse(datanow);// alterar datanow OU "April 24, 2021"
    if (horas.length==0){
        //botao Desligar
        horas.push(horario);
    }    
}
/* Pega o horario que o user desligou a lampada e atuliza o consumo mensal */
function desligarConsumo(){
    var datanow = new Date();
    // botao Ligar
    var horario = Date.parse(datanow);// alterar datanow OU "April 24, 2021"
    var mesNumero = datanow.getMonth();
    //var test = Date.parse("April 24, 2021");// test
    //horas.push(test); //test
    if (horas.length==1){
        //botao Desligar
        horas.push(horario);
        var tempogasto = (horas[1]-horas[0])/3600000;
        mes[mesNumero]+=tempogasto;
        horas.shift();
        horas.shift();
    }
    gerarTable();
}
  
gerarTable();
//gera a tabela com o consumo atualizado
function gerarTable() {
    for (i = 0; i < 12; i++) {
    var tabela = document.getElementById('consumo');
    var numeroLinhas = tabela.rows.length;
    var linha = tabela.insertRow(numeroLinhas);
    var celula1 = linha.insertCell(0);
    var celula2 = linha.insertCell(1);   
    var celula3 = linha.insertCell(2);
    
    celula1.innerHTML = months[i]; 
    celula2.innerHTML =  mes[i].toFixed(2); 
    celula3.innerHTML =  (mes[i] * 0.82).toFixed(6);
}
}
// Apaga a tabela com as informações antigas
function limpaTable() {
    for (i = 0; i < 12; i++) {
    document.getElementById('consumo').deleteRow(1);
    }
  }