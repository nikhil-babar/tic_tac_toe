const express = require('express');
const { resolve } = require('path');
const url = require('url');
const app = express();
const websocket = require('ws').WebSocketServer;
const server = require('http').createServer(app);
const socket = new websocket({ server: server });

app.use(express.static('public'));

app.get("/", function (req, res) {
    res.sendFile(__dirname + '/index.html');
})

server.listen(3000, function () {
    console.log("server listening on port 3000");
})

//************************************************* */

var games = [];
var gameIds = [];
var players = [];
var playerIds = [];


socket.on('connection', function (ws,req) {
    try {
        ws.name = url.parse(req.url, true).query.name;
        const gameId = alotGame(ws);

        if(games[gameId].player2 !== null){
            playGame(gameId);
        }

        ws.on('message', clientMsg);

    } catch (error) {
        console.log(error);
    }
    
})

function alotGame(ws) {
    try {
        for(var id of gameIds){
            console.log("from alotGame: " + gameIds);
            if(games[id].player2 === null){
                const player = {
                    'name' : ws.name,
                    'client' : ws,
                    'symbol' : 'o',
                    'gameId' : id
                }

                const playerId = createPlayerId();
                players[playerId] = player;
                playerIds.push(playerId);

                games[id].player2 = playerId;
                sendMsg(playerId, id, null, 'no-player');
                return id;
            }
        }
    
        return createGame(ws);

    } catch (error) {
        console.log(error);
    }
}

function playGame(gameId) {
    try {
        const game = games[gameId];
        const p1 = game.player1;
        const p2 = game.player2;
        
        if(game.turn === 1){
            var s1 = 'play';
            var s2 = 'wait';
            game.turn = 0;
        }

        else{
            var s1 = 'wait';
            var s2 = 'play';
            game.turn = 1;
        }
    
        sendMsg(p1,gameId,{'player' : players[p1].name,'opponent' : players[p2].name},s1);

        sendMsg(p2,gameId,{'player' : players[p2].name,'opponent' : players[p1].name},s2);

    } catch (error) {
        console.log(error);
    }
}

function createGame(ws) {
    try {
        const player = {
            'name' : ws.name,
            'client' : ws,
            'symbol' : 'x',
            'gameId' : null
        }
        
        const game = {
            'player1' : null,
            'player2': null,
            'board': createBoard(),
            'turn' : 1
        }
    
        const gameId = createGameId();
        const playerId = createPlayerId();

        players[playerId] = player;
        players[playerId].gameId = gameId;
        playerIds.push(playerId);
        
        game.player1 = playerId;
        games[gameId] = game;
        gameIds.push(gameId);
        
        sendMsg(playerId, gameId, null, 'no-player');
        return gameId;

    } catch (error) {
        console.log(error);
    }  
}


function destroy(gameId) {
    const p1 = games[gameId].player1;
    const p2 = games[gameId].player2;


    let index = gameIds.indexOf(gameId);

    if(index > -1){
        console.log(gameId);
        gameIds.splice(index,1);
    }

    index = playerIds.indexOf(p1);

    if(index > -1){
        playerIds.splice(index,1);
    }

    index = playerIds.indexOf(p2);

    if(index > -1){
        playerIds.splice(index,1);
    }

    delete games[gameId];
    delete players[p1];
    delete players[p2];
}

function checkGame(board) {
    var emptyCell = 0;

    for(var i = 0 ; i <= 2 ; i++){
        if((board[i][0] === 'x' || board[i][0] === 'o') &&board[i][0] === board[i][1] && board[i][1] === board[i][2]){
            return board[i][0];
        }

        else if((board[0][i] === 'x' || board[0][i] === 'o') && board[0][i] === board[1][i] && board[1][i] === board[2][i]){
            return board[0][i];
        }
    }

    if((board[0][0] === 'x' || board[0][0] === 'o') && board[0][0] === board[1][1] && board[1][1] === board[2][2]){
        return board[0][0];
    }

    else if((board[0][2] === 'x' || board[0][2] === 'o') && board[0][2] === board[1][1] && board[1][1] === board[2][0]){
        return board[2][0];
    }

    for(var i = 0 ; i <= 2 ; i++){
        for(var j = 0 ; j <= 2; j++){
            if(board[i][j] == ''){
                emptyCell++;
            }
        }
    }

    if(emptyCell == 0){
        return true;
    }

    return false;
}

function createGameId() {
    return Math.round(Math.random() * 1000);
}

function createPlayerId() {
    return Math.round(Math.random() * 1000);
}

function createBoard() {
    var board = [['', '', ''], ['', '', ''], ['', '', '']];

    return board;
}

function clientMsg(msg) {
    const data = JSON.parse(msg);
    const playerId = data.id;
    const gameId = data.gameId;
    const message = data.msg;

    switch (data.tag) {

        case 'move':
            games[gameId].board = message;
            const flag = checkGame(games[gameId].board);

            if(flag === false){
                playGame(gameId);
            }

            else if(flag === true){
                sendMsg(games[gameId].player1, gameId, null, 'draw');
                sendMsg(games[gameId].player2, gameId, null, 'draw');
            }

            else{            
                if(p1.symbol === flag){
                    sendMsg(games[gameId].player1, gameId, null, 'won');
                    sendMsg(games[gameId].player2, gameId, null, 'lost');
                }

                else{
                    sendMsg(games[gameId].player1, gameId, null, 'lost');
                    sendMsg(games[gameId].player2, gameId, null, 'won');
                }
            }

            break;

        case 'chat':
            try {
                switch (playerId) {
                    case games[gameId].player1:
                        sendMsg(games[gameId].player2, gameId, message, 'chat');
                        break;
    
                    case games[gameId].player2:
                        sendMsg(games[gameId].player1, gameId, message, 'chat');
                        break;
                
                    default:
                        break;
                }
            } catch (error) {
                console.log(error);
            }
            break;
        case 'close':
            // console.log(games);
            // console.log(players);
            destroy(gameId);
        default:
            break;
    }
}

function sendMsg(playerId, gameId, msg, tag) {
    try {
        const data = {
            'id' : playerId,
            'gameId' : gameId,
            'msg' : msg,
            'tag' : tag,
            'board' : games[gameId].board,
            'symbol' : players[playerId].symbol,
        }

        const client = players[playerId].client;

        client.send(JSON.stringify(data));
    } catch (error) {
        console.log(error);
    }
}
