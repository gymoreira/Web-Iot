var awsIot = require('aws-iot-device-sdk');
const express = require('express');
const app = express();
const bodyParser = require('body-parser'); // Usado para obter os dados da hora e dia da semana no HTML
const fs = require('fs');


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


app.post('/', (req, res) => {
  console.log("pera")
  req.body.week
  req.body.hour
  //res.send("ola " + req.body.week + req.body.hour)
  device.publish('data', JSON.stringify({
    semana: req.body.week,
    horario: req.body.hour
  }))
  return res.redirect('/')
})

// 
app.post('/on', (req, res) => {
  console.log("on")
  device.publish('lamp', '1')
  return res.redirect('/') //Após o click no botão de ligar a página é redirecionada própria página principal

})

app.post('/off', (req, res) => {
  console.log("off")
  device.publish('lamp', '0')
  return res.redirect('/')
})


var device = awsIot.jobs({
  keyPath: 'tmp/01e7c0c317-private.pem.key',
  certPath: 'tmp/01e7c0c317-certificate.pem.crt',
  caPath: 'tmp/AmazonRootCA1.pem',
  clientId: 'NODEMCU',
  host: 'a1d0uhf3egac5n-ats.iot.us-east-1.amazonaws.com'
});

vectorTopic = ['state', 'alive', 'stateLamp']

//Conecta com o AWS IOT e se inscreve nos tópicos
device
  .on('connect', function () {
    console.log('connect');
    device.subscribe(vectorTopic[0]);
    device.subscribe(vectorTopic[1]);
    device.subscribe(vectorTopic[2]);
  })





let data;

// Atualizar o estado da lâmpada através da publicção recebida
let stateLamp  = ''
let stateNode = ''
let count = 0

device
  .on('message', function (topic, payload) {
    console.log('Tópico', topic, payload.toString());

    if (topic === 'state_esp') {
      // console.log(payload.toString())
      stateLamp = payload.toString()
    }

    //Verificar se o nodemcu está conectado ao aws recebendo publicações que avisa que está conectado
    if (topic === 'alive') {
      stateNode  = 'Online'
      console.log(stateNode)
      count = 0;
    }

    if (topic === 'stateLamp') {
      console.log("funciona")
      const update = JSON.stringify({
        state: payload.toString()
      })
      fs.writeFileSync('./data/state.json', update, 'utf-8')
     
    }
  });

// Lendo arquivo JSON



//Contagem para identificar se o Node MCU está conectado ou desconectado.
setInterval(function () {
  count += 1
 // console.log(count)
  if (count >= 15) {
    count = 0;
    stateNode  = 'Offline'
  }
}, 1000)

app.get('/', (req, res) => {
  data = JSON.parse(fs.readFileSync('./data/state.json', 'utf-8'))
  res.render("../views/index", {
    text:  stateNode,
    text2: data.state
  })
})


app.listen(process.env.PORT || 3000); //Definido a porta padrão do servidor