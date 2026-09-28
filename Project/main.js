let gridCoordX = [];
let gridCoordY = [];
let monsterCount = 20;
let monstersPosX = [];
let monstersPosY = [];
let drawMonstersPosX = [];
let drawMonstersPosY = [];
let targetPosX = [];
let targetPosY = [];
let r = 0;
let playerPosXindex = 8;
let playerPosYindex = 4;

let effects = [];

let wave = 0;
let theta = 0;
let waveWidth = 10;

let monsterColors = [[46, 204, 113], [241, 196, 15], [231, 76, 60], [230, 126, 34]];//'Yellow', 'Green', 'Red', 'Orange'
let speed = 1.5;

function setup() {
  createCanvas(1280, 720);
  background(150);

  initGameData();

  drawGrid();
  drawPlayer(gridCoordX[playerPosXindex], gridCoordY[playerPosYindex]);
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

  ellipse(40 + outPositionX, 25 + outPositionY, 26, 26);

  beginShape();
  vertex(40 + outPositionX, 38 + outPositionY); 
  vertex(20 + outPositionX, 70 + outPositionY); 
  vertex(60 + outPositionX, 70 + outPositionY);
  endShape(CLOSE);
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
    let monsterOwnColor;

    if (r < 0.1) {
      monsterOwnColor = monsterColors[0];
    } else if (r < 0.3) {
      monsterOwnColor = monsterColors[1];
    } else if (r < 0.5) {
      monsterOwnColor = monsterColors[2];
    } else {
      monsterOwnColor = monsterColors[3];
    }

    monstersPosX[i] = floor(random(16));
    monstersPosY[i] = floor(random(9));
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
}

function drawMonster(outPositionX, outPositionY, monsterColor) {
  fill(monsterColor);
  noStroke();

  ellipse(40 + outPositionX, 40 + outPositionY, 50, 50);
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
      textSize(20);       
      textAlign(CENTER, CENTER); 
      
      let textX = drawMonstersPosX[i] + 40 + wave;
      let textY = drawMonstersPosY[i] + 40;
      text(counts[i], textX, textY);
        
    }
  }
}

function getBlock(playerPosX, playerPosY) {
  let blockCoords = [];

  for (let dy = -1; dy <= 1; dy++) {
    for (let dx = -1; dx <= 1; dx++) {
      blockCoords.push({
        x: playerPosX + dx,
        y: playerPosY + dy
      });
    }
  }

  return blockCoords;
}



function drawMonstersTotal(){
  for (let i = 0; i < monsterCount; i++) {
    let monsterOwnColor;

    if (r < 0.1) {
      monsterOwnColor = monsterColors[0];
    } else if (r < 0.3) {
      monsterOwnColor = monsterColors[1];
    } else if (r < 0.5) {
      monsterOwnColor = monsterColors[2];
    } else {
      monsterOwnColor = monsterColors[3];
    }


    updateMonstersMovement(i, monsterOwnColor);
    drawMonsterOverlapCounts();
  }
}

function draw(){

  background(150);
  drawGrid();
  drawPlayer(gridCoordX[8], gridCoordY[4]);

  theta += 0.1;
  wave = waveWidth * sin(theta);

  drawMonstersTotal();
  
}

function mousePressed(){
  
}