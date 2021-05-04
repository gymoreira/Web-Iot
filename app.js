var awsIot = require('aws-iot-device-sdk');
const express = require('express'); // Bilioteca para criar um servidor
const app = express();
const bodyParser = require('body-parser'); // Usado para obter os dados da hora e dia da semana no HTML
const fs = require('fs');

let horas;
let timer = 0
let comandLamp
let counting
vectorTopic = ['state', 'alive', 'stateLamp'] //Vetor com os tópicos inscritos
let data; //Variável para ler o estado da lâmpada dentro do arquivo 
let stateNode = 'Carregando...'
let count = 0

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

const operationJSON = {
  write(json, data) {
    fs.writeFileSync(`./data/${json}.json`, JSON.stringify(data), 'utf-8')
  },
  read(json) {
    return JSON.parse(fs.readFileSync(`./data/${json}.json`, 'utf-8'))
  },
  delete(positon) {
    let data = this.read('store_Program');
    data.splice(positon, 1);
    this.write('store_Program', data);
  }
}

let statebutton = 0;
const publish = {
  onLamp() {
    if (statebutton == 0) {
    device.publish('lamp', '1');
      calculateTime.start();
      statebutton = 1;
    }
  },

  offLamp() {
    if (statebutton == 1) {
      device.publish('lamp', '0');
      calculateTime.end();
      statebutton = 0;
    }
  }
}

const calculateTime = {
  start() {
    let tempos = operationJSON.read('tempos'); //Ler o arquivo e retorna no formato JSON
    var datanow = convertUTC();
    var horario = Date.parse(datanow); // alterar datanow OU "April 24, 2021"
    if (tempos[0].tempo == 0) {
      tempos[0].tempo = horario
    }
    operationJSON.write('tempos', tempos); //Escreve no arquivo com o novo objeto adicionado
  },
  end() {
    let tempos = operationJSON.read('tempos') //Ler o arquivo e retorna no formato JSON
    if (tempos[0].tempo != 0) {
      let horas = operationJSON.read('horas') //Ler o arquivo e retorna no formato JSON
      var datanow = convertUTC();
      var horario = Date.parse(datanow); // alterar datanow OU "April 24, 2021"
      var mesNumero = datanow.getMonth();
      var tempogasto = horas.hora[mesNumero]
      tempogasto += ((horario - tempos[0].tempo) / 3600000);
      horas.hora[mesNumero] = tempogasto
      operationJSON.write('horas', horas) //Escreve no arquivo com o novo objeto adicionado
      tempos[0].tempo = 0
      operationJSON.write('tempos', tempos) //Escreve no arquivo com o novo objeto adicionado

    }
  }
}

/*******************************************************************************
 * Obtem os dados da semana e hora e armazena no arquivo store_Program
 */
app.post('/', (req, res) => {
  let day
  let getData = {
    "week": req.body.week,
    "hour": req.body.hour,
    "action": req.body.selectState
  }
  day = operationJSON.read('store_Program') //Ler o arquivo e retorna no formato JSON
  day.push(getData)
  operationJSON.write('store_Program', day) //Escreve no arquivo com o novo objeto adicionado 
  copyJSONProgram();
  return res.redirect('/')
})

// Através do método post usamos para poder enviar um publicação
// Aqui é enviado a publicação para a lâmpada ligar
app.post('/on', (req, res) => {
  console.log("on")
  publish.onLamp()
  return res.redirect('/') //Após o click no botão de ligar a página é redirecionada própria página principal

})

//Através do método post usamos para poder enviar um publicação 
// Aqui é enviado a publicação para a lâmpada desligar
app.post('/off', (req, res) => {
  console.log("off")
  publish.offLamp()
  return res.redirect('/')
})

