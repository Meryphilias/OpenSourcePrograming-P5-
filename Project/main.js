
let playerGif;
let enemyGif;
let attackSFX;

let gridCoordX = [];
let gridCoordY = [];

let monsterCount = 20;
let isMonster = [];
let monstersPosX = [];
let monstersPosY = [];
let drawMonstersPosX = [];
let drawMonstersPosY = [];

let monsterColors = [
  [46, 204, 113],
  [241, 196, 15],
  [231, 76, 60],
  [230, 126, 34]
];

let monsterOwnColors = [];

let targetPosX = [];
let targetPosY = [];

let monsterMoving = [];

let playerPosXindex = 8;
let playerPosYindex = 4;

let effectAhlpa = 0;
let ahlapFadeSpeed = 10;
let speed = 1.5;
let r = 0;

let wave = 0;
let theta = 0;
let waveWidth = 10;

const MIN_DISTANCE = 3;


async function setup() {
  createCanvas(1280, 720);
  background(150);

  initGameData();
  playerGif = await loadImage('data/mari.gif');
  enemyGif = await loadImage('data/muffin.gif');
  attackSFX = await loadSound('data/AttackSound.mp3');

  drawGrid();
  drawPlayer(
    gridCoordX[playerPosXindex],
    gridCoordY[playerPosYindex]
  );
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
  fill(0, 0, 200);
  noStroke();


  image(playerGif, outPositionX, outPositionY, 80, 80);

  /*
  ellipse(
    40 + outPositionX,
    25 + outPositionY,
    26, 26
  );

  beginShape();
  vertex(40 + outPositionX, 38 + outPositionY);
  vertex(20 + outPositionX, 70 + outPositionY);
  vertex(60 + outPositionX, 70 + outPositionY);
  endShape(CLOSE);*/
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

function isSpawnPositionOccupied(x, y) {
  for (let i = 0; i < monstersPosX.length; i++) {
    if (
      monstersPosX[i] === x &&
      monstersPosY[i] === y
    ) {
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
    r = random(1); 
 
    if (r < 0.1) { 
      monsterOwnColors[i] = monsterColors[0]; 
    } else if (r < 0.3) { 
      monsterOwnColors[i] = monsterColors[1]; 
    } else if (r < 0.5) { 
      monsterOwnColors[i] = monsterColors[2]; 
    } else { 
      monsterOwnColors[i] = monsterColors[3]; 
    }     
 
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
  monstersPosX[i] = targetPosX[i] 
  monstersPosY[i] = targetPosY[i] 
   
  if(monstersPosX[i] - playerPosXindex == 0 && monstersPosY[i] - playerPosYindex == 0) return 
  if(abs(monstersPosX[i] - playerPosXindex) >= abs(monstersPosY[i] - playerPosYindex)){ 
    monstersPosX[i] - playerPosXindex > 0 ? targetPosX[i]-- : targetPosX[i]++; 
  } 
  else{ 
    monstersPosY[i] - playerPosYindex > 0 ? targetPosY[i]-- : targetPosY[i]++; 
  } 
  if(isMonsterTargetDuplicate(i)){
    targetPosX[i] = monstersPosX[i];
    targetPosY[i] = monstersPosY[i];
  }
} 
 
function drawMonster(outPositionX, outPositionY, monsterColor) { 
  fill(monsterColor); 
  noStroke(); 
  image(enemyGif, 20 + outPositionX, 20 + outPositionY, 40, 40);
  //ellipse(40 + outPositionX, 40 + outPositionY, 50, 50); 
} 
 
function updateMonstersMovement(index, monsterColor) { 
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
 
  drawMonster(drawMonstersPosX[index] + wave, drawMonstersPosY[index], monsterColor); 
} 
 
function drawMonsterOverlapCounts() { 
  let counts = []; 
  let distance = 20; 
 
  for (let i = 0; i < monsterCount; i++) { 
    counts[i] = 1; 
  } 
 
  for (let i = 0; i < monsterCount; i++) { 
    if(counts[i] == 0) continue; 
    for (let j = i + 1; j < monsterCount; j++) { 
      let x = (drawMonstersPosX[i] - drawMonstersPosX[j]) * (drawMonstersPosX[i] - drawMonstersPosX[j]); 
      let y = (drawMonstersPosY[i] - drawMonstersPosY[j]) * (drawMonstersPosY[i] - drawMonstersPosY[j]); 
      if (sqrt(x + y) < distance) { 
        counts[i]++; 
        counts[j] = 0; 
      } 
    } 
  } 
 
  for (let i = 0; i < monsterCount; i++) { 
    if (counts[i] > 1) { 
       
      fill(255);           
      //textSize(20);        
      //textAlign(CENTER, CENTER);  
       
      let textX = drawMonstersPosX[i] + 40 + wave; 
      let textY = drawMonstersPosY[i] + 40; 
      //text(counts[i], textX, textY); 
         
    } 
  } 
} 
 
function drawMonstersTotal(){ 
  for (let i = 0; i < monsterCount; i++) { 
    if(isMonster[i] == false) continue;

    updateMonstersMovement(i, monsterOwnColors[i]); 
    drawMonsterOverlapCounts(); 
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
    }
  }
}
 
function staticLogic(){ 
 
  background(150); 
  drawGrid(); 
 
  let c = color(100, 100, 150, effectAhlpa); 
  fill(c); 
  rect(gridCoordX[playerPosXindex - 1], gridCoordY[playerPosYindex - 1], 240, 240); 
  theta += 0.1; 
  wave = waveWidth * sin(theta); 
 
} 
 
function dynamicLogic(){ 
  if(effectAhlpa > 0){ 
    effectAhlpa -= ahlapFadeSpeed; 
  } 
  drawPlayer(gridCoordX[playerPosXindex], gridCoordY[playerPosYindex]); 
  if(effectAhlpa >= 150){
    playerAttack(240/2, 240/2);
  }
  drawMonstersTotal(); 
 
} 
 
function draw(){ 
 
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
