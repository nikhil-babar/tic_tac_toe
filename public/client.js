var gameId = '';
var playerId = '';
var symbol = '';
var board = [];
const name = prompt("Enter your name");
let gameState = 'wait';
const socket = new WebSocket('ws://localhost:3000?name=' + name);

window.onbeforeunload = function () {
    sendMessage(null, 'close');
}


//********************************************************************************
const msgBox = document.querySelector('.message-list');
const msgButton = document.querySelector('.subbtn');
const msgText = document.querySelector('.text');

msgButton.addEventListener('click', chat);

function chat() {
    const message = msgText.value;
    msgText.value = '';
    sendMessage(message, 'chat');
    const chat = {
        'tag': 'player',
        'msg': message
    }
    addMessage(chat);
}

function addMessage(chat) {
    const li = document.createElement('li');
    li.classList.add("list-group-item", "bg-dark", "text-light", "h6");

    li.innerText = chat.msg;
    li.style.border = "none";
    
    if (chat.tag === 'opponent') {
        li.classList.add("text-end");
    }
    msgBox.appendChild(li);
}

// *******************************************************************************

const cells = document.querySelectorAll('.cell');
const messages = document.querySelector('.message');
const details = document.querySelector('.details-box');
const player_name = document.querySelector(".player");
const opponent_name = document.querySelector(".opponent");
const target_button = document.querySelector(".t-button");

cells.forEach(function (cell) {
    cell.addEventListener('click', changeBackground);
})

target_button.addEventListener('click', function () {

    if(!target_button.hasAttribute('data-bs-toggle'))
    sendMessage(null, 'rematch');
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

    target_button.classList.add("d-none");
    switch (data.tag) {
        case 'no-player':
            createSymbol();
            console.log('wait');
            messages.textContent = "Waiting for opponent to join";
            player_name.innerHTML = name;
            break;
        case 'play':
            let p = data.msg.player;
            let o = data.msg.opponent;
            console.log("play");
            gameState = 'play';
            messages.textContent = "It's your turn " + p;
            player_name.innerHTML = p;
            opponent_name.innerHTML = o;
            Board(board, data.tag);
            break;
        case 'wait':
            let p1 = data.msg.player;
            let p2 = data.msg.opponent;
            gameState = 'wait';
            messages.textContent = "waiting for " + p2 + " to play....";
            player_name.innerHTML = name;
            opponent_name.innerHTML = p2;
            Board(board, data.tag);
            break;
        case 'chat':
            const message = data.msg;
            const chat = {
                'tag': 'opponent',
                'msg': message
            }
            addMessage(chat);
            break;
        case 'won':
            messages.textContent = "Congo, you won!";
            target_button.classList.remove("d-none");
            Board(board, data.tag);
            break;
        case 'lost':
            messages.textContent = "Better luck next time:)";
            target_button.classList.remove("d-none");
            Board(board, data.tag);
            break;
        case 'draw':
            messages.textContent = "Match drawn!";
            target_button.classList.remove("d-none");

            Board(board, data.tag);
            break;
        case 'rematch':
            sendMessage(null, 'rematch-confirmed');
            break;
        case 'rematch-confirmed':

            break;
        default:
            break;
    }
}

function createSymbol() {
    let element = document.querySelector(".symbol");
    let image = document.createElement("img");

    if(symbol === 'x'){
        image.src = "card-1.png";
    }else{
        image.src = "card-0.png";
    }

    image.classList.add("w-25");
    element.appendChild(image);
}


function Board(board, tag) {

    for (var i = 0; i <= 2; i++) {
        for (var j = 0; j <= 2; j++) {
            const element = document.getElementById('cell-' + i + j);

            if (board[i][j] == 'x') {
                element.style.backgroundImage = "url('card-1.png')";
                element.style.backgroundSize = "100%";
                element.style.backgroundRepeat = "no-repeat";
                element.style.backgroundPosition = "center"
            }
            else if (board[i][j] == 'o') {
                element.style.backgroundImage = "url('card-0.png')";
                element.style.backgroundSize = "70%";
                element.style.backgroundRepeat = "no-repeat";
                element.style.backgroundPosition = "center"
            }
            else {
                element.style.backgroundImage = "none";
            }
        }
    }
}

function changeBackground(src) {

    const id = src.target.id;
    const element = document.getElementById(id);

    if (element.style.backgroundImage === 'none' && gameState === 'play') {
        if (symbol === 'x'){
            element.style.backgroundImage = "url('card-1.png')";
            element.style.backgroundSize = "100%";
        }

        else{
            element.style.backgroundImage = "url('card-0.png')";
            element.style.backgroundSize = "70%";
        }

        element.style.backgroundRepeat = "no-repeat";
        element.style.backgroundPosition = "center"; ''


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
            'gameId': gameId,
            'id': playerId
        }

        socket.send(JSON.stringify(data));
    } catch (error) {
        console.log(error);
    }
}
