const socket = io();


let username;

var socketio = io.connect();




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

    let createRoomName = document.getElementById("roomNameText").value + "";
    let createRoomPassword = document.getElementById("roomPasswordText").value + "";

    socketio.emit("create_room_request", {createRoomName: createRoomName, createRoomPassword: createRoomPassword});

    alert(createRoomName + " " + createRoomPassword);
}

socketio.on('roomMessage', (data) => {
    alert(data.roomId + " " + data.message);

});