// Require the packages we will use:
const port = 3456;

let roomIdGen = 1;

let publicRooms = new Map();
let roomList = [];

const express = require('express'),
     http = require('http');
const app = express();

const server = http.createServer(app);

app.use(express.static('public'));

// Import Socket.IO and pass our HTTP server object to it.
const socketio = require("socket.io")(http, {
    wsEngine: 'ws'
});

// Attach our Socket.IO server to our HTTP server to listen
const io = socketio.listen(server);

let rooms = io.of("/").adapter.rooms;

io.sockets.on("connection", function (socket) {
    // This callback runs when a new Socket.IO connection is established.

    //console.log(socket.id);

    updateRooms();


    socket.on('message_to_server', function (data) {
        // This callback runs when the server receives a new message from the client.

        console.log("message: " + data["message"]); // log it to the Node.JS output
        io.sockets.emit("message_to_client", { message: data["message"] }) // broadcast the message to other users
    });

    socket.on('create_room_request', function(data) {

        if(data.createRoomPassword == "") {

            let newRoomId = roomIdGen + "";
            roomIdGen++;


            publicRooms.set(newRoomId, data.createRoomName);

            socket.leaveAll();

            socket.join(newRoomId);


            console.log("Room Joined: " + newRoomId);
            console.log(publicRooms);
            
            console.log("newRoomId: " + newRoomId);
            


            socket.emit('roomMessage', {sender: "Server", message: "Joined " + publicRooms.get(newRoomId) + "!", roomId: newRoomId});

            //console.log(socket.id);

        }        


        //console.log(data.createRoomName + " " + data.createRoomPassword);

        updateRooms();


    });

    socket.on('clientRoomMessage', function(data) {

        let roomId = data.roomId + "";
        let sender = data.username;
        let message = data.message;

        io.sockets.in(roomId).emit('roomMessage', {sender: sender, message: message, roomId: roomId});
        console.log(message);
        console.log(sender);
        console.log(roomId);
        socket.emit("messageAccepted", {message: message});
    
    
    });

    socket.on('join_room_request', function(data) {

        let joiningRoomId;

        for(let [id, roomName] of publicRooms.entries()) {
            if(roomName == data.roomId) {
                joiningRoomId = id;
            }
        }

        socket.join(joiningRoomId);
        socket.emit('roomMessage', {sender: "Server", message: "Joined " + publicRooms.get(joiningRoomId) + "!", roomId: joiningRoomId});
        socket.to(joiningRoomId).emit('roomMessage', {sender: "Server", message: data.username + " joined the room!", roomId: joiningRoomId});


    }); 



    function updateRooms() {

        for(let roomId of publicRooms.keys()) {
    
            if(rooms.get(roomId) == null) {
                publicRooms.delete(roomId);
            }
    
    
        }

        roomList = [];
        for(let roomName of publicRooms.values()) {
            roomList.push(roomName);

        }
    
        console.log(roomList);

        io.emit('roomList', JSON.parse(JSON.stringify(roomList)));
    
    }






});


server.listen(port);
