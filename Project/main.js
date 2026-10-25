let playerImage;
let enemyImage;
let attackSFX;

let pause = false;

let gridCoordX = [];
let gridCoordY = [];

let monsterCount = 0;
let isMonster = [];
let monstersPosX = [];
let monstersPosY = [];
let drawMonstersPosX = [];
let drawMonstersPosY = [];

let targetPosX = [];
let targetPosY = [];

let playerPosXindex = 8;
let playerPosYindex = 4;

let effectAhlpa = 0;
const AHLPA_FADE_SPEED = 10;

let wave = 0;
let theta = 0;
let waveWidth = 10;

let time = 0;
let speed = 0;

const MIN_DISTANCE = 3;

let stage = 1;
let score = 0;
let centerText = '';
let textAhlpa = 0;
const TEXT_FADE_SPEED = 3;

let enemyCountLevel = [3, 5, 8, 14, 20];
let speedLevel = [0.5, 1, 2, 4, 8];
let timeLimitLevel = [90, 80, 60, 40, 20];

const UI_POS_X = 10;
const UI_POS_Y = 10;


async function setup() {
  createCanvas(1280, 720);

  applyStageData();
  initGameData();
  playerImage = await loadImage('data/circle1.png');
  enemyImage = await loadImage('data/square.png');
  attackSFX = await loadSound('data/burst.mp3');

}

function drawGrid() {
  stroke(180);
  strokeWeight(1);

  for (let x = 0; x <= width; x += 80) {
    line(x, 0, x, height);
  }

  for (let y = 0; y <= height; y += 80) {
    line(0, y, width, y);
  }
}

function drawPlayer(outPositionX, outPositionY) {

  image(playerImage, outPositionX, outPositionY, 80, 80);
}

function isMinDistance(x, y) {
  let distance =
    abs(x - playerPosXindex) +
    abs(y - playerPosYindex);
  return distance < MIN_DISTANCE;
}

function isMonsterDuplicate(index){
  for(let i = 0; i < index; i++){
    if(monstersPosX[index] == monstersPosX[i] && monstersPosY[index] == monstersPosY[i]){
      return true;
    }
  }

  return false;
}

function isMonsterTargetDuplicate(index){
  for(let i = 0; i < monsterCount; i++){
    if(isMonster[i] == false || i == index) continue;
    if(targetPosX[index] == targetPosX[i] && targetPosY[index] == targetPosY[i]){
      return true;
    }
  }

  return false;
}



function initGameData() { 
  for (let col = 0; col < 16; col++) { 
      gridCoordX[col] = col * 80; 
  } 
  for (let row = 0; row < 9; row++) { 
      gridCoordY[row] = row * 80; 
  } 
 
  for (let i = 0; i < monsterCount; i++) {   
 
    monstersPosX[i] = floor(random(16)); 
    monstersPosY[i] = floor(random(9)); 

    while(isMinDistance(monstersPosX[i], monstersPosY[i]) || isMonsterDuplicate(i)){
      monstersPosX[i] = floor(random(16)); 
      monstersPosY[i] = floor(random(9)); 
    }
 
    isMonster[i] = true;
    drawMonstersPosX[i] = gridCoordX[monstersPosX[i]]; 
    drawMonstersPosY[i] = gridCoordY[monstersPosY[i]]; 
 
    targetPosX[i] = monstersPosX[i]; 
    targetPosY[i] = monstersPosY[i]; 
   
    if(monstersPosX[i] - playerPosXindex != 0 && monstersPosY[i] - playerPosYindex != 0) 
      if(abs(monstersPosX[i] - playerPosXindex) >= abs(monstersPosY[i] - playerPosYindex)){ 
        monstersPosX[i] - playerPosXindex > 0 ? targetPosX[i]-- : targetPosX[i]++; 
      } 
      else{ 
        monstersPosY[i] - playerPosYindex > 0 ? targetPosY[i]-- : targetPosY[i]++; 
      } 
    } 
} 

function updateTargetPos(i){ 

  monstersPosX[i] = targetPosX[i];
  monstersPosY[i] = targetPosY[i];

  let direction = random(4);
  let nextX = monstersPosX[i];
  let nextY = monstersPosY[i];

  if(direction < 1){
    nextX++;
  }
  else if(direction < 2){
    nextX--;
  }
  else if(direction < 3){
    nextY++;
  }
  else{
    nextY--;
  }

  targetPosX[i] = nextX;
  targetPosY[i] = nextY;

  if(isMonsterTargetDuplicate(i) || nextX < 0 || nextX >= gridCoordX.length || nextY < 0 || nextY >= gridCoordY.length){
    targetPosX[i] = monstersPosX[i];
    targetPosY[i] = monstersPosY[i];
    return;
  };

} 
 
function drawMonster(outPositionX, outPositionY) { 

  image(enemyImage, 20 + outPositionX, 20 + outPositionY, 40, 40);
} 
 
