// All server classes merged into one file
const Animation = class {
  constructor(spriteKey='placeholder', startIndex=0, numIndices=1, framesPerIndex=1, loop=true) {
    this.spriteKey = spriteKey;
    this.startIndex = startIndex;
    this.numIndices = numIndices;
    this.framesPerIndex = framesPerIndex;
    this.loop = loop;

    this.isDone = false;
    this.frame = 0;
    this.index = 0;

    this.pauseFrames = 0;
    this.onIndexMethods = {};
  }

  update() {
    if (this.isDone) return;
    if (this.pauseFrames > 0) {
      this.pauseFrames--;
      return;
    }

    this.frame++;
    if (this.frame === this.framesPerIndex) {
      this.frame = 0;
      this.index++;

      if (this.onIndexMethods[this.index]) {
        this.onIndexMethods[this.index]();
      }

      if (this.index === this.numIndices) {
        if (this.loop) {
          this.frame = 0;
          this.index = 0;
        }
        else {
          this.index = this.numIndices - 1;
          this.isDone = true;
        }
      }
    }
  }

  onIndex(index, method) {
    this.onIndexMethods[index] = method;
  }

  pause(pauseFrames) {
    this.pauseFrames = pauseFrames;
  }

  reset() {
    this.isDone = false;
    this.frame = 0;
    this.index = 0;
  }

  getDrawIndex() {
    return this.startIndex + this.index;
  }
}

const actions = {
  NONE: 'none',
  HURT: 'hurt',
  ATTACK: {
    PUNCH: 'attack.punch'
  },
  DEAD: 'dead'
}

const attacks = {
  punch: {
    hitbox: {
      size: {x: 56, y: 24},
      offset: {x: -56, y: -12}
    },
    damage: 15
  },
  punchR: {
    hitbox: {
      size: {x: 56, y: 24},
      offset: {x: 0, y: -12}
    },
    damage: 15
  }
}

class StickMan {
  constructor(game, id) {
    this.game = game;
    this.id = id;
    this.name = '';
    this.health = 100;
    this.position = {x: 400, y: 300};
    this.hurtbox = {
      size: {x: 44, y: 12},
      offset: {x: -22, y: -6}
    };
    this.movespeed = {x: 6, y: 4};
    this.facingRight = false;
    this.input = {};
    this.colorIndex = -1;
    this.isDead = false;

    this.animations = {
      stand: new Animation('stickman', 0, 3, 4, true),
      standR: new Animation('stickmanR', 0, 3, 4, true),
      run: new Animation('stickman', 3, 4, 3, true),
      runR: new Animation('stickmanR', 3, 4, 3, true),
      hurt: new Animation('stickman', 7, 5, 3, false),
      hurtR: new Animation('stickmanR', 7, 5, 3, false),
      punch: new Animation('stickmanAttacks', 0, 6, 3, false),
      punchR: new Animation('stickmanAttacksR', 0, 6, 3, false),
    };

    this.animations.punch.onIndex(3, () => {
      if (!this.isDead) this.game.doAttack(attacks.punch, this);
    });
    this.animations.punchR.onIndex(3, () => {
      if (!this.isDead) this.game.doAttack(attacks.punchR, this);
    });

    this.action = actions.NONE;
    this.animation = this.animations['stand'];

    this.canvasWidth = 1280;
    this.canvasHeight = 720;
    this.spriteWidth = 64;
    this.spriteHeight = 64;
  }

