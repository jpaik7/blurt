//var ws = new WebSocket('ws://localhost:8080');

var newMessageHere = false;
var isOldTitle = true;
var oldTitle = "blurt";
var newTitle = "New Message!";
var interval = null;
function changeTitle() {
	document.title = isOldTitle ? oldTitle : newTitle;
	isOldTitle = !isOldTitle;
}

let model, metadata;

var myMessageSize, myImage;
var sendNewImage = false;
// predict = {
// 	const asdf = "asdf";
//   const trimmed = text.trim().toLowerCase().replace(/(\.|\,|\!)/g, '').split(' ');
//   const inputBuffer = tf.buffer([1, metadata.max_len], "float32");
//   trimmed.forEach((word, i) => inputBuffer.set(metadata.word_index[word] + metadata.index_from, 0, i));
//   const input = inputBuffer.toTensor();
//   const predictOut = model.predict(input);
//   mutable positivity = predictOut.dataSync()[0];
//   predictOut.dispose();
//   return predictOut;
// }

function predict(str) {
	const trimmed = str.trim().toLowerCase().replace(/(\.|\,|\!)/g, '').split(' ').slice(1).slice(-3)
	const inputBuffer = tf.buffer([1, metadata.max_len], "float32");
  	trimmed.forEach((word, i) => inputBuffer.set(metadata.word_index[word] + metadata.index_from, 0, i));
  	const input = inputBuffer.toTensor();
  	const predictOut = model.predict(input);
  	var positivity = predictOut.dataSync()[0];
  	var negativity = 1 - positivity
  	$('#sendField').css({
    	fontSize: 10 + negativity*90
	});
	myMessageSize = 10 + negativity*90;
	getGanImage(str);
  	predictOut.dispose();
  	return predictOut;
}

async function getGanImage(str) {
	console.log("getting image")
	const inputs = {
	  "caption": str
	};

	fetch('http://10.38.16.29:8001/query', {
	  method: 'POST',
	  headers: {
	      Accept: 'application/json',
	      'Content-Type': 'application/json',
	  },
	  body: JSON.stringify(inputs)
	})
	  .then(response => response.json())
	  .then(output => {
	    const { result } = output;
	    // use the outputs in your project
		myImage = result;
		sendNewImage = true;
		$('#ganImagesMine').prepend('<img id="theImg" src="' + result + '" />');
	  })
}

async function app() {
  console.log('Loading model..');

  // Load the model.
  model = await tf.loadModel("https://storage.googleapis.com/tfjs-models/tfjs/sentiment_cnn_v1/model.json")
  const prom = (await fetch("https://storage.googleapis.com/tfjs-models/tfjs/sentiment_cnn_v1/metadata.json")).json()
  prom.then(data => metadata = data)
  console.log(metadata)
  console.log('Sucessfully loaded model');

  // Make a prediction through the model on our image.
 
}

app();

