const CONFIG = {
  canvas: { width: 1280, height: 720 },
  grid: { cols: 16, rows: 9, cellSize: 80 },
  attackSize: 1,   
  minSpawnDistance: 3,    
  effect: { fadeSpeed: 10, hitThreshold: 150 },
  wave: { width: 10, speed: 0.1 },
  bonus: { interval: 10, score: 5 },  
  text: { fadeSpeed: 3 },
  stageStartTime: 3,                    
  ui: { x: 10, y: 10, width: 200, height: 135, barWidth: 170, barHeight: 20 },
};

const STAGES = [
  { enemyCount: 3,  speed: 0.5, timeLimit: 90 },
  { enemyCount: 5,  speed: 1,   timeLimit: 80 },
  { enemyCount: 8,  speed: 2,   timeLimit: 60 },
  { enemyCount: 14, speed: 4,   timeLimit: 40 },
  { enemyCount: 20, speed: 8,   timeLimit: 20 },
];


const DIRECTIONS = [
  { x: 1,  y: 0 },
  { x: -1, y: 0 },
  { x: 0,  y: 1 },
  { x: 0,  y: -1 },
];

let ASSET_PATHS = {
  player: 'data/circle1.png',
  enemy: 'data/square.png',
  bonus: 'data/circle2.png',
  attackSFX: 'data/burst.mp3',
};

const Cell = {
  isSame(a, b) {
    return a.x === b.x && a.y === b.y;
  },
  distance(a, b) { 
    return abs(a.x - b.x) + abs(a.y - b.y);
  },
};

class Grid {
  constructor() {
    this.cols = CONFIG.grid.cols;
    this.rows = CONFIG.grid.rows;
    this.cellSize = CONFIG.grid.cellSize;
  }
  toPixel(cell) {
    return { x: cell.x * this.cellSize, 
             y: cell.y * this.cellSize };
  }

  contains(cell) {
    return cell.x >= 0 && cell.x < this.cols && cell.y >= 0 && cell.y < this.rows;
  }

  randomCell() {
    return { x: floor(random(this.cols)), 
             y: floor(random(this.rows)) };
  }

  isSame(a, b) { return a.x === b.x && a.y === b.y; }

  draw() {
    stroke(180);
    strokeWeight(1);

    for (let x = 0; x <= width; x += this.cellSize) line(x, 0, x, height);
    for (let y = 0; y <= height; y += this.cellSize) line(0, y, width, y);
  }
}

class Player {
  constructor(gridObject) {
    this.gridObject = gridObject;
    this.image = ASSET_PATHS.player;
    this.cell = {x : 8, y : 4};
    this.effectAlpha = 0;
  }

  drawEffect() {
    const cellSize = CONFIG.grid.cellSize;
    const size = ((CONFIG.attackSize * 2) + 1) * cellSize;
    const { x, y } = this.gridObject.toPixel(this.cell);
    noStroke();
    fill(100, 100, 150, this.effectAlpha);
    rect(x - cellSize, y - cellSize, size, size);
  }

  draw() {
    const { x, y } = this.gridObject.toPixel(this.cell);
    image(this.image, x, y, this.gridObject.cellSize, this.gridObject.cellSize);

    if (this.effectAlpha > 0) {
      this.effectAlpha -= CONFIG.effect.fadeSpeed;
    }
    this.drawEffect();
  }
}

class Monster {
  constructor(gridObject, monsters) {
    this.gridObject = gridObject;
    this.image = ASSET_PATHS.enemy;
    this.alive = true;
    this.monsters = monsters;

    this.cell = {x : 0, y : 0};
    this.target = {x : 0, y : 0};
    this.drawPos = gridObject.toPixel(this.cell);  
    this.spawn();
  }

  spawn() {

    this.cell = this.gridObject.randomCell();
    this.drawPos = this.gridObject.toPixel(this.cell);
    for(const m of this.monsters){
      while (Cell.distance({x: 8, y : 4}, this.cell) < CONFIG.minSpawnDistance || Cell.isSame(m.cell, this.cell)) {
        this.cell = this.gridObject.randomCell();
        this.drawPos = this.gridObject.toPixel(this.cell);
      }
    }
    this.target.x = this.cell.x;
    this.target.y = this.cell.y;
  }

