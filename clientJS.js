// const socket = io();
const socketio = io.connect();

let username;
let currentRoomId;


Window.onload = onLoadFunction();

function onLoadFunction() {

    document.getElementById("mainArea").style.display = 'none';
    document.getElementById("setUsername").style.display= 'block';

    document.getElementById("usernameButton").addEventListener("click", setUsername, false);

}

function setUsername() {

    usernameEntry = document.getElementById("username").value + "";

    if(usernameEntry == "") {
        alert("Username Required");
    }
    else {
        username = usernameEntry;


        document.getElementById("mainArea").style.display = 'flex';
        document.getElementById("setUsername").style.display= 'none';

        setEventListeners();


    }
}


//Event listeners to join a room or create a room
function setEventListeners() {

    document.getElementById("createRoomButton").addEventListener('click', createRoom, false);

    //add join room eventListeners


}

function createRoom() {

    document.getElementById("roomMessages").innerHTML = "";

    let createRoomName = document.getElementById("roomNameText").value + "";
    let createRoomPassword = document.getElementById("roomPasswordText").value + "";

    socketio.emit("create_room_request", {createRoomName: createRoomName, createRoomPassword: createRoomPassword});

    document.getElementById("sendButton").addEventListener('click', sendRoomMessage, false);


}

socketio.on('roomMessage', (data) => {
    if(data.sender == username) {
        return;
    }

    document.getElementById('roomMessages').innerHTML += '<div class="message">' + data.sender + ": " + data.message + '</div>';

    currentRoomId = data.roomId;
});

function sendRoomMessage() {

    let messageContent = document.getElementById("sendMessageText").value; 

    socketio.emit("clientRoomMessage", {roomId: currentRoomId, username: username, message: messageContent});

}

socketio.on('messageAccepted', (data) => {

    document.getElementById('roomMessages').innerHTML += '<div class="userMessage">' + data.message + '</div>'

});

socketio.on('roomList', (data) => {

    alert(data);

    document.getElementById('roomMessages').innerHTML += '<div class="userMessage">' + data.message + '</div>'

});