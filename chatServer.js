// Require the packages we will use:
const port = 3456;

let roomIdGen = 1;

let allUsers = new Map(); //username to socket
let allRooms = new Map(); //roomId to room name
let roomUsers = new Map(); //roomId to array of users in room
let blackList = new Map(); //roomId to array of banned users
let privateRooms = new Map(); //roomId to passwords

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

    updateRooms();

    socket.on('logon', function(data) {

        username = data.username;

        if(allUsers.get(username) != null) {
            socket.emit('username_taken', {});
            return;
        }

        socket.username = username;
        allUsers.set(username, socket);

        socket.emit('user_handshake', {});



    });

    socket.on('create_room_request', function(data) {

        let newRoomId = roomIdGen + "";
        roomIdGen++;

        allRooms.set(newRoomId, data.createRoomName);

        socket.join(newRoomId);

        username = socket.username;

        let thisRoomUsers = [];
        thisRoomUsers.push(username);

        roomUsers.set(newRoomId, thisRoomUsers);
        //console.log(roomUsers);
        
        socket.emit('roomMessage', {sender: "Server", message: "Created " + allRooms.get(newRoomId) + "!", roomId: newRoomId});
        socket.emit('roomAdmin', {roomId: newRoomId}); //sets creator as admin

        updateRoomUsers(newRoomId);

        if(data.createRoomPassword != "") {

            let pwd = data.createRoomPassword;
            privateRooms.set(newRoomId, pwd);

        }

        updateRooms();

    });

    socket.on('clientRoomMessage', function(data) {

        let roomId = data.roomId + "";
        let sender = data.username;
        let message = data.message;

        io.sockets.in(roomId).emit('roomMessage', {sender: sender, message: message, roomId: roomId});
        socket.emit("messageAccepted", {message: message});
    
    });

    socket.on('join_room_request', function(data) {

        let joiningRoomId;

        for(let [id, roomName] of allRooms.entries()) { //gets room name from room id
            if(roomName == data.roomId) {
                joiningRoomId = id;
            }
        }

        let bannedUsers = [];
        username = socket.username;
        if(bannedUsers = blackList.get(joiningRoomId)) { //checks to see if user is banned from room
            if(bannedUsers.indexOf(username) != -1) {

                socket.emit('banOrder', {banUser: username, roomId: joiningRoomId}); 
                return;

            }
        }

        if(privateRooms.get(joiningRoomId) != null) { //if room is password protected, password is requested

            socket.emit('password_request', {roomId: joiningRoomId});
            console.log("pwd_req");
            return;

        }

        console.log("I am in the regular join area");

        let thisRoomUsers = roomUsers.get(joiningRoomId);
        thisRoomUsers.push(username);

        roomUsers.set(joiningRoomId, thisRoomUsers);

        socket.join(joiningRoomId);

        socket.emit('joinHandshake', {roomId: joiningRoomId});
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

            console.log(thisRoomUsers);
            console.log('pwd_check');
    
            roomUsers.set(roomId, thisRoomUsers);
    
            socket.join(roomId);
    
            socket.emit('joinHandshake', {roomId: roomId});
            socket.emit('roomMessage', {sender: "Server", message: "Joined " + allRooms.get(roomId) + "!", roomId: roomId});
            socket.to(roomId).emit('roomMessage', {sender: "Server", message: data.username + " joined the room!", roomId: roomId});
    
            updateRoomUsers(roomId);
            return;
            
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

        if(nameIndex != -1) { //removes user from userList
            thisRoomUsers.splice(nameIndex, 1);
        }

        roomUsers.set(roomId, thisRoomUsers);

        socket.to(roomId).emit('roomMessage', {sender: "Server", message: username + " left!", roomId: roomId});

        socket.leave(roomId);
        updateRooms();
        updateRoomUsers(roomId);

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
        socket.to(toSocket.id).emit('banOrder', {banUser: banUser, roomId: roomId});
        io.sockets.to(roomId).emit('roomMessage', {sender: "Server", message: banUser + " was banned from the room!", roomId: roomId});

    });

    socket.on('bannedUsersList', function(data){
        displayAllBannedUsers(data.roomId);
    });

    socket.on('unban', function(data) {

        let unbanName = data.name;

        let currBlacklist = blackList.get(data.roomId);

        for(let i = 0; i < currBlacklist.length; i++){
            if(currBlacklist[i] == unbanName){
                
                currBlacklist.splice(i, 1);
                console.log("curr list: " + currBlacklist);
            }
        }

        // blackList.get(data.roomId) = currBlacklist;
        blackList.set(data.roomId, currBlacklist);
        console.log("done");

        displayAllBannedUsers(data.roomId);
        
    });

    function displayAllBannedUsers(roomId) {
        console.log("Banned");

        let currBlacklist = blackList.get(roomId);

        console.log(currBlacklist);

        if (currBlacklist != null){
            io.emit('banUsersList', JSON.parse(JSON.stringify(currBlacklist)));
        }
        else{
            io.emit('banUsersList', JSON.parse(JSON.stringify([])));
        }
    }

    function updateRooms() { //updates the room list

        for(let roomId of allRooms.keys()) {
    
            if(rooms.get(roomId) == null) {
                allRooms.delete(roomId);
            }
        }

        roomList = [];
        for(let roomName of allRooms.values()) {
            roomList.push(roomName);

        }

        io.emit('roomList', JSON.parse(JSON.stringify(roomList)));

    }

    function updateRoomUsers(roomId) {

        userList = roomUsers.get(roomId);
        console.log(userList);
        username = socket.username;
        io.to(roomId).emit('userList', JSON.parse(JSON.stringify(userList)));
    }
});

server.listen(port);
