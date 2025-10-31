// Merged client classes
class Sprite {
  constructor(image, cellSize, offset) {
    this.image = image;
    this.cellSize = cellSize;
    this.offset = offset;
  }

  draw(context, x, y) {
    this.drawIndex(context, 0, x, y);
  }

  drawIndex(context, index, x, y) {
    context.drawImage(
      this.image,
      this.cellSize.x * index,
      0,
      this.cellSize.x,
      this.cellSize.y,
      x + this.offset.x,
      y + this.offset.y,
      this.cellSize.x,
      this.cellSize.y,
    );
  }
}

class SpriteLoader {
  constructor() {
    this.sprites = {};
    
    const spriteData = [
      {
        spriteKey: 'stickman',
        filename: 'stickman.png',
        cellSize: {x: 64, y: 64},
        offset: {x: -32, y: -62}
      },
      {
        spriteKey: 'stickmanR',
        filename: 'stickmanR.png',
        cellSize: {x: 64, y: 64},
        offset: {x: -32, y: -62}
      },
      {
        spriteKey: 'stickmanAttacks',
        filename: 'stickmanAttacks.png',
        cellSize: {x: 128, y: 64},
        offset: {x: -96, y: -62}
      },
      {
        spriteKey: 'stickmanAttacksR',
        filename: 'stickmanAttacksR.png',
        cellSize: {x: 128, y: 64},
        offset: {x: -32, y: -62}
      },
      {
        spriteKey: 'stickmanShadow',
        filename: 'stickmanShadow.png',
        cellSize: {x: 64, y: 32},
        offset: {x: -32, y: -16}
      }
    ];
    
    spriteData.forEach(({spriteKey, filename, cellSize, offset}) => {
      let image = new Image();
      image.src = '/Assets/img/' + filename;
      let sprite = new Sprite(image, cellSize, offset);
      this.sprites[spriteKey] = sprite;
    });
  }
}

class DrawHandler {
  constructor(canvas) {
    this.canvas = canvas;
    this.context = canvas.getContext('2d');
    let spriteLoader = new SpriteLoader();
    this.sprites = spriteLoader.sprites;
    
    this.playerColors = [
      '#FF4D4D', // Light Red
      '#8A2BE2', // Blue Violet
      '#1E90FF', // Dodger Blue
      '#FFD700', // Gold
      '#FF69B4', // Hot Pink
      '#FF5733', // Orange-Red
      '#9370DB', // Medium Purple
      '#FF8C00', // Dark Orange
      '#FF00FF', // Magenta
      '#BA55D3', // Medium Orchid
      '#000000', // Black
      '#FF6347'  // Tomato
    ];
  }

  draw(state) {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (state.players) {
      const alivePlayers = state.players.filter(player => !player.isDead);
      
      alivePlayers.sort((a, b) => {
        return a.position.y - b.position.y;
      });

      alivePlayers.forEach((player) => {
        this.context.save();
        
        this.sprites['stickmanShadow'].draw(this.context, player.position.x, player.position.y);
        
        let {spriteKey, index} = player.animation;
        
        this.sprites[spriteKey].drawIndex(this.context, index, player.position.x, player.position.y);
        
        this.context.globalCompositeOperation = 'source-atop';
        this.context.globalAlpha = 0.5;
        this.context.fillStyle = this.playerColors[player.colorIndex % this.playerColors.length];
        
        const bounds = {
          x: player.position.x - 32,
          y: player.position.y - 62,
          width: 64,
          height: 64
        };
        
        this.context.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
        
        this.context.restore();
        
        this.context.fillStyle = '#ffffff';
        this.context.font = "14px Arial";
        this.context.textAlign = "center";
        this.context.fillText(player.name, player.position.x, player.position.y + 10);
        
        this.context.fillStyle = 'red';
        this.context.fillRect(player.position.x - 25, player.position.y - 70, 50, 8);
        
        this.context.fillStyle = 'green';
        const healthWidth = (player.health / 100) * 50;
        this.context.fillRect(player.position.x - 25, player.position.y - 70, healthWidth, 8);
        
        this.context.fillStyle = 'white';
        this.context.font = "12px Arial";
        this.context.fillText(player.health, player.position.x, player.position.y - 75);
      });
    }

    if (state.latency) {
      this.context.fillStyle = 'blue';
      this.context.font = "12px Arial";
      this.context.fillText(`Ping: ${state.latency}`, 10, 20);
    }
  }
}

class SoundManager {
  constructor() {
    this.sounds = {};
    this.bgmA = null;
    this.bgmB = null;
    this.currentBgm = 'A';
    this.soundsLoaded = false;
    this.soundPool = {}; // Sound pool for reusing audio objects
    this.poolSize = 3; // Number of sound instances per sound
    
    // Lazy loading - only load sounds when needed
    this.initialized = false;
  }

