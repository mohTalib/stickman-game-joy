# Stickman Fighter

Stickman Fighter is a real-time multiplayer browser game where players control stickman characters and battle each other in a fast-paced arena. Built with Node.js, Express, and Socket.IO, it features smooth animations, sound effects, and a modern UI. Play with friends on your local network or over the internet!

![image](https://github.com/user-attachments/assets/a5ab59ff-aef4-48ff-a585-b128782529ad)


## Features

- **Multiplayer Battles**: Real-time action with multiple players
- **Simple Controls**: Move with WASD, attack with Spacebar
- **Animated Sprites**: Smooth stickman animations and effects
- **Sound System**: Background music and punch/game event sounds
- **Lobby System**: Wait for enough players before the game starts
- **Responsive UI**: Modern, retro-inspired interface

## Getting Started

### Prerequisites
- Node.js (v14 or higher recommended)
- npm

### Installation
1. Clone the repository:
```bash
git clone https://github.com/prxyansh/stickman-fighter.git
cd stickman-fighter
```
2. Install dependencies:
```bash
npm install
```
3. Build the client bundle:

```bash
npx browserify -x uws ./client/client.js > ./build/client.bundle.js
```
4. Start the server:

```bash
node server.js
```
Or use the npm script:

```bash
npm run server
```
## Playing the Game
1. Open your browser and go to http://localhost:5000

2. Enter your fighter name and click START BATTLE

3. Wait for at least one more player to join (minimum 2 players)

4. Use WASD to move and Spacebar to attack

5. Last stickman standing wins!

## LAN Play
Other players on your network can join using your computer's IP address (shown in the server console)

Make sure port 5000 is open on your firewall. Use the provided PowerShell script setup-network.ps1 (run as administrator) to configure Windows Firewall automatically.

## Project Structure
```bash
stickman-fighter/
├── Assets/           # Game images and sounds
├── build/            # Bundled client JS
├── client/           # Client-side JS and HTML
├── server/           # Server-side game logic
├── server.js         # Main server entry point
├── package.json
└── setup-network.ps1 # Windows firewall setup script
```
## Future Features
See `Ideas That Can be Implemented.txt` for a list of planned and possible enhancements, including:

- Character classes and abilities

- Power-ups and new game modes

- Visual and sound effects

- Social and competitive features

## Credits
**Priyansh Kumar Paswan**: [GitHub](https://github.com/prxyansh)

**Prasad Sahil**: [GitHub](https://github.com/SahilPrsd)

Sprites and sounds: Custom-made or open source (see Assets).
Built with Express and Socket.IO.

## Troubleshooting
- If other players can't connect, ensure port 5000 is open and not blocked by your firewall

- For best experience, use a modern browser (Chrome, Edge, Firefox)

- If you encounter issues, please open an issue on GitHub

Enjoy battling with your friends!