  chooseNextTarget() {
    
    const dir = random(DIRECTIONS);
    const next = { x: this.cell.x + dir.x, y: this.cell.y + dir.y };

    if(!this.gridObject.contains(next))return;
    for(const m of this.monsters){
      if(m !== this && Cell.isSame(m.target, next))return;
    }
    this.target = next;
  }

  draw(wave, speed) {
    if(this.alive == false) return;
    let distance = abs(this.drawPos.x - this.gridObject.toPixel(this.target).x) + abs(this.drawPos.y - this.gridObject.toPixel(this.target).y)
    if (distance > 10) {
      this.drawPos.x += (this.gridObject.toPixel(this.target).x - this.drawPos.x) * speed / 60;
      this.drawPos.y += (this.gridObject.toPixel(this.target).y - this.drawPos.y) * speed / 60;
    } else {
      this.cell.x = this.target.x;
      this.cell.y = this.target.y;
      this.chooseNextTarget();
    }

    image(this.image, 20 + this.drawPos.x + wave, 20 + this.drawPos.y, 40, 40);
  }
}


class Bonus {
  constructor(gridObject) {
    this.gridObject = gridObject;
    this.image = ASSET_PATHS.bonus;
    this.active = false;
    this.cell = { x: 0, y: 0 };
    this.timer = 0; 
  }

  trySpawn() {
    if (this.active || this.timer < 60 * CONFIG.bonus.interval) return;
    this.active = true;
    this.timer = 0;
    this.cell = this.gridObject.randomCell();
  }

  draw() {
    this.timer++;
    if (!this.active) return;
    const { x, y } = this.gridObject.toPixel(this.cell);
    image(this.image, x + 20, y + 20, 40, 40);
  }

  tryCollect(playerCell) {
    if (!this.active || !Cell.isSame(this.cell, playerCell)) return 0;
    this.active = false;
    this.timer = 0;
    return CONFIG.bonus.score;
  }
}


class Hud {
  constructor(){
    this.stage = 1;
    this.centerText = '';
    this.textAlpha = 0;
  }
  draw(time, score) {
    const { x, y, width: w, height: h } = CONFIG.ui;

    noStroke();
    fill(0, 0, 0, 150);
    rect(x, y, w, h);

    fill(255);
    textSize(20);
    text('Stage : ' + this.stage, x + 15, y + 28);
    text('Score : ' + score, x + 15, y + 58);

    this.drawTimerBar(time, x + 15, y + 102);
    this.drawCenterText();
    if (this.textAlpha > 0) {
      this.textAlpha -= CONFIG.text.fadeSpeed;
    }
  }

  drawTimerBar(time, x, y) {
    const { barWidth, barHeight } = CONFIG.ui;
    const ratio = time / STAGES[this.stage - 1].timeLimit;

    noStroke();
    fill(100);
    rect(x, y, barWidth, barHeight);

    fill(46, 204, 113);
    rect(x, y, barWidth * ratio, barHeight);

    fill(255);
    textSize(16);
    text('Time : ' + nf(time, 2, 1) + 's', x + 8, y + 15);
  }

  drawCenterText() {
    fill(255, 255, 255, this.textAlpha);
    textSize(60);
    text(this.centerText, width / 2 - 100, height / 2);
  }
}

class State {
  constructor(game){
    this.g = game;
  }
  update(){}
  render(){}
  onKeyPressed(){}
  onMousePressed(){}
}

class PlayingState extends State {
  update() {

    for(const m of this.g.monsters){
      if(Cell.isSame(this.g.player.cell, m.cell) || this.g.time < 0){
        this.g.end(0);
        return;
      }
    }

    this.g.time -= 1 / 60;
    this.g.theta += CONFIG.wave.speed;
    this.g.hud.draw(this.g.time, this.g.score);
    this.g.bonus.trySpawn();
    this.g.bonus.draw();
    this.g.score += this.g.bonus.tryCollect(this.g.player.cell);
    this.g.player.draw();

    for(const m of this.g.monsters){
        if(m.alive == true){ m.draw(this.g.wave, STAGES[this.g.stage - 1].speed ) }
    }

    this.checkStageClear();
  }

  checkStageClear() {
    for(const m of this.g.monsters){
      if(m.alive == true) return;
    }
    this.g.nextStage();
  }

