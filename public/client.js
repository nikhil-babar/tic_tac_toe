const socket = new WebSocket('ws://localhost:3000');
var gameId = '';
var playerId = '';
var symbol = '';
var board = [];
const name = "nikhil";

socket.onopen = function () {
    console.log("connected to the server");
}

socket.onmessage = async function (msg) {

    const data = JSON.parse(msg.data);

    if(data.tag !== 'updateName'){
        gameId = data.gameId;
        playerId = data.id;
        symbol = data.symbol;
        board = data.board;
    }

    switch (data.tag) {
        case 'updateName':
            console.log('got the event');
            sendMessage(name, 'updateName');
            break;
        case 'no-player':
            document.querySelector('.message').textContent = "Waiting for opponent to join";
            break;
        case 'play' :
            const p1 = data.player;
            const p2 = data.opponent;
            document.querySelector('.message').textContent = p1 + " vs " + p2 + "=>" + "It's your turn "+ p1;
            Board(board,data.tag);
            break;
        case 'wait' :
            const p = data.player;
            const o = data.opponent;
            document.querySelector('.message').textContent = p + " vs " + o + "=>" + "waiting for "+ p + " to play...";
            Board(board,data.tag);
            break;
        case 'won' :
            document.querySelector('.message').textContent = "Congo, you won!"
            Board(board, data.tag);
            break;
        case 'lost':
            document.querySelector('.message').textContent = "Better luck next time:)"
            Board(board, data.tag);
            break;
        default:
            break;
    }
}


function Board(board,tag) {

    for(var i = 0 ; i <= 2; i++){
        for(var j = 0 ; j <= 2 ; j++){
            const element = document.getElementById('cell-'+i+j);
            element.removeEventListener('click', changeBackground);

            if(board[i][j] == 'x'){
                element.style.backgroundImage = "url('card-1.png')";
                element.style.backgroundRepeat = "no-repeat";
                element.style.backgroundPosition = "center"
            }
            else if(board[i][j] == 'o'){
                element.style.backgroundImage = "url('card-0.png')";
                element.style.backgroundRepeat = "no-repeat";
                element.style.backgroundPosition = "center"
            }
            else{
                element.style.backgroundImage = "none";

                if(tag === 'play'){
                    element.addEventListener('click', changeBackground);
                }
            }
        }
    }
}

function changeBackground(src) {
    
    const id = src.target.id;
    const element = document.getElementById(id);

    if(symbol === 'x') element.style.backgroundImage = "url('card-1.png')";

    else element.style.backgroundImage = "url('card-0.png')";

    element.style.backgroundRepeat = "no-repeat";
    element.style.backgroundPosition = "center";

    const x = parseInt(id.charAt(5));
    const y = parseInt(id.charAt(6));

    board[x][y] = symbol;

    sendMessage(board, 'move');
}

function sendMessage(msg, tag) {
   try {
    const data = {
        'tag': tag,
        'msg': msg,
        'gameId' : gameId,
        'id' : playerId
    }

    socket.send(JSON.stringify(data));
   } catch (error) {
    console.log(error);
   }
}
