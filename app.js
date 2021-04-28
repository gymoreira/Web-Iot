var awsIot = require('aws-iot-device-sdk');
const express = require('express'); // Bilioteca para criar um servidor
const app = express();
const bodyParser = require('body-parser'); // Usado para obter os dados da hora e dia da semana no HTML
const fs = require('fs');

let timer
let resultTimer = 0
let counting
let data; //Variável para ler o estado do arquivo (Somente a definição)
let stateNode = 'Carregando...'
let count = 0
let dataWeek
let horas;
let tempos;


// Template enginer como é chamado.
app.set('view engine', 'ejs')
app.use(bodyParser.urlencoded({
  extended: false
}))
app.use(bodyParser.json())

// Definindo as rotas estáticas 
app.use('/', express.static('/'))
app.use('/styles', express.static(__dirname + '/styles'))
app.use('/scripts', express.static(__dirname + '/scripts'))



var device = awsIot.jobs({
  keyPath: 'tmp/01e7c0c317-private.pem.key',
  certPath: 'tmp/01e7c0c317-certificate.pem.crt',
  caPath: 'tmp/AmazonRootCA1.pem',
  clientId: 'NODEMCU',
  host: 'a1d0uhf3egac5n-ats.iot.us-east-1.amazonaws.com'
});



/*******************************************************************************
 * Obtem os dados da semana e hora e armazena no arquivo store_Program
 */

app.post('/', (req, res) => {
  dataWeek = JSON.parse(fs.readFileSync('./data/store_Program.json', 'utf-8')) //Ler o arquivo e retorna no formato JSON
  dataWeek.push({
    "semana": req.body.week,
    "horario": req.body.hour
  }) // Adiciona na variável os conteúdos
  fs.writeFileSync('./data/store_Program.json', JSON.stringify(dataWeek), 'utf-8') //Escreve no arquivo com o novo objeto adicionado
  return res.redirect('/')
})
/*****************************************************************************/

// Através do método post usamos para poder enviar um publicação
// Aqui é enviado a publicação para a lâmpada ligar
/* Pega o horario que o user ligou a lampada e o armazena */

app.post('/on', (req, res) => {
  tempos = JSON.parse(fs.readFileSync('./data/tempos.json', 'utf-8')) //Ler o arquivo e retorna no formato JSON
  var datanow = new Date();
    var horario = Date.parse(datanow);// alterar datanow OU "April 24, 2021"
    if (tempos[0].tempo==0){
      tempos[0].tempo=horario
    }
  fs.writeFileSync('./data/tempos.json', JSON.stringify(tempos), 'utf-8') //Escreve no arquivo com o novo objeto adicionado
  console.log("on")
  OnOffLamp('l')
  return res.redirect('/') //Após o click no botão de ligar a página é redirecionada própria página principal

})

//Através do método post usamos para poder enviar um publicação 
// Aqui é enviado a publicação para a lâmpada desligar
/* Pega o horario que o user desligou a lampada e atuliza o consumo mensal */
app.post('/off', (req, res) => {
  if (tempos[0].tempo!=0){
    horas = JSON.parse(fs.readFileSync('./data/horas.json', 'utf-8')) //Ler o arquivo e retorna no formato JSON
    tempos = JSON.parse(fs.readFileSync('./data/tempos.json', 'utf-8')) //Ler o arquivo e retorna no formato JSON
    var datanow = new Date();
    var horario = Date.parse(datanow);// alterar datanow OU "April 24, 2021"
    var mesNumero = datanow.getMonth();
    var tempogasto = horas.hora[mesNumero]
    tempogasto += ((horario-tempos[0].tempo)/3600000);
    horas.hora[mesNumero] = tempogasto
    fs.writeFileSync('./data/horas.json', JSON.stringify(horas), 'utf-8') //Escreve no arquivo com o novo objeto adicionado
    tempos[0].tempo=0
    fs.writeFileSync('./data/tempos.json', JSON.stringify(tempos), 'utf-8') //Escreve no arquivo com o novo objeto adicionado
  }
  console.log("off")
  OnOffLamp('d')
  return res.redirect('/')
})


/**************************************************************************************************************
 * Através desse metódo post podemos obter os valores dos inputs com o tempo para setar o temporizador
 * 
 */

app.post('/timer', (req, res) => {
  
  timer = (parseInt(req.body.timer) * 60) + (parseInt(req.body.timer[3] + req.body.timer[4]))
  countTime(req.body.timerSelect[0]) // Obtem a primeira letra da palavra l = ligar , d = desliga
  return res.redirect('/')
})

