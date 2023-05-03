// Project : GPT4ALL-ui
// Author : ParisNeo
// Description :
// All websocket stuff can be found here.


var globals={
    is_generating:false,
    chatWindow:undefined,
    chatForm:undefined,
    userInput:undefined,
    stopGeneration:undefined,
    sendbtn:undefined,
    waitAnimation:undefined
}
  
var socket = io.connect('http://' + document.domain + ':' + location.port);

socket.on('connect', function() {
});
socket.on('disconnect', function() {
console.log("Disconnected")
});
socket.on('infos', function(msg) {
if(globals.user_msg){
    globals.user_msg.setSender(msg.user);
    globals.user_msg.setMessage(msg.message);
    globals.user_msg.setID(msg.id);
}
globals.bot_msg.setSender(msg.bot);
globals.bot_msg.setID(msg.response_id);
globals.bot_msg.messageTextElement.innerHTML    = `Generating answer. Please stand by...`;    
});

socket.on('waiter', function(msg) {
globals.bot_msg.messageTextElement.innerHTML    = `Generating answer. Please stand by...`;    
});

socket.on('message', function(msg) {
    text = msg.data;
    // For the other enrtries, these are just the text of the chatbot

    globals.bot_msg.messageTextElement.innerHTML    = marked.marked(text);
    // scroll to bottom of chat window
    globals.chatWindow.scrollTop                    = globals.chatWindow.scrollHeight;
});

socket.on('final',function(msg){
text = msg.data;
globals.bot_msg.hiddenElement.innerHTML         = text
globals.bot_msg.messageTextElement.innerHTML    = marked.marked(text)
globals.sendbtn.style.display="block";
globals.waitAnimation.style.display="none";
globals.stopGeneration.style.display = "none";
globals.is_generating = false 
});  

globals.socket = socket
globals.is_generating = false

function send_message(service_name, parameters){
    if(!globals.is_generating){
        globals.socket.emit(service_name, parameters);
        globals.is_generating = true
    }
}