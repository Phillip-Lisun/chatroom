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
        document.getElementById("chatBox").style.display = 'none';
        document.getElementById("availRooms").style.display='block';
        document.getElementById("currUsers").style.display = 'none';


        setCreateListener();
        //setJoinListeners();


    }
}


//Event listeners to join a room or create a room
function setCreateListener() {

    document.getElementById("createRoomButton").addEventListener('click', createRoom, false);


}

function setJoinListeners() {

    console.log("in setJoinListeners");

    let roomElements = document.getElementsByClassName('roomName');

    for(let i = 0; i < roomElements.length; i++) {

        roomElements[i].addEventListener('click', e=> {

            let roomId = e.target.id;
            joinRoom(roomId);

        });


    }



}

function createRoom() {

    document.getElementById("roomMessages").innerHTML = "";

    let createRoomName = document.getElementById("roomNameText").value + "";
    let createRoomPassword = document.getElementById("roomPasswordText").value + "";

    socketio.emit("create_room_request", {createRoomName: createRoomName, createRoomPassword: createRoomPassword});

    document.getElementById("sendButton").addEventListener('click', sendRoomMessage, false);

    document.getElementById("chatBox").style.display = 'block';
    document.getElementById("availRooms").style.display='none';
    document.getElementById("currUsers").style.display = 'block';

    document.getElementById("backButton").addEventListener("click", showAvailRooms, false);


}

function joinRoom(roomId) {

    socketio.emit("join_room_request", {roomId: roomId, username: username});

    currentRoomId = roomId;

    document.getElementById("sendButton").addEventListener('click', sendRoomMessage, false);

    document.getElementById("chatBox").style.display = 'block';
    document.getElementById("availRooms").style.display='none';
    document.getElementById("currUsers").style.display = 'block';

    document.getElementById("backButton").addEventListener("click", showAvailRooms, false);




}

function showAvailRooms() {
    //leave room on socket.io

    document.getElementById("chatBox").style.display = 'none';
    document.getElementById("availRooms").style.display='block';
    document.getElementById("currUsers").style.display = 'none';

}


let kickoutClass = document.getElementsByClassName("kickout");

for(let i = 0; i < kickoutClass.length; i++) {

    kickoutClass[i].addEventListener('click', e=> {

        let roomId = e.target.id;
        // kickout
        alert("kickout");

        // socket.on('disconnect', function(roomId) {

        //     // delete clients[socket.id];
        //   });
    });


}


let banClass = document.getElementsByClassName("ban");

for(let i = 0; i < banClass.length; i++) {

    banClass[i].addEventListener('click', e=> {

        let roomId = e.target.id;
        // ban
        alert("BAN");
    });

}

let makeAdmin = document.getElementsByClassName("makeAdmin");

for(let i = 0; i < makeAdmin.length; i++) {

    makeAdmin[i].addEventListener('click', e=> {

        let roomId = e.target.id;
        // makeAdmin
        alert("admin");
    });

}



socketio.on('roomMessage', (data) => {

    // alert(data.message + " " + data.sender);


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


    document.getElementById("roomNames").innerHTML = "";

    if(data.length == 0) {

        document.getElementById("roomNames").innerHTML += "<div>No Rooms Yet! Create One!</div>";

    }
    else {

        for(let i = 0; i < data.length; i++) {


            roomName = data[i];
            document.getElementById("roomNames").innerHTML += "<div class='roomName createRoomButton' id=" + roomName + ">" + roomName + "</div>";    
    
        }

        setJoinListeners();




    }

    //document.getElementById('roomMessages').innerHTML += '<div class="userMessage">' + data.message + '</div>'

});