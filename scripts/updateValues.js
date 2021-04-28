setInterval(() => {
       
    $('#stateESP').load(window.location.href + " " + '#stateESP');
    $('#stateLamp').load(window.location.href + " " + '#stateLamp');
    
}, 700);

setInterval(() => {
    $('#timerResult').load(window.location.href + " " + '#timerResult')
}, 1000);

   

//console.log(window.location.href)