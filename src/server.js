const http = require('http');
const fs = require('fs');
const socketio = require('socket.io');

const port = process.env.PORT || process.env.NODE_PORT || 3000;

// read the client html file into memory
// __dirname in node is the current dir
const index = fs.readFileSync(`${__dirname}/../client/client.html`);

const onRequest = (request, response) => {
    response.writeHead(200, {
        'Content-Type': 'text/html',
    });
    response.write(index);
    response.end();
};

const app = http.createServer(onRequest).listen(port);

console.log(`Listening on 127.0.0.1:${port}`);

const io = socketio(app);

const users = {};

const onJoined = (sock) => {
    const socket = sock;

    socket.on('join', (data) => {
        users[data.name] = data.name;

        const joinMsg = {
            name: 'server',
            msg: `There are ${Object.keys(users).length} users online.`,
        };

        socket.name = data.name;
        socket.emit('msg', joinMsg);

        socket.join('room1');

        // announcement to everyone in the room
        const response = {
            name: 'server',
            msg: `${data.name} has joined the room`,
        };
        socket.broadcast.to('room1').emit('msg', response);

        console.log(`${data.name} joined`);
        // success message back to new user
        socket.emit('msg', {
            name: 'server',
            msg: 'You joined the room',
        });
    });
};

const onMsg = (sock) => {
    const socket = sock;

    socket.on('msgToServer', (data) => {
        io.sockets.in('room1').emit('msg', {
            name: data.name,
            msg: data.msg,
        });
    });
    
    socket.on('shout', (data) => {
       io.sockets.in('room1').emit('msg', {
           name: data.name,
           msg: data.msg.toUpperCase(),
       });
    });
};
const onDisconnect = (sock) => {
    const socket = sock;

    socket.on('disconnect', () => {
        const response = {
            name: 'server',
            msg: `${socket.name} has left the room.`,
        };
        socket.broadcast.to('room1').emit('msg', response);
        socket.leave('room1');

        delete users[socket.name];
    });
};

io.sockets.on('connection', (socket) => {
    onJoined(socket);
    onMsg(socket);
    onDisconnect(socket);
});

console.log('Websocket server has started');