  // ... StickMan methods ...
  update() {
    if (this.isDead) return;

    let xInput = 0;
    if (this.input.left) xInput--;
    if (this.input.right) xInput++;
    let yInput = 0;
    if (this.input.up) yInput--;
    if (this.input.down) yInput++;

    this.animation.update();

    switch(this.action) {
      case actions.NONE:
        const newX = this.position.x + xInput * this.movespeed.x;
        const newY = this.position.y + yInput * this.movespeed.y;

        const padding = 32;
        if (newX >= padding && newX <= this.canvasWidth - padding) {
          this.position.x = newX;
        }
        if (newY >= padding && newY <= this.canvasHeight - padding) {
          this.position.y = newY;
        }

        if (xInput > 0)
          this.facingRight = true;
        else if (xInput < 0)
          this.facingRight = false;
    
        if (xInput === 0 && yInput === 0)
          this.animation = (!this.facingRight) ? this.animations['stand'] : this.animations['standR'];
        else
          this.animation = (!this.facingRight) ? this.animations['run'] : this.animations['runR'];

        if (this.input.attack) {
          this.action = actions.ATTACK.PUNCH;
          this.animation = (!this.facingRight) ? this.animations['punch'] : this.animations['punchR'];
          this.animation.reset();
        }
        break;

      case actions.HURT:
        if (this.animation.isDone) {
          this.action = actions.NONE;
          this.animation = (!this.facingRight) ? this.animations['stand'] : this.animations['standR'];
        }
        break;
      
      case actions.ATTACK.PUNCH:
        if (this.animation.isDone) {
          this.action = actions.NONE;
          this.animation = (!this.facingRight) ? this.animations['stand'] : this.animations['standR'];
        }
        break;
    }
  }

  setButton(button, value) {
    this.input[button] = value;
  }

  setName(name) {
    this.name = name;
  }

  setColorIndex(index) {
    this.colorIndex = index;
  }

  hurt(damage = 15) {
    if (this.isDead) return;
    
    this.health = Math.max(0, this.health - damage);
    if (this.health <= 0) {
      this.die();
    } else {
      this.action = actions.HURT;
      this.animation = (!this.facingRight) ? this.animations.hurt : this.animations.hurtR;
      this.animation.reset();
    }
  }

  die() {
    this.isDead = true;
    this.action = actions.DEAD;
    this.game.io.to(this.id).emit('playerDied', { playerId: this.id });
    this.game.checkGameOver();
  }

  resetState() {
    this.health = 100;
    this.isDead = false;
    
    this.action = actions.NONE;
    this.animation = (!this.facingRight) ? this.animations['stand'] : this.animations['standR'];
    
    Object.values(this.animations).forEach(anim => anim.reset());
    
    this.input = {};
    
    const oldColorIndex = this.colorIndex;
    const oldName = this.name;
    
    this.position = {x: 400, y: 300};
    
    this.colorIndex = oldColorIndex;
    this.name = oldName;
  }

  getDrawInfo() {
    return {
      position: this.position,
      facingRight: this.facingRight,
      animation: {
        spriteKey: this.animation.spriteKey,
        index: this.animation.getDrawIndex(),
      },
      name: this.name,
      health: this.health,
      isDead: this.isDead,
      colorIndex: this.colorIndex
    };
  }
}

class Game {
  constructor(io) {
    this.io = io;
    this.players = {};
    this.gameStarted = false;
    this.minPlayers = 2;
    this.usedColorIndices = new Set();

    this.io.on("connection", (socket) => {
      io.sockets.emit("message", `A new player has connected. Waiting for player name...`);

      if (this.gameStarted) {
        socket.emit("gameStart");
      }

      socket.on("setName", (name) => {
        const nameExists = Object.values(this.players).some(player => player.name.toLowerCase() === name.toLowerCase());
        
        if (nameExists) {
          socket.emit("nameRejected", "This name is already taken. Please choose another name.");
          return;
        }

        this.players[socket.id] = new StickMan(this, socket.id);
        this.players[socket.id].setName(name);
        
        const colorIndex = this.getNextAvailableColorIndex();
        this.players[socket.id].setColorIndex(colorIndex);
        
        socket.emit("nameAccepted");
        io.sockets.emit("message", `${name} has joined the lobby.`);
        
        const player = this.players[socket.id];
        player.position.x = Math.random() * 600 + 100;
        player.position.y = Math.random() * 400 + 100;
        this.checkGameStart();
      });

      socket.on("disconnect", (reason) => {
        const player = this.players[socket.id];
        if (player) {
          this.usedColorIndices.delete(player.colorIndex);
          io.sockets.emit("message", `${player.name || 'A player'} has disconnected. Reason: ${reason}`);
          delete this.players[socket.id];
          this.checkGameOver();
        }
      });
  
      socket.on("setButton", ({button, value}) => {
        let player = this.players[socket.id];
        if (player && !player.isDead && this.gameStarted) {
          player.setButton(button, value);
        }
      });
    })
  }