function updateMonstersMovement(index) { 
  let dx = gridCoordX[targetPosX[index]] - drawMonstersPosX[index]; 
  let dy = gridCoordY[targetPosY[index]] - drawMonstersPosY[index]; 
  let distance = sqrt(dx * dx + dy * dy); 
 
  if (distance > 2) { 
    drawMonstersPosX[index] += (dx / distance) * speed; 
    drawMonstersPosY[index] += (dy / distance) * speed; 
  } else { 
    drawMonstersPosX[index] = gridCoordX[targetPosX[index]]; 
    drawMonstersPosY[index] = gridCoordY[targetPosY[index]]; 
    updateTargetPos(index); 
  } 
 
  drawMonster(drawMonstersPosX[index] + wave, drawMonstersPosY[index]); 
} 
 
function drawMonstersTotal(){ 
  for (let i = 0; i < monsterCount; i++) { 
    if(isMonster[i] == false) continue;

    updateMonstersMovement(i); 
  } 
} 
 
function playerMovement(){ 
   
  switch (key) { 
    case 'w': 
      playerPosYindex--; 
      break; 
       
    case 's': 
      playerPosYindex++; 
      break; 
       
    case 'a': 
      playerPosXindex--; 
      break; 
       
    case 'd': 
      playerPosXindex++; 
      break; 
  } 
} 

function playerAttack(x, y){
  for(let i = 0; i < monsterCount; i++){
    if(isMonster[i] == false) continue;
    if(abs(drawMonstersPosX[i] - gridCoordX[playerPosXindex]) < x && abs(drawMonstersPosY[i] - gridCoordY[playerPosYindex]) < y){
      isMonster[i] = false;
      score += 1;
    }
  }
}
 
function getMonsterCount(){
  let count = 0;
  for(let i = 0; i < monsterCount; i++){
    if(isMonster[i]) count++;
  }
  return count;
}

function centerTextLine(){
  fill(255, 255, 255, textAhlpa);
  textSize(60);
  text(centerText, width/2, height/2);
}

function applyStageData(){
  let level = stage - 1;

  monsterCount = enemyCountLevel[level];
  speed = speedLevel[level];
  time = timeLimitLevel[level];
}

function checkStageClear(){
  if(getMonsterCount() > 0) return;

  stage++;
  textAhlpa = 255;
  centerText = 'Stage ' + stage;
  applyStageData();

  isMonster = [];
  monstersPosX = [];
  monstersPosY = [];
  drawMonstersPosX = [];
  drawMonstersPosY = [];
  monsterOwnColors = [];
  targetPosX = [];
  targetPosY = [];

  initGameData();
}

function isPlayerHit(){
  for(let i = 0; i < monsterCount; i++){
    if(isMonster[i] && monstersPosX[i] == playerPosXindex && monstersPosY[i] == playerPosYindex) return true;
  }
  return false;
}

function checkGame(){
  if(isPlayerHit() || time < 0){
    background(30);
    textAhlpa = 255;
    centerText = 'Game Over\nScore : ' + score;
    pause = true;
  }
  if(stage > speedLevel.length){
    background(80);
    textAhlpa = 255;
    centerText = 'Game Clear\nScore : ' + score;
    pause = true;
  }
}

function drawTimerBar(x, y){
  let barWidth = time / timeLimitLevel[stage - 1];

  noStroke();
  fill(100);
  rect(x, y, 170, 20);

  fill(46, 204, 113);
  rect(x, y, 170 * barWidth, 20);

  fill(255);
  textSize(16);
  text('Time : ' + nf(time, 2, 1) + 's', x + 8, y + 15);
}

function drawUI(){

  noStroke();
  fill(0, 0, 0, 150);
  rect(UI_POS_X, UI_POS_Y, 200, 135);

  fill(255);
  textSize(20);
  text('Stage : ' + stage, UI_POS_X + 15, UI_POS_Y + 28);
  text('Score : ' + score, UI_POS_X + 15, UI_POS_Y + 58);
  text('Enemies : ' +  getMonsterCount(), UI_POS_X + 15, UI_POS_Y + 88);

  drawTimerBar(UI_POS_X + 15, UI_POS_Y + 102);

}

function staticLogic(){ 
 
  background(150); 
  checkGame();
  drawGrid(); 
  drawUI();
  centerTextLine();

  theta += 0.1; 
  time -= 1/60;

  let c = color(100, 100, 150, effectAhlpa); 
  fill(c); 
  rect(gridCoordX[playerPosXindex - 1], gridCoordY[playerPosYindex - 1], 240, 240); 

  wave = waveWidth * sin(theta); 
  if(effectAhlpa > 0){ 
    effectAhlpa -= AHLPA_FADE_SPEED; 
  } 
  if(textAhlpa > 0){ 
    textAhlpa -= TEXT_FADE_SPEED; 
  } 
 
} 
 
function dynamicLogic(){ 

  drawPlayer(gridCoordX[playerPosXindex], gridCoordY[playerPosYindex]); 
  if(effectAhlpa >= 150){
    playerAttack(240/2, 240/2);
  }
  drawMonstersTotal(); 

  checkStageClear();
 
} 

function draw(){
  if(pause == true)return;

  staticLogic();
  dynamicLogic();
}
 
function mousePressed(){ 
  effectAhlpa = 255; 
  if(attackSFX.isPlaying()){
    attackSFX.stop();
  }
  attackSFX.play();
} 
function keyPressed(){ 
  playerMovement(); 
}