  onKeyPressed(inputKey) {
    switch (inputKey) {
      case "w":
        this.g.player.cell.x += DIRECTIONS[3].x;
        this.g.player.cell.y += DIRECTIONS[3].y;
        break;
      case "a":
        this.g.player.cell.x += DIRECTIONS[1].x;
        this.g.player.cell.y += DIRECTIONS[1].y;
        break;
      case "s":
        this.g.player.cell.x += DIRECTIONS[2].x;
        this.g.player.cell.y += DIRECTIONS[2].y;
        break;
      case "d":
        this.g.player.cell.x += DIRECTIONS[0].x;
        this.g.player.cell.y += DIRECTIONS[0].y;
        break;
    }
  }

  onMousePressed() {
    for(const m of this.g.monsters){
        if(abs(m.cell.x - this.g.player.cell.x) <= CONFIG.attackSize && abs(m.cell.y - this.g.player.cell.y) <= CONFIG.attackSize){
          this.g.score++;
          m.alive = false;
          m.cell = {x: -42, y: -42};
        }
    }
    this.g.player.effectAlpha = 255;
    this.attackSFX = ASSET_PATHS.attackSFX;
    if (this.attackSFX.isPlaying()) {
      this.attackSFX.stop();
    }
    this.attackSFX.play();
  }
}

class StageIntroState extends State {

  update() {

    background(50);
    this.g.hud.centerText = 'Next Stage···';
    this.g.hud.draw(this.g.time, this.g.score);

    if (this.g.frames >= CONFIG.stageStartTime * 60) {
      this.g.hud.centerText = 'Stage ' + this.g.stage;
      this.g.state = new PlayingState(this.g);
    }
    this.g.hud.textAlpha = 255;
  }
}

class EndState extends State {

  update(){
    if (this.g.endState == 0) {
      background(30);
      this.g.hud.centerText = 'Game Over\nScore : ' + this.g.score;
    }
    else if (this.g.endState == 1) {
      background(80);
      this.g.hud.centerText = 'Game Clear\nScore : ' + this.g.score;
    }
    this.g.hud.textAlpha = 255;
    this.g.hud.draw(this.g.time, this.g.score);
  }
}

class Game {
  constructor() {
    this.grid = new Grid();
    this.player = new Player(this.grid);
    this.bonus = new Bonus(this.grid);
    this.hud = new Hud();
    this.attackSFX = ASSET_PATHS.attackSFX;
    
    this.stage = 1;
    this.score = 0;
    this.time = 0;
    this.speed = 0;
    this.monsters = [];

    this.endState = -1;
    this.frames = 0;        
    this.theta = 0;
    this.wave = 0;

    this.state = new PlayingState(this);

    this.startStage();
  }

  startStage() {
    this.frames = 0;
    this.hud.stage = this.stage;
    this.player.cell = {x : 8, y : 4};
    if (this.stage > STAGES.length) return;
    this.time = STAGES[this.stage - 1].timeLimit;
    this.monsters = [];
    for(let i = 0; i < STAGES[this.stage - 1].enemyCount; i++){
      this.monsters.push(new Monster(this.grid, this.monsters));
    }
  }

  nextStage() {
    this.stage++;
    if(this.stage > STAGES.length){
      this.end(1);
      return;
    }
    this.startStage();
    this.state = new StageIntroState(this);
  }

  end(num) {
    this.endState = num;
    this.state = new EndState(this);
    
  }

  draw(){
    background(150);
    this.grid.draw();

    this.frames += 1;
    this.wave = CONFIG.wave.width * sin(this.theta);
    this.state.update();

  }
}

// --메인---------

let game;

async function setup() {
  createCanvas(CONFIG.canvas.width, CONFIG.canvas.height);

  const assets = {
    player: await loadImage(ASSET_PATHS.player),
    enemy: await loadImage(ASSET_PATHS.enemy),
    bonus: await loadImage(ASSET_PATHS.bonus),
    attackSFX: await loadSound(ASSET_PATHS.attackSFX),
  };
  ASSET_PATHS = assets;
  game = new Game();
}

function draw() {
  if (!game) return;
  game.draw();
}
function mousePressed() {
  game.state.onMousePressed();
}

function keyPressed() {
  game.state.onKeyPressed(key);
}