function OnOffLamp(comand){
  if(comand === 'l'){
    device.publish('lamp', '1')  
  }else{
    device.publish('lamp', '0')
  }
}

//Função que decrementa a váriavel em segundos

function countTime(value) {
     counting = setInterval(() => {
    timer -= 1
    resultTimer = timer // A cada decremtento é atribuido para resultTimer para poder mostrar na tela o decremento
    console.log(timer)
    if (timer == 0) {
      OnOffLamp(value) // Chama a função para ligar ou desligar dependendo da mensagem
      stopTimer()     // Para a contagem. Nesse caso a contagem do temporizador
    }
  }, 1000)
}


function stopTimer(){
  clearInterval(counting)
}
/************************************************************************************************************** */

//Vetor com os tópicos inscritos
vectorTopic = ['state', 'alive', 'stateLamp']
//Conecta com o AWS IOT e se inscreve nos tópicos
device
  .on('connect', function () {
    console.log('connect');
    device.subscribe(vectorTopic[0]);
    device.subscribe(vectorTopic[1]);
    device.subscribe(vectorTopic[2]);
  })

//Função que recebe a publicação sempre que houver uma publicação
device
  .on('message', function (topic, payload) {
    //console.log('Tópico', topic, payload.toString());

    if (topic === 'state_esp') {
      stateLamp = payload.toString()
    }

    //Verificar se o nodemcu está conectado ao aws recebendo publicações que avisa que está conectado
    if (topic === 'alive') {
      stateNode = 'Online' //variável usada para mostrar o estado do node em tela
      count = 0; // Zerar o contado para que possa mater a informação de que o Node MCU está conectado
    }

    if (topic === 'stateLamp') {
      
      const update = JSON.stringify({
        state: payload.toString()
      })
      fs.writeFileSync('./data/state.json', update, 'utf-8') //Escrever o estado da lâmpada recebida na publicação
    }
  });


//Contagem para identificar se o Node MCU está conectado ou desconectado.
/**
 * Quando a decorrido o tempo de no máximo 15 segundo se não houver publicção do Node MCU é atribuida à variável 
 * o valor de offline que é mostrado na interface
 */
setInterval(function () {
  count += 1
  if (count >= 9) {
    count = 0;
    stateNode = 'Offline'
  }
}, 1000)


/**
* Essas variáveis estão sendo sempre alteradas. No text é mostrado o estado do Node MCU, text2 o estado da lâmpada
* e no text3 é resultado do temporizado que está decrementando 
*/

app.get('/', (req, res) => {
  horas = JSON.parse(fs.readFileSync('./data/horas.json', 'utf-8')) //Ler o arquivo e retorna no formato JSON
  data = JSON.parse(fs.readFileSync('./data/state.json', 'utf-8')) // Lendo arquivo JSON com o estado da lâmpada
  res.render("../views/index", {
    text: stateNode,
    text2: data.state,
    texto3: resultTimer,
    hr0: (horas.hora[0] * 10).toFixed(2),
    vl0: (horas.hora[0] * 0.003).toFixed(6),
    hr1: (horas.hora[1] * 10).toFixed(2),
    vl1: (horas.hora[1] * 0.003).toFixed(6),
    hr2: (horas.hora[2] * 10).toFixed(2),
    vl2: (horas.hora[2] * 0.003).toFixed(6),
    hr3: (horas.hora[3] * 10).toFixed(2),
    vl3: (horas.hora[3] * 0.003).toFixed(6),
    hr4: (horas.hora[4] * 10).toFixed(2),
    vl4: (horas.hora[4] * 0.003).toFixed(6),
    hr5: (horas.hora[5] * 10).toFixed(2),
    vl5: (horas.hora[5] * 0.003).toFixed(6),
    hr6: (horas.hora[6] * 10).toFixed(2),
    vl6: (horas.hora[6] * 0.003).toFixed(6),
    hr7: (horas.hora[7] * 10).toFixed(2),
    vl7: (horas.hora[7] * 0.003).toFixed(6),
    hr8: (horas.hora[8] * 10).toFixed(2),
    vl8: (horas.hora[8] * 0.003).toFixed(6),
    hr9: (horas.hora[9] * 10).toFixed(2),
    vl9: (horas.hora[9] * 0.003).toFixed(6),
    hr10: (horas.hora[10] * 10).toFixed(2),
    vl10: (horas.hora[10] * 0.003).toFixed(6),
    hr11: (horas.hora[11] * 10).toFixed(2),
    vl11: (horas.hora[11] * 0.003).toFixed(6)
  })
})

app.listen(process.env.PORT || 3000); //Definido a porta padrão do servidor