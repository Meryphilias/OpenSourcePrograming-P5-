const CONFIG = {
  canvas: { width: 1280, height: 720 },
  grid: { cols: 16, rows: 9, cellSize: 80 },
  fps: 60,
  player: {
    start: { x: 8, y: 4 },
    attackSize: 240,      
    minSpawnDistance: 3,    
  },
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

const MOVE_KEYS = {
  w: { x: 0,  y: -1 },
  s: { x: 0,  y: 1 },
  a: { x: -1, y: 0 },
  d: { x: 1,  y: 0 },
};

const DIRECTIONS = [
  { x: 1,  y: 0 },
  { x: -1, y: 0 },
  { x: 0,  y: 1 },
  { x: 0,  y: -1 },
];

const ASSET_PATHS = {
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
  constructor({ cols, rows, cellSize }) {
    this.cols = cols;
    this.rows = rows;
    this.cellSize = cellSize;
  }

  toPixel(cell) {
    return { x: cell.x * this.cellSize, y: cell.y * this.cellSize };
  }

  contains(cell) {
    return cell.x >= 0 && cell.x < this.cols && cell.y >= 0 && cell.y < this.rows;
  }

  randomCell() {
    return { x: floor(random(this.cols)), y: floor(random(this.rows)) };
  }

  draw() {
    stroke(180);
    strokeWeight(1);

    for (let x = 0; x <= width; x += this.cellSize) {
      line(x, 0, x, height);
    }
    for (let y = 0; y <= height; y += this.cellSize) {
      line(0, y, width, y);
    }
  }
}

class Player {
  constructor(grid, image) {
    this.grid = grid;
    this.image = image;
    this.cell = { ...CONFIG.player.start };
    this.effectAlpha = 0;
  }

  get pixel() {
    return this.grid.toPixel(this.cell);
  }

  get isAttacking() {
    return this.effectAlpha >= CONFIG.effect.hitThreshold;
  }

  move(inputKey) {
    const dir = MOVE_KEYS[inputKey];
    if (!dir) return;
    this.cell.x += dir.x;
    this.cell.y += dir.y;
  }

  triggerAttack() {
    this.effectAlpha = 255;
  }

  updateEffect() {
    if (this.effectAlpha > 0) {
      this.effectAlpha -= CONFIG.effect.fadeSpeed;
    }
  }

  drawEffect() {
    const size = CONFIG.player.attackSize;
    const { x, y } = this.pixel;
    noStroke();
    fill(100, 100, 150, this.effectAlpha);
    rect(x - this.grid.cellSize, y - this.grid.cellSize, size, size);
  }

  draw() {
    const { x, y } = this.pixel;
    image(this.image, x, y, this.grid.cellSize, this.grid.cellSize);
  }
}

class Monster {
  constructor(grid, image, cell) {
    this.grid = grid;
    this.image = image;
    this.alive = true;

    this.cell = { ...cell };          
    this.target = { ...cell };          
    this.drawPos = grid.toPixel(cell);  
  }

  chooseNextTarget(manager) {
    this.cell = { ...this.target };

    const dir = DIRECTIONS[floor(random(DIRECTIONS.length))];
    this.target = { x: this.cell.x + dir.x, y: this.cell.y + dir.y };

    if (manager.isTargetTaken(this) || !this.grid.contains(this.target)) {
      this.target = { ...this.cell };
    }
  }

  update(speed, manager) {
    const goal = this.grid.toPixel(this.target);
    const dx = goal.x - this.drawPos.x;
    const dy = goal.y - this.drawPos.y;
    const dist = sqrt(dx * dx + dy * dy);

    if (dist > 2) {
      this.drawPos.x += (dx / dist) * speed;
      this.drawPos.y += (dy / dist) * speed;
    } else {
      this.drawPos = goal;
      this.chooseNextTarget(manager);
    }
  }

  draw(wave) {
    image(this.image, 20 + this.drawPos.x + wave, 20 + this.drawPos.y, 40, 40);
  }

  isInRange(center, rangeX, rangeY) {
    return abs(this.drawPos.x - center.x) < rangeX &&
           abs(this.drawPos.y - center.y) < rangeY;
  }
}

class MonsterManager {
  constructor(grid, image) {
    this.grid = grid;
    this.image = image;
    this.monsters = [];
  }

  clear() {
    this.monsters = [];
  }

  spawn(count, playerCell) {
    this.clear();

    for (let i = 0; i < count; i++) {
      let cell = this.grid.randomCell();
      while (this.isTooCloseToPlayer(cell, playerCell) || this.isOccupied(cell)) {
        cell = this.grid.randomCell();
      }

      const monster = new Monster(this.grid, this.image, cell);
      this.monsters.push(monster);
    }
  }

  get alive() {
    return this.monsters.filter((m) => m.alive);
  }

  get aliveCount() {
    return this.alive.length;
  }

  isTooCloseToPlayer(cell, playerCell) {
    return Cell.distance(cell, playerCell) < CONFIG.player.minSpawnDistance;
  }

  isOccupied(cell) {
    return this.monsters.some((m) => Cell.isSame(m.cell, cell));
  }

  isTargetTaken(self) {
    return this.alive.some((m) => m !== self && Cell.isSame(m.target, self.target));
  }

  isPlayerHit(playerCell) {
    return this.alive.some((m) => Cell.isSame(m.cell, playerCell));
  }

  killInRange(center, rangeX, rangeY) {
    let kills = 0;
    for (const m of this.alive) {
      if (m.isInRange(center, rangeX, rangeY)) {
        m.alive = false;
        kills++;
      }
    }
    return kills;
  }

  updateAndDraw(speed, wave) {
    for (const m of this.alive) {
      m.update(speed, this);
      m.draw(wave);
    }
  }
}


class Bonus {
  constructor(grid, image) {
    this.grid = grid;
    this.image = image;
    this.active = false;
    this.cell = { x: 0, y: 0 };
    this.timer = 0; 
  }

  trySpawn() {
    if (this.active || this.timer < CONFIG.fps * CONFIG.bonus.interval) return;
    this.active = true;
    this.timer = 0;
    this.cell = this.grid.randomCell();
  }

  tick() {
    this.timer += 1;
  }

  draw() {
    if (!this.active) return;
    const { x, y } = this.grid.toPixel(this.cell);
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
  draw(game) {
    const { x, y, width: w, height: h } = CONFIG.ui;

    noStroke();
    fill(0, 0, 0, 150);
    rect(x, y, w, h);

    fill(255);
    textSize(20);
    text('Stage : ' + game.stage, x + 15, y + 28);
    text('Score : ' + game.score, x + 15, y + 58);
    text('Enemies : ' + game.monsters.aliveCount, x + 15, y + 88);

    this.drawTimerBar(game, x + 15, y + 102);
  }

  drawTimerBar(game, x, y) {
    const { barWidth, barHeight } = CONFIG.ui;
    const ratio = game.time / game.stageData.timeLimit;

    noStroke();
    fill(100);
    rect(x, y, barWidth, barHeight);

    fill(46, 204, 113);
    rect(x, y, barWidth * ratio, barHeight);

    fill(255);
    textSize(16);
    text('Time : ' + nf(game.time, 2, 1) + 's', x + 8, y + 15);
  }

  drawCenterText(message, alpha) {
    fill(255, 255, 255, alpha);
    textSize(60);
    text(message, width / 2, height / 2);
  }
}

class Game {
  constructor(assets) {
    this.grid = new Grid(CONFIG.grid);
    this.player = new Player(this.grid, assets.player);
    this.monsters = new MonsterManager(this.grid, assets.enemy);
    this.bonus = new Bonus(this.grid, assets.bonus);
    this.hud = new Hud();
    this.attackSFX = assets.attackSFX;

    this.stage = 1;
    this.score = 0;
    this.time = 0;
    this.speed = 0;

    this.paused = false;
    this.frames = 0;        
    this.theta = 0;
    this.wave = 0;

    this.centerText = '';
    this.textAlpha = 0;

    this.startStage();
  }

  get stageData() {
    return STAGES[min(this.stage, STAGES.length) - 1];
  }

  get isCleared() {
    return this.stage > STAGES.length;
  }

  startStage() {
    if (this.isCleared) return;
    const { enemyCount, speed, timeLimit } = this.stageData;
    this.speed = speed;
    this.time = timeLimit;
    this.monsters.spawn(enemyCount, this.player.cell);
  }

  isStageStarting() {
    return this.stage !== 1 && this.frames < CONFIG.stageStartTime * CONFIG.fps;
  }

  checkStageClear() {
    if (this.monsters.aliveCount > 0) return;

    this.stage++;
    this.showCenterText('Stage ' + this.stage);
    this.startStage();
    this.hud.drawCenterText(this.centerText, this.textAlpha);
    this.frames = 0;
  }

  checkGameState() {
    if (this.monsters.isPlayerHit(this.player.cell) || this.time < 0) {
      background(30);
      this.showCenterText('Game Over\nScore : ' + this.score);
      this.paused = true;
    }
    if (this.isCleared) {
      background(80);
      this.showCenterText('Game Clear\nScore : ' + this.score);
      this.paused = true;
    }
  }

  showCenterText(message) {
    this.centerText = message;
    this.textAlpha = 255;
  }

  drawStatic() {
    background(150);
    this.checkGameState();
    this.grid.draw();
    this.hud.draw(this);
    this.hud.drawCenterText(this.centerText, this.textAlpha);
    this.bonus.trySpawn();

    this.theta += CONFIG.wave.speed;
    this.time -= 1 / CONFIG.fps;
    this.bonus.tick();

    this.player.drawEffect();
    this.wave = CONFIG.wave.width * sin(this.theta);

    this.player.updateEffect();
    if (this.textAlpha > 0) {
      this.textAlpha -= CONFIG.text.fadeSpeed;
    }
  }

  drawDynamic() {
    this.player.draw();

    if (this.player.isAttacking) {
      this.attack();
    }

    this.monsters.updateAndDraw(this.speed, this.wave);
    this.bonus.draw();
    this.score += this.bonus.tryCollect(this.player.cell);
    this.checkStageClear();
  }

  attack() {
    const half = CONFIG.player.attackSize / 2;
    this.score += this.monsters.killInRange(this.player.pixel, half, half);
  }

  update() {
    this.frames += 1;
    if (this.paused || this.isStageStarting()) return;

    this.drawStatic();
    this.drawDynamic();
  }

  onMousePressed() {
    this.player.triggerAttack();
    if (this.attackSFX.isPlaying()) {
      this.attackSFX.stop();
    }
    this.attackSFX.play();
  }

  onKeyPressed(inputKey) {
    this.player.move(inputKey);
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

  game = new Game(assets);
}

function draw() {
  if (!game) return;
  game.update();
}

function mousePressed() {
  if (!game) return;
  game.onMousePressed();
}

function keyPressed() {
  if (!game) return;
  game.onKeyPressed(key);
}