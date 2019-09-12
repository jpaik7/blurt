var express = require('express');
var app = express();
var http = require('http').Server(app);
//var io = require('socket.io')(http);
var path = require('path');
var session = require('express-session');
var uuid = require('node-uuid');
var crypto = require('crypto');
//var MongoStore = require('connect-mongo')(session);

var sessionMiddleware = session({
    secret: "sshhhhhhh",
    resave: false,
});

app.use(sessionMiddleware);
app.use(express.static('public'));

// io.use(function(socket, next) {
//     sessionMiddleware(socket.request, socket.request.res, next);
// });

app.get('/', function(req, res){
	res.sendFile(path.join(__dirname, '/public', 'index.html'));
});

var rooms = {};
app.get('/:roomId', function(req, res){
	console.log('request')
	var useragent = req.headers['user-agent']
	if (useragent == undefined || (useragent.indexOf('facebookexternalhit') == -1 && useragent.indexOf('Facebot') == -1))
	{
		var sess = req.session
		var roomId = req.params.roomId
		if (roomId in rooms) {
			if (rooms[roomId] < 2) {
				if (sess.rooms == undefined) {
					sess.rooms = [roomId]
					sess.save()
					rooms[roomId] += 1;
				} else {
					if (sess.rooms.indexOf(roomId) == -1) {
						sess.rooms.push(roomId)
						sess.save()
						rooms[roomId] += 1;
					}
				}

				res.sendFile(path.join(__dirname, '/public', 'chatroom.html'));
			} else {
				if (sess.rooms != undefined && sess.rooms.indexOf(roomId) != -1) {
					res.sendFile(path.join(__dirname, '/public', 'chatroom.html'));
				} else {
					res.status(404).send('no');
				}
			}
		} else {
			res.status(404).send('Not found');
		}
		console.log(rooms);
	}
});


app.post('/new', function(req, res){
	// var roomId = uuid.v1();
	// while (roomId in rooms) {
	// 	roomId = uuid.v1();
	// }
  //
	// var roomId = crypto.createHash('md5').update(Object.keys(rooms).length.toString()).digest('hex').slice(0,4);
	// while (roomId in rooms) {
	// 	roomId = crypto.createHash('md5').update(Object.keys(rooms).length.toString()).digest('hex').slice(0,4);
	// }

  var roomId = Math.random().toString(36).substr(2, 4);
  while (roomId in rooms) {
    roomId = Math.random().toString(36).substr(2, 4);
  }

	rooms[roomId] = 0;
	res.send(roomId);
});

http.listen(80, function(){
	console.log('listening on *:80');
});


// var savedChats = {}
// io.on('connection', function(socket){
// 	var myRoomId = ""

// 	console.log('a user connected');

// 	socket.on('init', function(roomId){
// 		console.log('init')
// 		myRoomId = roomId
// 		if (rooms[myRoomId].length < 2) {
// 			if (rooms[myRoomId].indexOf(socket.request.session.socketId) != -1) {
// 				if (socket.request.session.socketId in io.sockets.connected) {
// 				io.sockets.connected[socket.request.session.socketId].emit('close', true)
// 				}
// 				rooms[myRoomId] = rooms[myRoomId].filter(function(id) { return id != socket.request.session.socketId; });
// 			}
// 			rooms[roomId].push(socket.id)
// 			if (savedChats[socket.request.session.socketId]!= undefined) {
// 				socket.emit('savedChats', {
// 					"savedChats": savedChats[socket.request.session.socketId]
// 				})
// 				delete savedChats[socket.request.session.socketId]
// 			}
// 			socket.request.session.socketId = socket.id
// 			socket.request.session.save()

// 		} else {
// 			if (socket.request.session.socketId in io.sockets.connected) {
// 				io.sockets.connected[socket.request.session.socketId].emit('close', true)
// 			}
// 			rooms[myRoomId] = rooms[myRoomId].filter(function(id) { return id != socket.request.session.socketId; });
// 			rooms[myRoomId].push(socket.id)
// 			if (savedChats[socket.request.session.socketId]!= undefined) {
// 				socket.emit('savedChats', {
// 					"savedChats": savedChats[socket.request.session.socketId]
// 				})
// 				delete savedChats[socket.request.session.socketId]
// 			}
// 			socket.request.session.socketId = socket.id
// 			socket.request.session.save()
// 		}
// 		for (i in rooms[myRoomId]) {
// 			if (rooms[myRoomId][i] != socket.id) {
// 				if (rooms[myRoomId][i] in io.sockets.connected) {
// 					io.sockets.connected[rooms[myRoomId][i]].emit('partnerStatus', true)
// 					io.sockets.connected[rooms[myRoomId][i]].emit('partnerStatusRequest', true)
// 				}
// 			}
// 		}c
// 	});

// 	socket.on('windowFocus', function(data){
// 		for (i in rooms[myRoomId]) {
// 			if (rooms[myRoomId][i] != socket.id) {
// 				if (rooms[myRoomId][i] in io.sockets.connected) {
// 					io.sockets.connected[rooms[myRoomId][i]].emit('partnerStatus', data)
// 				}
// 			}
// 		}
// 	});

// 	socket.on('sendChat', function(message){
// 		for (i in rooms[myRoomId]) {
// 			if (rooms[myRoomId][i] != socket.id) {
// 				if (rooms[myRoomId][i] in io.sockets.connected) {
// 					io.sockets.connected[rooms[myRoomId][i]].emit('receiveChat', message)
// 				} else {
// 					if (savedChats[rooms[myRoomId][i]] != undefined) {
// 						savedChats[rooms[myRoomId][i]].push(message)
// 					} else {
// 						savedChats[rooms[myRoomId][i]] = [message]
// 					}
// 				}
// 			}
// 		}
// 	});

// 	socket.on('disconnect', function(){
// 		for (i in rooms[myRoomId]) {
// 			if (rooms[myRoomId][i] != socket.id) {
// 				if (rooms[myRoomId][i] in io.sockets.connected) {
// 					io.sockets.connected[rooms[myRoomId][i]].emit('partnerStatus', false)
// 				}
// 			}
// 		}
// 		console.log('user disconnected');
// 	});

// });
