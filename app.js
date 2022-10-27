const { name } = require('ejs');
const express = require('express');
const { send } = require('process');
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



socket.on('connection', async function (ws) {
    try {
        const gameId = await alotGame(ws);

        if(games[gameId].player2 != null){
            playGame(gameId);
        }
        ws.on('message', clientMsg);
    } catch (error) {
        console.log(error);
    }
    
})

async function alotGame(ws) {
    try {
        let flag = false;
        for(var id of gameIds){
            if(games[id].player2 == null){
                games[id].player2 = {
                    'name' : 'player2',
                    'client' : ws,
                    'symbol' : 'o',
                    'id' : createPlayerId()
                }
                games[id].turn = 1;

                flag = true;
                return id;
            }
        }
    
        if(!flag){
            return await createGame(ws);
        }

    } catch (error) {
        console.log(error);
    }
}

async function playGame(gameId) {
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
    
        const gamesDetails = {
            'tag' : s1,
            'board' : game.board,
            'player' : p1.name,
            'opponent' : p2.name,
            'symbol' : p1.symbol,
            'id' : p1.id,
            'gameId': gameId
        }
    
        await sendMsg(p1.client, gamesDetails);
    
        gamesDetails.symbol = p2.symbol;
        gamesDetails.id = p2.id;
        gamesDetails.player = p2.name;
        gamesDetails.opponent = p1.name;
        gamesDetails.tag = s2;
    
        await sendMsg(p2.client, gamesDetails);

    } catch (error) {
        console.log(error);
    }
}

async function createGame(ws) {
    try {
        const game = {
            'player1': {
                'name': 'player1',
                'client': ws,
                'symbol': 'x',
                'id' : createPlayerId()
            },
            'player2': null,
            'board': createBoard(),
            'turn' : null
        }
    
        const gameId = createGameId();
        gameIds.push(gameId);
        games[gameId] = game;
        await sendMsg(ws, {
            'tag' : 'no-player',
            'gameId' : gameId,
            'id' : game.player1.id
        });
    
        return gameId;

    } catch (error) {
        console.log(error);
    }  
}

function checkGame(board) {
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

    return null;
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
        case 'updateName':
    
            break;

        case 'move':
            games[gameId].board = message;
            const flag = checkGame(games[gameId].board);

            if(flag === null){
                playGame(gameId);
            }

            else{
                const data = {
                    'tag': 'won',
                    'board': games[gameId].board,
                }
                
                if(games[gameId].player1.symbol === flag){
                    sendMsg(games[gameId].player1.client, data);
                    data.tag = 'lost';
                    sendMsg(games[gameId].player2.client, data);
                }

                else{
                    sendMsg(games[gameId].player2.client, data);
                    data.tag = 'lost';
                    sendMsg(games[gameId].player1.client, data);
                }
            }

            break;
        default:
            break;
    }
}

async function sendMsg(ws, msg) {
    try {
        await ws.send(JSON.stringify(msg));
    } catch (error) {
        console.log(error);
    }
}