  init() {
    if (this.initialized) return;
    this.initialized = true;
    this.loadSounds();
  }

  loadSounds() {
    // Create dual BGM instances for truly seamless looping
    this.bgmA = new Audio('/Assets/sounds/BGM.mp3');
    this.bgmA.volume = 0.5;
    
    this.bgmB = new Audio('/Assets/sounds/BGM.mp3');
    this.bgmB.volume = 0.5;
    
    // Set up event listener for seamless transition
    this.bgmA.addEventListener('timeupdate', () => {
      // Start the second audio 0.1 seconds before the end
      if (this.currentBgm === 'A' && this.bgmA.duration > 0 && 
          this.bgmA.currentTime > this.bgmA.duration - 0.1) {
        this.bgmB.currentTime = 0;
        const playPromise = this.bgmB.play();
        if (playPromise !== undefined) {
          playPromise.catch(e => console.warn('BGM B autoplay prevented:', e));
        }
        this.currentBgm = 'B';
      }
    });
    
    this.bgmB.addEventListener('timeupdate', () => {
      // Start the first audio 0.1 seconds before the end
      if (this.currentBgm === 'B' && this.bgmB.duration > 0 && 
          this.bgmB.currentTime > this.bgmB.duration - 0.5) {
        this.bgmA.currentTime = 0;
        const playPromise = this.bgmA.play();
        if (playPromise !== undefined) {
          playPromise.catch(e => console.warn('BGM A autoplay prevented:', e));
        }
        this.currentBgm = 'A';
      }
    });
    
    // Define sound effects
    const soundEffects = [
      { key: 'gameStart', src: '/Assets/sounds/GameStart.mp3' },
      { key: 'gameOver', src: '/Assets/sounds/GameOver.mp3' },
      { key: 'punch', src: '/Assets/sounds/PunchSound.mp3' }
    ];
    
    // Initialize sound pools
    soundEffects.forEach(({ key, src }) => {
      this.sounds[key] = new Audio();
      this.sounds[key].src = src;
      this.sounds[key].preload = 'none'; // Don't preload until needed
      this.sounds[key].volume = 0.7;
      
      // Create sound pool for sound effects
      this.soundPool[key] = [];
      for (let i = 0; i < this.poolSize; i++) {
        const audio = new Audio(src);
        audio.preload = 'auto';
        audio.volume = 0.7;
        audio.load(); // Force preload
        this.soundPool[key].push({
          audio: audio,
          inUse: false
        });
      }
    });
    
    // Mark sounds as loaded after a short delay to allow preloading
    setTimeout(() => {
      this.soundsLoaded = true;
    }, 1000);
  }

  playBGM() {
    if (!this.initialized) this.init();
    
    // Start with bgmA
    if (this.bgmA.paused) {
      this.bgmA.currentTime = 0;
      this.currentBgm = 'A';
      
      // Use a promise with catch to handle autoplay restrictions
      const playPromise = this.bgmA.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.warn('Autoplay prevented, BGM will play after user interaction');
          // Add a one-time click handler to start BGM after user interaction
          const startAudio = () => {
            this.bgmA.play().catch(e => console.warn('BGM A play error:', e));
            document.removeEventListener('click', startAudio);
          };
          document.addEventListener('click', startAudio);
        });
      }
    }
  }

  stopBGM() {
    if (this.bgmA) {
      this.bgmA.pause();
      this.bgmA.currentTime = 0;
    }
    if (this.bgmB) {
      this.bgmB.pause();
      this.bgmB.currentTime = 0;
    }
    // Reset current BGM tracker
    this.currentBgm = 'A';
  }

  pauseBGM() {
    if (this.bgmA) {
      this.bgmA.pause();
    }
    if (this.bgmB) {
      this.bgmB.pause();
    }
  }

  playSound(soundKey) {
    if (!this.initialized) this.init();
    
    // Throttle sounds if they're coming in too quickly
    if (!this.soundsLoaded) return;
    
    // Use sound from pool
    if (this.soundPool[soundKey]) {
      // Find an available sound in the pool
      let sound = this.soundPool[soundKey].find(s => !s.inUse);
      
      // If all sounds are in use, find the oldest one
      if (!sound) {
        sound = this.soundPool[soundKey][0];
      }
      
      // Mark as in use
      sound.inUse = true;
      
      // Reset sound to beginning
      sound.audio.currentTime = 0;
      
      // Play the sound
      const playPromise = sound.audio.play();
      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            // Sound started playing
            setTimeout(() => {
              sound.inUse = false; // Release back to pool after sound duration
            }, 1000); // Assume 1s is enough for most sound effects
          })
          .catch(error => {
            console.warn(`Error playing ${soundKey} sound:`, error);
            sound.inUse = false; // Release back to pool on error
          });
      }
    }
  }
}

module.exports = { Sprite, SpriteLoader, DrawHandler, SoundManager };