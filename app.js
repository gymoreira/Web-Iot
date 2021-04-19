var awsIot = require('aws-iot-device-sdk');

//
// Replace the values of '<YourUniqueClientIdentifier>' and '<YourCustomEndpoint>'
// with a unique client identifier and custom host endpoint provided in AWS IoT.
// NOTE: client identifiers must be unique within your AWS account; if a client attempts
// to connect with a client identifier which is already in use, the existing
// connection will be terminated.
//
var device = awsIot.device({
   keyPath: 'tmp/01e7c0c317-private.pem.key',
  certPath: 'tmp/01e7c0c317-certificate.pem.crt',
    caPath: 'tmp/AmazonRootCA1.pem',
  clientId: 'YourUniqueClientIdentifier',
      host: 'a1d0uhf3egac5n-ats.iot.us-east-1.amazonaws.com'
});

//
// Device is an instance returned by mqtt.Client(), see mqtt.js for full
// documentation.
//
device
  .on('connect', function() {
    console.log('connect');
    device.subscribe('topic_1');
    device.publish('topic_2', JSON.stringify({ test_data: 1}));
  });

device
  .on('message', function(topic, payload) {
    console.log('message', topic, payload.toString());
  });


const express = require('express');
const app = express();
 
// Definidos as rotas das páginas estáticas
app.use(express.static('styles'))
app.use('/styles',express.static(__dirname + '/styles'))
app.use('/scripts',express.static(__dirname + '/scripts'))
 
app.get('',(req,res) => {
 res.sendFile(__dirname + '/index.html')
})


app.listen(process.env.port || 3000);
