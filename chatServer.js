// Require the packages we will use:
const http = require("http"),
    fs = require("fs");

const port = 3456;
const html = "chatClient.html";
const css = "client.css";

//copied code start : https://stackoverflow.com/questions/24582338/how-can-i-include-css-files-using-node-express-and-ejs

function onRequest(request, response){  
    if(request.headers.accept.split(',')[0] == 'text/css') {

         fs.readFile(css, (err, data)=>{
             response.writeHeader(200, {'Content-Type': 'text/css'});
             response.write(data);
             response.end();
         });  
    }
    else {

        fs.readFile(html, function(err, data){
            response.writeHead(200, {'Content_type': 'text/html'});
            response.write(data);
            response.end();
        });
    };
};

const server = http.createServer(onRequest);
//copied code end

server.listen(port);

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
});