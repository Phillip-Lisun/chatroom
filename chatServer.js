// Require the packages we will use:
const port = 3456;

let roomIdGen = 1;

let publicRooms = new Map();

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
io.sockets.on("connection", function (socket) {
    // This callback runs when a new Socket.IO connection is established.

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

            socket.join(newRoomId);


            console.log("Room Joined: " + newRoomId);
            console.log(publicRooms);
            


            io.sockets.to(newRoomId).emit('roomMessage', {roomId: newRoomId, message: "Welcome!"});
            io.sockets.

        }        


        console.log(data.createRoomName + " " + data.createRoomPassword);

    });






});

server.listen(port);