  getNextAvailableColorIndex() {
    let index = 0;
    while (this.usedColorIndices.has(index)) {
      index++;
    }
    this.usedColorIndices.add(index);
    return index;
  }

  checkGameStart() {
    if (!this.gameStarted && Object.keys(this.players).length >= this.minPlayers) {
      this.gameStarted = true;
      this.io.sockets.emit("message", "Game is starting!");
      this.io.sockets.emit("gameStart");

      const playerIds = Object.keys(this.players);
      playerIds.forEach((id, index) => {
        const player = this.players[id];
        player.position.x = 200 + (index * 200);
        player.position.y = 300;
      });
    } else if (!this.gameStarted) {
      this.io.sockets.emit("message", `Waiting for more players... (${Object.keys(this.players).length}/${this.minPlayers})`);
    }
  }

  update() {
    Object.values(this.players).forEach((player) => {
      if (player) player.update();
    });
  }

  sendState() {
    let players = Object.values(this.players).map((player) => {
      return player.getDrawInfo();
    });
    this.io.sockets.emit("sendState", {
      players: players,
    });
  }

  doAttack(attack, attacker) {
    if (!this.gameStarted) return;

    // Track if any punch actually connected to avoid unnecessary network events
    let punchConnected = false;
    let hitPlayerIds = [];

    Object.values(this.players).forEach((player) => {
      if (
        player.id !== attacker.id 
        && !player.isDead
        && this.checkCollision(attack.hitbox, attacker.position, player.hurtbox, player.position)
      ) {
        player.hurt(attack.damage);
        attacker.animation.pause(5);
        player.animation.pause(5);
        
        // Track which players were hit
        punchConnected = true;
        hitPlayerIds.push(player.id);
      }
    });
    
    // Only emit punch sound if a punch actually connected
    if (punchConnected) {
      // Emit to attacker
      this.io.to(attacker.id).emit('playPunchSound');
      
      // Emit to players who got hit
      hitPlayerIds.forEach(playerId => {
        this.io.to(playerId).emit('playPunchSound');
      });
    }
  }

  checkCollision(box1, box1Pos, box2, box2Pos) {
    return (
      box1Pos.x + box1.offset.x < box2Pos.x + box2.offset.x + box2.size.x
      && box1Pos.x + box1.offset.x + box1.size.x > box2Pos.x + box2.offset.x
      && box1Pos.y + box1.offset.y < box2Pos.y + box2.offset.y + box2.size.y
      && box1Pos.y + box1.offset.y + box1.size.y > box2Pos.y + box2.offset.y
    );
  }

  checkGameOver() {
    if (!this.gameStarted) return;

    const alivePlayers = Object.values(this.players).filter(player => !player.isDead);
    
    if (alivePlayers.length <= 1) {
      if (alivePlayers.length === 1) {
        const winner = alivePlayers[0];
        Object.values(this.players).forEach(player => {
          this.io.to(player.id).emit('gameOver', {
            won: player.id === winner.id
          });
        });
        this.io.sockets.emit("message", `${winner.name} wins the game!`);
      }
      
      this.gameStarted = false;
      setTimeout(() => {
        Object.values(this.players).forEach((player, index) => {
          player.resetState();
          player.position.x = 200 + (index * 200);
          player.position.y = 300;
        });
        this.checkGameStart();
      }, 3000);
    }
  }
}

module.exports = { Animation, Game, StickMan };