$(document).ready(function(){
	var ws = new WebSocket('ws://10.38.16.29:8080');

	ws.onopen = function (event) {
		console.log('connection');
		$('.circle').css('background', '#00FF00')
		var json = {
			type: "enter",
			roomId: window.location.pathname.substring(1),
		};

		ws.send(JSON.stringify(json));
	};

	ws.onclose = function (event) {
		$('.circle').css('background', '#D8D8D8')
	};

	var partnerStatus = false;
	var historyReceived = false;
	ws.onmessage = function (event) {
		var obj = JSON.parse(event.data)

		if (obj.type == "msg") {
			$('#receiveLabel').text(obj.s);
			$('#receiveLabel').css({
		    	fontSize: obj.si
			});
			if (obj.image) {
				$('#ganImagesTheirs').prepend('<img id="theImg" src="' + obj.image + '" />')
			}

		} else if (obj.type == "status") {
			if (obj.s == 1) {
				$('#partnerStatus').css('color', '#00FF00');
				$('#partnerStatus').text('looking');

				partnerStatus = true;

				ws.send(JSON.stringify({
					type: "msg",
					s: $('#sendField').val()
				}))

			} else {
				$('#partnerStatus').css('color', '#ABABAB');
				$('#partnerStatus').text('away');

				partnerStatus = false;
			}
		} else if (obj.type == "id") {

			if (localStorage.getItem("id_list")) {
				var idList = JSON.parse(localStorage.getItem("id_list"));
				if (idList.indexOf(obj.i) == -1) {
					idList.push(obj.i);
				}
				localStorage.setItem("id_list", JSON.stringify(idList));
			} else {
				localStorage.setItem("id_list", JSON.stringify([obj.i]));
			}

		} else if (obj.type == "savedChat") {
			console.log(obj.s)
			var myList = [];
			var receiveList = [];
			if (localStorage.getItem("id_list")) {
				for (var key in obj.s) {
					if (localStorage.getItem("id_list").indexOf(key) != -1) {
						myList = myList.concat(obj.s[key]);
					} else {
						receiveList = receiveList.concat(obj.s[key]);
					}
				}
			}
			myList.sort(function(a, b){return a.d - b.d});
			receiveList.sort(function(a, b){return a.d - b.d});

			console.log(receiveList)
			console.log(myList)

			$("#sendHistory").html("");
			$("#receiveHistory").html("");
			console.log("cleared receiveHistory html")
			console.log(obj.s)
			var today = new Date()
			for (i in myList) {
				var date = new Date(myList[i].d);
				var datestring = date.customFormat( "&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp#h#:#mm# #ampm#");
				if (date.getDate() != today.getDate()) {
					datestring = date.customFormat( "&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp#DDD# #h#:#mm# #ampm#");
				}
				console.log('working??')
				console.log(myList[i].s)
				$('#sendHistory').prepend('<p >'+myList[i].s+'<span style="font-size:12px">'+datestring+'</span></p>');
			}

			for (i in receiveList) {
				var date = new Date(receiveList[i].d);
				var datestring = date.customFormat( "&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp#h#:#mm# #ampm#");
				if (date.getDate() != today.getDate()) {
					datestring = date.customFormat( "&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp#DDD# #h#:#mm# #ampm#");
				}
				$('#receiveHistory').append('<p >'+receiveList[i].s+'<span style="font-size:12px">'+datestring+'</span></p>');
			}

			if (receiveList.length != 0) {
				historyReceived = true
			} else {
				historyReceived = false
			}
		} else if (obj.type == "notif") {

			if (obj.n == "msg") {
				newMessageHere = true
				console.log("new message here")
				if (newTitle != "Looking!") {
					newTitle = "New Message!"
					if (interval == null) {
						interval = setInterval(changeTitle, 800);
					}
				}
			} else if (obj.n == "status") {
				if (obj.look) {
					newTitle = "Looking!"
					if (interval == null) {
						interval = setInterval(changeTitle, 800);
					}
				} else {
					clearInterval(interval);
					interval = null;
					document.title = oldTitle
					if (newMessageHere) {
						newTitle = "New Message!"
						if (interval == null) {
							interval = setInterval(changeTitle, 800);
						}
					}
				}
			}

		}
	};

	// if (ws.readyState == 1) {
	// 	$('.circle').css('background', '#00FF00')
	// } else {
	// 	$('.circle').css('background', '#D8D8D8')
	// }

	$(window).focus(function() {
		clearInterval(interval);
		interval = null;
		newMessageHere = false
		console.log('cleared Interval');
		$("title").text(oldTitle);

		if (ws.readyState == 1) {
			$('.circle').css('background', '#00FF00')
		} else {
			$('.circle').css('background', '#D8D8D8')
		}

		document.getElementById('overlay').style.display = "none";
		var json = {
			type: "enter",
			roomId: window.location.pathname.substring(1),
		};

		ws.send(JSON.stringify(json));
	});

	$(window).blur(function() {

		if (partnerStatus && ($("#sendHistory").html() != "" || $("#receiveHistory").html() != "")) {
			$("#sendHistory").html("");
			console.log('sendhistory cleared')
			$("#receiveHistory").html("");

			ws.send(JSON.stringify({
				type: "clear"
			}))

			historyReceived = false;
			console.log("sent clear")
		}

		document.getElementById('overlay').style.display = "block";

		ws.send(JSON.stringify({
			type: "blur",
		}))

		if (partnerStatus) {
			newTitle = "Looking!"
			if (interval == null) {
				interval = setInterval(changeTitle, 800);
			}
		}
	});

	$('#sendField').on('input',function(e){
		if (partnerStatus) {
			var str = $('#sendField').val()
			if (sendNewImage === true) {
				ws.send(JSON.stringify({
					type: "msg",
					s: str,
					si: myMessageSize,
					image: myImage
				}))
				sendNewImage = false;
			} else {
				ws.send(JSON.stringify({
					type: "msg",
					s: str,
					si: myMessageSize,
				}))
			}
			
		}

	});

	$('#sendField').keypress(function (e) {
		if (e.which == 13 && $('#sendField').val() != '') {
			if (partnerStatus) {
				ws.send(JSON.stringify({
					type: "msg",
					s: ""
				}))

				if ($("#sendHistory").html() != "" || $("#receiveHistory").html() != "") {
					$("#sendHistory").html("");
					console.log('sendhistory cleared')
					$("#receiveHistory").html("");

					ws.send(JSON.stringify({
						type: "clear"
					}))

					historyReceived = false;
					console.log("sent clear")
				}

			} else {
				console.log(historyReceived)
				if (historyReceived) {
					$("#sendHistory").html("");
					console.log('sendhistory cleared')
					$("#receiveHistory").html("");

					ws.send(JSON.stringify({
						type: "clear"
					}))

					historyReceived = false;
					console.log("just sent clear")
				}

				var str = escapeHtml($('#sendField').val())
				ws.send(JSON.stringify({
					type: "msg",
					s: str
				}))

				var today = new Date()
				var datestring = today.customFormat( "&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp&nbsp#h#:#mm# #ampm#");
				$('#sendHistory').prepend('<p >'+str+'<span style="font-size:12px">'+datestring+'</span></p>');
				console.log(str);
			}
			$('#sendField').val('');
			console.log('sendField clear')
		}
		else if (e.which == 32) {
			predict($('#sendField').val())
		}
	});

});

var entityMap = {
	"&": "&amp;",
	"<": "&lt;",
	">": "&gt;",
	'"': '&quot;',
	"'": '&#39;',
	"/": '&#x2F;'
};

function escapeHtml(string) {
	return String(string).replace(/[&<>"'\/]/g, function (s) {
		return entityMap[s];
	});
}

Date.prototype.customFormat = function(formatString){
	var DDD,h,mm,ampm;
	DDD = (DDDD=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][this.getDay()]).substring(0,3);
	formatString = formatString.replace("#DDD#",DDD);
	h=(hhh=this.getHours());
	if (h==0) h=24;
	if (h>12) h-=12;
	AMPM=(ampm=hhh<12?'am':'pm').toUpperCase();
	mm=(m=this.getMinutes())<10?('0'+m):m;
	return formatString.replace("#h#",h).replace("#mm#",mm).replace("#ampm#",ampm);
};
