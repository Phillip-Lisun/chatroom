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

    console.log(socket.id);

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
            


            io.sockets.to(newRoomId).emit('roomMessage', {sender: "Server", message: "Joined " + publicRooms.get(newRoomId) + "!", roomId: newRoomId});

            console.log(socket.id);


            updateRooms();





        }        


        console.log(data.createRoomName + " " + data.createRoomPassword);

    });

    socket.on('clientRoomMessage', function(data) {

        let roomId = data.roomId + "";
        let sender = data.username;
        let message = data.message;

        socket.to(roomId).emit('roomMessage', {sender: sender, message: message});
        socket.emit("messageAccepted", {message: message});
    
    
    });



    function updateRooms() {

        for(let roomId of publicRooms.keys()) {
    
            if(rooms.get(roomId) == null) {
                publicRooms.delete(roomId);
            }
    
    
        }

        for(let roomName of publicRooms.values()) {
            roomList = [];
            roomList.push(roomName);

        }
    
        console.log(roomList);

        io.emit('roomList', JSON.stringify(roomList));
    
    }






});


server.listen(port);
