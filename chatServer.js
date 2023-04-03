// Require the packages we will use:
const port = 3456;

let roomIdGen = 1;

let allUsers = new Map();

let allRooms = new Map();

let roomUsers = new Map();

let blackList = new Map();

let privateRooms = new Map();



let roomList = [];
let userList = [];

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

    socket.on('logon', function(data) {

        username = data.username;

        socket.username = username;

        allUsers.set(username, socket);
        //console.log(allUsers);

        //console.log(socket.username);

    });


    socket.on('message_to_server', function (data) {
        // This callback runs when the server receives a new message from the client.

        console.log("message: " + data["message"]); // log it to the Node.JS output
        io.sockets.emit("message_to_client", { message: data["message"] }) // broadcast the message to other users
    });

    socket.on('create_room_request', function(data) {

    

        let newRoomId = roomIdGen + "";
        roomIdGen++;


        allRooms.set(newRoomId, data.createRoomName);

        //socket.leaveAll();

        socket.join(newRoomId);


        // console.log("Room Joined: " + newRoomId);
        // console.log(allRooms);
        
        // console.log("newRoomId: " + newRoomId);

        username = socket.username;

        let thisRoomUsers = [];
        thisRoomUsers.push(username);

        roomUsers.set(newRoomId, thisRoomUsers);
        //console.log(roomUsers);
        


        socket.emit('roomMessage', {sender: "Server", message: "Created " + allRooms.get(newRoomId) + "!", roomId: newRoomId});
        socket.emit('roomAdmin', {roomId: newRoomId});

        updateRoomUsers(newRoomId);


        //console.log(socket.id);


        
        if(data.createRoomPassword != "") {

            let pwd = data.createRoomPassword;

            privateRooms.set(newRoomId, pwd);

        }


        //console.log(data.createRoomName + " " + data.createRoomPassword);

        updateRooms();



    });

    socket.on('clientRoomMessage', function(data) {

        let roomId = data.roomId + "";
        let sender = data.username;
        let message = data.message;

        io.sockets.in(roomId).emit('roomMessage', {sender: sender, message: message, roomId: roomId});
        // console.log(message);
        // console.log(sender);
        // console.log(roomId);
        socket.emit("messageAccepted", {message: message});
    
    
    });

    socket.on('join_room_request', function(data) {

        let joiningRoomId;

        for(let [id, roomName] of allRooms.entries()) {
            if(roomName == data.roomId) {
                joiningRoomId = id;
            }
        }

        let bannedUsers = [];

        username = socket.username;

        if(bannedUsers = blackList.get(joiningRoomId)) {

            if(bannedUsers.indexOf(username) != -1) {

                socket.emit('banOrder', {banUser: username, roomId: joiningRoomId});
                return;


            }
        }

        if(privateRooms.get(joiningRoomId) != null) {

            socket.emit('password_request', {roomId: joiningRoomId});
            return;

        }

        let thisRoomUsers = roomUsers.get(joiningRoomId);
        thisRoomUsers.push(username);

        roomUsers.set(joiningRoomId, thisRoomUsers);
        //console.log(roomUsers);

        socket.join(joiningRoomId);

        socket.emit('joinHandshake', {});
        socket.emit('roomMessage', {sender: "Server", message: "Joined " + allRooms.get(joiningRoomId) + "!", roomId: joiningRoomId});
        socket.to(joiningRoomId).emit('roomMessage', {sender: "Server", message: data.username + " joined the room!", roomId: joiningRoomId});

        updateRoomUsers(joiningRoomId);



    }); 

    socket.on('pwd_check', function(data) {

        let pwd_attempt = data.pwd_attempt;
        let username = data.username;
        let roomId = data.roomId;

        let pwd = privateRooms.get(roomId);

        if(pwd === pwd_attempt) {

            let thisRoomUsers = roomUsers.get(roomId);
            thisRoomUsers.push(username);
    
            roomUsers.set(roomId, thisRoomUsers);
            //console.log(roomUsers);
    
            socket.join(roomId);
    
            socket.emit('joinHandshake', {});
            socket.emit('roomMessage', {sender: "Server", message: "Joined " + allRooms.get(roomId) + "!", roomId: roomId});
            socket.to(roomId).emit('roomMessage', {sender: "Server", message: data.username + " joined the room!", roomId: roomId});
    
            updateRoomUsers(roomId);
            
        }
        else {
            socket.emit("pwd_false", {});
        }



    });

    socket.on("exit_room_request", function(data) {

        username = data.username;
        roomId = data.roomId;

        username = socket.username;
        let thisRoomUsers = roomUsers.get(roomId);

        let nameIndex = thisRoomUsers.indexOf(username);

        if(nameIndex != -1) {
            thisRoomUsers.splice(nameIndex, 1);
        }

        roomUsers.set(roomId, thisRoomUsers);

        socket.to(roomId).emit('roomMessage', {sender: "Server", message: username + " left!", roomId: roomId});

        socket.leave(roomId);
        // console.log(username + " left " + roomId);
        updateRooms();
        updateRoomUsers(roomId);

        //remove username from array



    });

    socket.on('kickUser', function(data) {

        let kickUser = data.kickUser;
        let roomId = data.roomId;

        socket.to(roomId).emit('kickOrder', {kickUser: kickUser, roomId: roomId});
        io.sockets.to(roomId).emit('roomMessage', {sender: "Server", message: kickUser + " was kicked from the room!", roomId: roomId});



    });

    socket.on('changeAdmin', function(data) {

        let roomId = data.roomId;
        let newAdmin = data.username;

        socket.to(roomId).emit('adminSet', {username: newAdmin, roomId: roomId});
        io.sockets.to(roomId).emit('roomMessage', {sender: "Server", message: newAdmin + " is now the Admin of this room!", roomId: roomId}); 

    });

    socket.on('privateMessage', function(data) {

        let toUsername = data.username;
        let messageContent = data.message;
        let toSocket = allUsers.get(toUsername);

        socket.to(toSocket.id).emit('privateMessageRecieve', {sender: socket.username, message: messageContent});

    });

    socket.on('banUser', function(data) {

        let bannedUsers = []; 

        let banUser = data.banUser;
        let roomId = data.roomId;

        if(blackList.get(roomId) == null) {

            bannedUsers.push(banUser);
            blackList.set(roomId, bannedUsers);

        }
        else {
            bannedUsers = blackList.get(roomId);
            bannedUsers.push(banUser);
            blackList.set(roomId, bannedUsers);

        }

        let toSocket = allUsers.get(banUser);

        // console.log(bannedUsers);

        socket.to(toSocket.id).emit('banOrder', {banUser: banUser, roomId: roomId});
        io.sockets.to(roomId).emit('roomMessage', {sender: "Server", message: banUser + " was banned from the room!", roomId: roomId});



    });




    function updateRooms() {

        for(let roomId of allRooms.keys()) {
    
            if(rooms.get(roomId) == null) {
                allRooms.delete(roomId);
            }
    
    
        }

        roomList = [];
        for(let roomName of allRooms.values()) {
            roomList.push(roomName);

        }
    
        //console.log(roomList);

        io.emit('roomList', JSON.parse(JSON.stringify(roomList)));
    
    }

    function updateRoomUsers(roomId) {

        userList = roomUsers.get(roomId);

        username = socket.username;

        // nameIndex = userList.indexOf(username);
        // userList.splice(nameIndex, 1);

        //console.log(userList);
        io.to(roomId).emit('userList', JSON.parse(JSON.stringify(userList)));


    }






});


server.listen(port);
