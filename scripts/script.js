

const Status = {
    on() {
        console.log('Ligar')
        document.getElementById('lamp').style.backgroundColor= 'yellow'
    },
    off() {
        console.log('Desligar')
        document.getElementById('lamp').style.backgroundColor= 'gray'

    }
}

//Obter os dados da hora
const Data = {
    date: document.querySelector('input#hour'),
    getvalues(){
            date: Data.date.value
           
    },
    printar(){
        console.log(typeof(Data.date.value))
    }
}



var state_lamp = 'on'
const  day_week = 'segunda-feira'
const data = '23'
const hour = '10'
const minute = '50'