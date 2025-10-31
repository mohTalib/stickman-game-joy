const { DrawHandler, SoundManager } = require("./javascript/ClientClasses");

// Configure socket.io with more permissive settings
const socket = io({
    transports: ['websocket', 'polling'],
    reconnectionAttempts: Infinity,
    timeout: 45000,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    autoConnect: true,
    forceNew: false
});

let playerName = '';
let gameStarted = false;
let isDead = false;

// DOM Elements
const canvas = document.getElementById('canvas');
const drawHandler = new DrawHandler(canvas);
const soundManager = new SoundManager(); // Initialize sound manager
const homePage = document.getElementById('homePage');
const gamePage = document.getElementById('gamePage');
const lobbyStatus = document.getElementById('lobbyStatus');
const gameResult = document.getElementById('gameResult');

// Socket event handlers
socket.on("message", function(data) {
    console.log(data);
    updateLobbyStatus(data);
});

socket.on("nameRejected", (message) => {
    const nameInput = document.getElementById('playerName');
    nameInput.style.borderColor = '#ff4444';
    showErrorMessage(message);
});

socket.on("nameAccepted", () => {
    switchToGamePage();
});

// Game control key mappings
const keyMap = {
    87: 'up',    // W
    83: 'down',  // S
    65: 'left',  // A
    68: 'right', // D
    32: 'attack' // Space
};

var inputs = {};

// Event handlers
document.addEventListener("keydown", function(e) {
    let button = keyMap[e.keyCode];
    setButton(button, true);
});

document.addEventListener("keyup", function(e) {
    let button = keyMap[e.keyCode];
    setButton(button, false);
});

// Game control functions
window.startGame = function() {
    const nameInput = document.getElementById('playerName');
    playerName = nameInput.value.trim();
    
    if (!playerName) {
        showErrorMessage('Please enter a name');
        nameInput.style.borderColor = '#ff4444';
        return;
    }
    
    socket.emit('setName', playerName);
};

function setButton(button, value) {
    if (button !== undefined && inputs[button] !== value && gameStarted && !isDead) {
        inputs[button] = value;
        socket.emit("setButton", {button: button, value: value});
    }
}

// UI Functions
function switchToGamePage() {
    homePage.style.display = 'none';
    gamePage.style.display = 'flex';
    // Start playing BGM when switching to game page
    soundManager.playBGM();
}

function showErrorMessage(message) {
    const errorMsg = document.createElement('div');
    errorMsg.style.color = '#ff4444';
    errorMsg.style.marginTop = '10px';
    errorMsg.textContent = message;
    
    const startSection = document.querySelector('.start-section');
    const existingError = startSection.querySelector('.error-message');
    
    if (existingError) {
        existingError.remove();
    }
    
    errorMsg.className = 'error-message';
    startSection.appendChild(errorMsg);
}

function updateLobbyStatus(message) {
    if (message.includes('waiting')) {
        lobbyStatus.textContent = message;
    }
}

// Game state event handlers
socket.on('gameStart', () => {
    gameStarted = true;
    lobbyStatus.textContent = 'Game Started!';
    // Play game start sound
    soundManager.playSound('gameStart');
    setTimeout(() => {
        lobbyStatus.textContent = '';
    }, 2000);
});

socket.on('playerDied', (data) => {
    if (data.playerId === socket.id) {
        isDead = true;
        const waitingMessage = document.getElementById('waitingMessage');
        waitingMessage.style.display = 'block';
        
        gameResult.textContent = 'You Lost!';
        gameResult.style.display = 'block';
        
        setTimeout(() => {
            gameResult.style.display = 'none';
        }, 2000);
    }
});

socket.on('gameOver', (data) => {
    gameStarted = false;
    const waitingMessage = document.getElementById('waitingMessage');
    waitingMessage.style.display = 'none';
    
    gameResult.textContent = data.won ? 'You Won!' : 'Game Over!';
    gameResult.style.display = 'block';
    // Play game over sound
    soundManager.playSound('gameOver');
    setTimeout(() => {
        gameResult.style.display = 'none';
        isDead = false;
    }, 3000);
});

// Sound event handler
socket.on('playPunchSound', () => {
    soundManager.playSound('punch');
});

// Game state updates
var currentLatency = 0;

socket.on("sendState", function(state) {
    state.latency = currentLatency;
    drawHandler.draw(state);
});

socket.on('pong', function(latency) {
    currentLatency = latency;
});