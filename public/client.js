var gameId = '';
var playerId = '';
var symbol = '';
var board = [];
const name = "nikhil";
let gameState = 'wait';
const socket = new WebSocket('ws://localhost:3000?name='+name);

window.onbeforeunload = function () {
    sendMessage(null, 'close');
}

//********************************************************************************
const messages = [];
const msgBox = document.querySelector('#message-list');
const msgButton = document.querySelector('#subbtn');
const msgText = document.querySelector('#text');

msgButton.addEventListener('click', chat);

function chat() {
    const message = msgText.value;
    msgText.value = '';
    sendMessage(message, 'chat');
    const chat = {
        'tag' : 'player',
        'msg' : message
    }
    addMessage(chat);
}

function addMessage(chat) {
    const p = document.createElement('p');
    
    p.innerText = chat.msg;
    if(chat.tag === 'opponent'){
        p.style.textAlign = 'left';
    }
    else{
        p.style.textAlign = 'right';
    }
    msgBox.appendChild(p);
}

// *******************************************************************************

const cells = document.querySelectorAll('.cell');

cells.forEach(function (cell) {
    cell.addEventListener('click', changeBackground);
})

socket.onopen = function () {
    console.log("connected to the server");
}

socket.onmessage = function (msg) {

    const data = JSON.parse(msg.data);
    console.log(data);
    gameId = data.gameId;
    playerId = data.id;
    symbol = data.symbol;
    board = data.board;

    switch (data.tag) {
        case 'no-player':
            document.querySelector('.message').textContent = "Waiting for opponent to join";
            break;
        case 'play' :
            console.log("play");
            gameState = 'play';
            const p1 = data.msg.player;
            const p2 = data.msg.opponent;
            document.querySelector('.message').textContent = p1 + " vs " + p2 + "=>" + "It's your turn "+ p1;
            Board(board,data.tag);
            break;
        case 'wait' :
            gameState = 'wait';
            const p = data.msg.player;
            const o = data.msg.opponent;
            document.querySelector('.message').textContent = p + " vs " + o + "=>" + "waiting for "+ o + " to play...";
            Board(board,data.tag);
            break;
        case 'chat' :
            const message = data.msg;
            const chat = {
                'tag' : 'opponent',
                'msg' : message
            }
            addMessage(chat);
            break;
        case 'won' :
            document.querySelector('.message').textContent = "Congo, you won!"
            Board(board, data.tag);
            break;
        case 'lost':
            document.querySelector('.message').textContent = "Better luck next time:)"
            Board(board, data.tag);
            break;
        case 'draw':
            document.querySelector('.message').textContent = "Match drawn!"
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
            }
        }
    }
}

function changeBackground(src) {
    
    const id = src.target.id;
    const element = document.getElementById(id);
    alert(gameState);

    if(element.style.backgroundImage === 'none' && gameState === 'play'){
        if(symbol === 'x') element.style.backgroundImage = "url('card-1.png')";

        else element.style.backgroundImage = "url('card-0.png')";
    
        element.style.backgroundRepeat = "no-repeat";
        element.style.backgroundPosition = "center";''
        
    
        const x = parseInt(id.charAt(5));
        const y = parseInt(id.charAt(6));
    
        board[x][y] = symbol;
    
        sendMessage(board, 'move');
    }
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