app.post('/delete', (req, res) => {
  operationJSON.delete(parseInt(req.body.positionDelete))
  copyJSONProgram() // Rescrever no arquivo os valores alterando-os para mostrar na tela
  return res.redirect('/');
})
function runProgram() {
  let time = 1000;
  let date = new Date();
  let brweek
  let brhour
  if (date.getUTCHours()<3){
    brweek = date.getUTCDay() - 1;
    if(date.getUTCHours()==2){
      brhour=23
    }
    if(date.getUTCHours()==1){
      brhour=22
    }
    if(date.getUTCHours()==0){
      brhour=21
    }
  } else {
    brhour=date.getUTCHours()-3
    brweek = date.getUTCDay()
  }
  let temp = operationJSON.read('store_Program');
  if (temp[0] == null) {
  } else {
    for (i in temp) {
      let array = temp[i].hour.split(':'); //Retirar os ':' da hora e retora um array com as palavra separadas em cada posição
      if (brweek.toString() === temp[i].week) {
        console.log("oxe, porra")
        console.log(brweek)
        if (brhour == parseInt(array[0]) && date.getMinutes() == parseInt(array[1])) {
          console.log("ta louco nao pq?")
          time = 60000
          temp[i].action === '1' ? publish.onLamp() : publish.offLamp();
        } else time = 1000;
      }
    }
  }
  repeat = setTimeout(runProgram, time);
}

/**************************************************************************************************************
 * Através desse metódo post podemos obter os valores dos inputs com o tempo para setar o temporizador
 * 
 */
app.post('/timer', (req, res) => {
  timer = (parseInt(req.body.timer) * 60 * 60) + (parseInt(req.body.timer[3] + req.body.timer[4]))
  if (timer>0){   
    comandLamp = req.body.timerSelect[0]
    setTimeout(() => {
      countTime() // Obtem a primeira letra da palavra l = ligar , d = desliga
    }, 1000)
    return res.redirect('/')
  }
})

//Função que decrementa a váriavel do temporizador
function countTime() {  
  timer -= 1
  counting = setTimeout(countTime, 1000);
  if (timer == 0) {
    if (comandLamp === 'l') {
      publish.onLamp()
    } else publish.offLamp()
    clearTimeout(counting)
  }
}

/************************************************************************************************************** */
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

  //Verificar se o nodemcu está conectado ao aws recebendo publicações que avisa que está conectado
  if (topic === 'alive') {
    count = 0; // Zerar o contado para que possa mater a informação de que o Node MCU está conectado
    stateNode = 'Online' //variável usada para mostrar o estado do node em tela
  }
  if (topic === 'stateLamp') {
    let getStateLamp = payload.toString();
    if (getStateLamp === 'l') {
      calculateTime.start();
      statebutton = 1;
    } else {
      calculateTime.end();
      statebutton = 0;
    }
    const update = {
      state: getStateLamp
    }
    operationJSON.write('state', update); //Escrever o estado da lâmpada recebida na publicação
  }
});

/**
*Contagem para identificar se o Node MCU está conectado ou desconectado.
* Quando a decorrido o tempo de no máximo 15 segundo se não houver publicção do Node MCU é atribuida à variável 
* o valor de offline que é mostrado na interface
*/
setInterval(function () {
count += 1
if (count > 40) {
  count = 0;
  stateNode = 'Offline';
}
}, 1000)
setTimeout(() => {
//colocar a funcao de verificar se é o dia posterior ou nao para poder executar só uma vez
}, 10)

function copyJSONProgram() {
let read = operationJSON.read('store_Program');
let dayWeek = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
for (i in read) {
  read[i].week = dayWeek[read[i].week];

  read[i].action === '1' ? read[i].action = 'Ligar' : read[i].action = 'Desligar';

}
operationJSON.write('copy_Program', read);
}

function convertUTC() {
return new Date(new Date().getTime() - 180 * 60 * 1000)
}

/**
* Essas variáveis estão sendo sempre alteradas. No text é mostrado o estado do Node MCU, text2 o estado da lâmpada
* e no text3 é resultado do temporizado que está decrementando 
*/
app.get('/', (req, res) => {
data = operationJSON.read('state'); // Ler o arquivo JSON com o estado da lâmpada
horas = operationJSON.read('horas'); //Ler o arquivo e retorna no formato JSON
let dataCopy = operationJSON.read('copy_Program');
res.render("../views/index", {
  showData: dataCopy,
  text: stateNode,
  text2: data.state,
  texto3: timer,
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

/***************************** Chamada das funções *************************/
runProgram();
copyJSONProgram();
/**************************************************************************/

app.listen(process.env.PORT || 3000); //Definido a porta padrão do servidor