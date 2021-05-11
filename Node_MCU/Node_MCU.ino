#include <ESP8266WiFi.h> //Para utilizar o esp com wifi
#include <PubSubClient.h> // Conecatar ao AWS IoT Core usando o endpint
extern "C" {
#include "libb64/cdecode.h"
}
#include <restricted.h> // Onde estão definidos os dados sensíveis do wifi e certificado , chave e root da AWS IOT Core
#include <WiFiUdp.h> 
#include <NTPClient.h>


//Definindo o cliente para conectar ao AWS
WiFiClientSecure wiFiClient;

WiFiUDP ntpUDP;
  
// cliente ntp, servidor do horário no Brasil, o fuso horário do Brasil -3 * 3600(s) = 3 horas
NTPClient timeClient(ntpUDP, "c.st1.ntp.br", -3 * 3600, 60000);

void msgReceived(char* topic, byte* payload, unsigned int len);
PubSubClient pubSubClient(AWS_ENDPOINT, 8883, msgReceived, wiFiClient);


#define swapState  D3    //Definido o botão para pull-up no próprio node mcu 

char StateLamp  = 'd'; //Indica que está ligado, pois foi acordado que sempre quando iniciar o node ele já indica o estado de ligado
char _on = '0';
char _off= '1';
char* topico2 = "lamp";

// Função identifica a chegada de novas publicações e exibe a msg no monitor serial
void msgReceived(char* topic, byte* payload, unsigned int length) {
  Serial.print("Message received on "); Serial.print(topic); Serial.print(": ");
  for (int i = 0; i < length; i++) {
    Serial.print((char)payload[i]);
  }
   Serial.print("O topico é: "); Serial.println(topic);
  if(topico2 == "lamp"){
    if(_on == payload[0]){
       digitalWrite(2, HIGH);
       StateLamp  = 'd';
       pubSubClient.publish("stateLamp", &StateLamp ); // Publica o estado da lâmpada
     }else if(_off == payload[0]){
       digitalWrite(2,LOW);
       StateLamp  = 'l';
       pubSubClient.publish("stateLamp", &StateLamp ); // Publica o estado da lâmpada
     }
   }
 }



void setCurrentTime() {
  configTime(3 * 3600, 0, "br.pool.ntp.org", "time.nist.gov");
  Serial.print("Waiting for NTP time sync: ");
  time_t now = time(nullptr);
  Serial.print("Now: ");Serial.println(now);
  while (now < 8 * 3600 * 2) {
    delay(500);
    Serial.print(".");
    now = time(nullptr);
    Serial.println("");
    Serial.print("time_t: ");Serial.println(now);
  }
  Serial.println("");
  struct tm timeinfo;
  gmtime_r(&now, &timeinfo);
  Serial.print("Current time: "); Serial.print(asctime(&timeinfo));
}


//Decodifica o certificado, chave e root
int b64decode(String b64Text, uint8_t* output) {
  base64_decodestate s;
  base64_init_decodestate(&s);
  int cnt = base64_decode_block(b64Text.c_str(), b64Text.length(), (char*)output, &s);
  return cnt;
}


// Conecta o cliente com o AWS IOT Core para poder usar o MQTT
void pubSubCheckConnect() {
  if ( ! pubSubClient.connected()) {
    Serial.print("PubSubClient connecting to: "); Serial.print(AWS_ENDPOINT);
    while ( ! pubSubClient.connected()) {
      Serial.println("");
      Serial.print(".");
      pubSubClient.connect("esp8266-lampada");
    }
    //Publica ao conectar indicando que se conectou, e o estado da lâmpada
    pubSubClient.publish("alive", "1");
    pubSubClient.publish("stateLamp", &StateLamp ); 
    Serial.println(" connected");
    pubSubClient.subscribe("lamp");
  }
  
}

// Conexão com o wifi local
void connectWifi(){
  Serial.begin(115200); // Para usar o monitor serial e observar os dados sendo exibidos
  Serial.println("");   
  Serial.println("ESP8266 AWS IoT Example");
  Serial.print("Connecting to "); Serial.print(SSID_LOC);
  WiFi.begin(SSID_LOC, PASSWORD_WIFI);   //Dados do wifi(nome, senha)
  Serial.println(WiFi.waitForConnectResult());
  Serial.print(", WiFi connected, IP address: "); Serial.println(WiFi.localIP());
}

void decoder(){
  uint8_t binaryCert[certificatePemCrt.length() * 3 / 4];
  int len = b64decode(certificatePemCrt, binaryCert);
  wiFiClient.setCertificate(binaryCert, len);
  uint8_t binaryPrivate[privatePemKey.length() * 3 / 4];
  len = b64decode(privatePemKey, binaryPrivate);
  wiFiClient.setPrivateKey(binaryPrivate, len);
  uint8_t binaryCA[caPemCrt.length() * 3 / 4];
  len = b64decode(caPemCrt, binaryCA);
  wiFiClient.setCACert(binaryCA, len);
}

/* A cada intervalo de e 15 segundos envia um publicação
para informar à aplicação web que o dispositivo está online*/
void heartBeat(int sec){
  if(sec == 0 || sec == 15  || sec == 30 || sec == 45){
    pubSubClient.publish("alive", "1"); //Publicação o para poder resetar o contador da aplicação web, indicando que está conectado
    pubSubClient.publish("stateLamp", &StateLamp ); // Publica o estado da lâmpada
  } 
}


// Função que utiliza o botão flash da placa como um interruptor.
void interrupter(){
  if(digitalRead(swapState) == LOW){
    digitalWrite(2, !digitalRead(2));
    if(StateLamp  == 'd'){
      StateLamp = 'l';
      pubSubClient.publish("stateLamp", &StateLamp );
    }else {
      StateLamp = 'd';
      pubSubClient.publish("stateLamp", &StateLamp );
    }
  }
}


/* Configuração incial*/
void setup() {
  pinMode(2, OUTPUT);
  pinMode(swapState, INPUT_PULLUP);
  digitalWrite(2,HIGH);  // A lâmpada sempre inicia ligada
  connectWifi();          // conectar ao wifi
  setCurrentTime();       // Sincronização do tempo para iniciar a conexão com o aws
  timeClient.begin();     //Iniciar o cliente NTP para obter hora atual
  decoder();             
}


void loop() {
   pubSubCheckConnect(); 
   timeClient.update(); // Atualiza a hora
   heartBeat(timeClient.getSeconds()); // Passa como parâmetro o segundo no momento
   pubSubClient.loop(); //Executa funções internas para identificar novas publicações recebidas
   interrupter();
   delay(1000);
}
