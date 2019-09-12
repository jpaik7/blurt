var uuid = require('node-uuid');
var WebSocketServer = require('ws').Server
  , wss = new WebSocketServer({ port: 8080 });

var rooms = {};
var clients = {};
var savedChats = {};
var onlinebutaway = {};
var peak = 0;
var enter = 0;
var totalEntered = 0;

var STATUS1 = JSON.stringify({ type: 'status', s: 1 });
var STATUS0 = JSON.stringify({ type: 'status', s: 0 });

wss.on('connection', function connection(ws) {

	console.log('connection');
	var myId = uuid.v1();
	clients[myId] = ws;
	var roomId = '';
	if (Object.keys(clients).length > peak) {
		peak = Object.keys(clients).length;
	}
	totalEntered++;

	ws.on('message', function incoming(data) {
		var json = JSON.parse(data)

		if (json.type == "msg") {
			var chat = json.s;
			var myRoom = rooms[roomId];
			if (myRoom.length == 2) {
				for (i in myRoom) {
					if (myRoom[i] != myId) {
						clients[myRoom[i]].send(JSON.stringify({
							type: 'msg',
							s: chat,
							si: json.si, 
							image: json.image
						}));
					}
				}
			} else {
				var chatobj = {
							d: Date.now(),
							s: chat
						};

				if (roomId in savedChats) {
					if (myId in savedChats[roomId]) {
						savedChats[roomId][myId].push(chatobj)
					} else {
						savedChats[roomId][myId] = [chatobj]
					}
				} else {
					var obj = {};
					obj[myId] = [chatobj];
					savedChats[roomId] = obj;
				}

				if (roomId in onlinebutaway) {
					for (i in onlinebutaway[roomId]) {
						try { 
							clients[onlinebutaway[roomId][i]].send(JSON.stringify({
								type: 'notif',
								n: 'msg'
							})); 
						}
						catch (e) { /* handle error */ }
					}
				}
				//console.log(savedChats)
			}
		} else if (json.type == "enter") {
			roomId = json.roomId;
			ws.send(JSON.stringify({ type: 'id', i: myId }))

			if (roomId in rooms) {
				var myRoom = rooms[roomId];

				if (rooms[roomId].indexOf(myId) == -1) {
					if (myRoom.length == 1) {
						ws.send(STATUS1)
						clients[myRoom[0]].send(STATUS1)
					} else {
						ws.send(STATUS0)
					}
					rooms[roomId].push(myId);
				}

				if (roomId in onlinebutaway) {
					if (onlinebutaway[roomId].indexOf(myId) != -1) {
						onlinebutaway[roomId].splice(onlinebutaway[roomId].indexOf(myId), 1);
					}

					for (i in onlinebutaway[roomId]) {
						try { 
							clients[onlinebutaway[roomId][i]].send(JSON.stringify({
								type: 'notif',
								n: 'status',
								look: true
							}));
						}
						catch (e) { /* handle error */ }
					}
				}

				if (roomId in savedChats) {
					ws.send(JSON.stringify({
						type: "savedChat",
						s: savedChats[roomId]
					}))
				}
			} else {
				rooms[roomId] = [myId];
			}	
			console.log('Active: '+Object.keys(clients).length + '     Peak Active: '+peak+ '     Total Connection: ' + totalEntered)
		} else if (json.type == "blur") {
			if (roomId != '') {
				var myRoom = rooms[roomId];

				if (roomId in onlinebutaway) {
					for (i in onlinebutaway[roomId]) {
						try { 
							clients[onlinebutaway[roomId][i]].send(JSON.stringify({
								type: 'notif',
								n: 'status',
								look: false
							})); 
						}
						catch (e) { /* handle error */ }
					}
				}

				if (myRoom.indexOf(myId) != -1) {
					myRoom.splice(myRoom.indexOf(myId), 1);
					if (roomId in onlinebutaway) {
						onlinebutaway[roomId].push(myId)
					} else {
						onlinebutaway[roomId] = [myId]
					}
				}

				if (myRoom.length == 1) {
					clients[myRoom[0]].send(STATUS0)
				}
			}
		} else if (json.type == "clear") {
			delete savedChats[roomId];

			var myRoom = rooms[roomId];
			if (myRoom.length == 2) {
				for (i in myRoom) {
					if (myRoom[i] != myId) {
						clients[myRoom[i]].send(JSON.stringify({
							type: "savedChat",
							s: {}
						}));
					}
				}
			}
		}
		
	});

	ws.on('close', function incoming() {
		if (roomId != '') {
			var myRoom = rooms[roomId];

			if (myRoom.indexOf(myId) != -1) {
				myRoom.splice(myRoom.indexOf(myId), 1);
			}

			if (roomId in onlinebutaway) {
					if (onlinebutaway[roomId].indexOf(myId) != -1) {
						onlinebutaway[roomId].splice(onlinebutaway[roomId].indexOf(myId), 1);
					}

					for (i in onlinebutaway[roomId]) {
						try { 
							clients[onlinebutaway[roomId][i]].send(JSON.stringify({
								type: 'notif',
								n: 'status',
								look: false
							})); 
						}
						catch (e) { /* handle error */ }
					}
				}

			if (myRoom.length == 1) {
				clients[myRoom[0]].send(STATUS0)
			}
			delete clients[myId];
			console.log('Active: '+Object.keys(clients).length + '     Peak Active: '+peak+ '     Total Connection: ' + totalEntered)
		}
	});
});

console.log("Started");