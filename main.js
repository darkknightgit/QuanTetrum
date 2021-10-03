const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 32;
// const COLORS = ['cyan', 'orange', 'yellow', 'green', 'blue', 'purple', 'red'];
// const SHAPES = [
//   [[0, 0, 0, 0], [1, 1, 1, 1], [0, 0, 0, 0], [0, 0, 0, 0]],
//   [[2, 0, 0], [2, 2, 2], [0, 0, 0]],
//   [[0, 0, 3], [3, 3, 3], [0, 0, 0]],
//   [[4, 4], [4, 4]],
//   [[0, 5, 5], [5, 5, 0], [0, 0, 0]],
//   [[0, 6, 0], [6, 6, 6], [0, 0, 0]],
//   [[7, 7, 0], [0, 7, 7], [0, 0, 0]]
// ];

const SHAPES = [
  [[0, 0, 0, 0], 
   [4, 2, 3, 1], 
   [0, 0, 0, 0], 
   [0, 0, 0, 0]],

  [[5, 0, 0], 
   [1, 2, 3], 
   [0, 0, 0]],

  [[0, 0, 3], 
   [1, 2, 4], 
   [0, 0, 0]],

  [[1, 3], 
   [2, 5]],

  [[0, 1, 4], 
   [3, 2, 0], 
   [0, 0, 0]],

  [[0, 5, 0], 
   [3, 2, 1], 
   [0, 0, 0]],

  [[2, 3, 0], 
   [0, 1, 4], 
   [0, 0, 0]]
];

const POINTS = {  
  SINGLE: 100,  
  DOUBLE: 300,  
  TRIPLE: 500,  
  TETRIS: 800,  
  SOFT_DROP: 1,  
  HARD_DROP: 2  
}
Object.freeze(POINTS);

const LINES_PER_LEVEL = 10;
const LEVEL = {
  0: 800,
  1: 720,
  2: 630,
  3: 550,
  4: 470,
  5: 380,
  6: 300,
  7: 220,
  8: 130,
  9: 100,
  10: 80
}
Object.freeze(LEVEL);

// const canvas = document.getElementById('boardCanvas');
const boardContext = document.getElementById('BoardCanvas').getContext('2d');
// const canvasNext = document.getElementById('nextTetrominoCanvas');  
const nextTetrominoContext = document.getElementById('NextTetrominoCanvas').getContext('2d');
 
// Calculate size of canvas from constants.
boardContext.canvas.width = COLS * BLOCK_SIZE;
boardContext.canvas.height = ROWS * BLOCK_SIZE;

// Size canvas for four blocks.  
nextTetrominoContext.canvas.width = 4 * BLOCK_SIZE;  
nextTetrominoContext.canvas.height = 4 * BLOCK_SIZE;  
 
// Scale blocks
// boardContext.scale(BLOCK_SIZE, BLOCK_SIZE);
// nextTetrominoContext.scale(BLOCK_SIZE, BLOCK_SIZE);

const KEY = {
  SPACE: 32, 
  LEFT: 37,
  UP: 38,
  RIGHT: 39,
  DOWN: 40
} 
Object.freeze(KEY);

let accountValues = {  
  score: 0,
  lines: 0,
  level: 0
}
 
function updateAccount(key, value) {  
  let element = document.getElementById(key);  
  if (element) {  
    element.textContent = value;  
  }  
}
 
let account = new Proxy(accountValues, {  
  set: (target, key, value) => {  
    target[key] = value;  
    updateAccount(key, value);  
    return true;  
  }  
});

const moves = {
  [KEY.LEFT]:  (p) => ({ ...p, x: p.x - 1 }),  
  [KEY.RIGHT]: (p) => ({ ...p, x: p.x + 1 }),  
  [KEY.DOWN]:  (p) => ({ ...p, y: p.y + 1 }),
  [KEY.UP]:    (p) => board.rotate(p),
  [KEY.SPACE]: (p) => ({ ...p, y: p.y + 1 }),
};

let requestId = null;
let board = null;

class Board {  
  constructor(boardCtx, nextTetrCtx) {
    this.boardCtx = boardCtx;
    this.nextTetrCtx = nextTetrCtx;
    this.boardGrid = this.getEmptyBoard();
    this.isEntanglePresent = false;
    this.entangledBoardPiece = [];
    this.setNextTetromino();
    this.setCurrentTetromino();
  }

  // Get matrix filled with zeros.
  getEmptyBoard() {
    let boardGrid = Array.from(
      {length: ROWS}, () => Array(COLS).fill(0)
    );
    boardGrid[ROWS-1][0] = -1;
    boardGrid[ROWS-1][1] = -1;
    boardGrid[ROWS-1][2] = -1;   
    boardGrid[ROWS-1][3] = -2;
    boardGrid[ROWS-1][4] = -2;
    boardGrid[ROWS-1][5] = -2;   
    boardGrid[ROWS-1][6] = -2;
    
    for (let i = boardGrid[ROWS-1].length - 1; i > 0; i--) {
      let j = Math.floor(Math.random() * (i + 1));
      let temp = boardGrid[ROWS-1][i];
      boardGrid[ROWS-1][i] = boardGrid[ROWS-1][j];
      boardGrid[ROWS-1][j] = temp;
    }
    return boardGrid;
  }

  showXMbuttons() {
    for(let i = 0; i < 4; i++)
      for(let j = 0; j < 4; j++){
        document.getElementById(`(${i},${j})-button`).innerHTML="M";
        document.getElementById(`(${i},${j})-button`).style.visibility="hidden";
      }
        
    for(let i = 0; i < this.currentTetromino.tetrominoGrid.length; i++)
      for(let j = 0; j < this.currentTetromino.tetrominoGrid[i].length; j++){
        document.getElementById(`(${i},${j})-button`).style.fontSize="28px";
        switch(this.currentTetromino.tetrominoGrid[i][j]){
          case 1:  
          case 2:
            document.getElementById(`(${i},${j})-button`).innerHTML = "X";
            document.getElementById(`(${i},${j})-button`).setAttribute("onclick", `flipOperator(${i},${j});`);
            document.getElementById(`(${i},${j})-button`).style.visibility="visible";
            break;
          case 3:
          case 4:
          case 5:
            document.getElementById(`(${i},${j})-button`).innerHTML = "M";
            document.getElementById(`(${i},${j})-button`).setAttribute("onclick", `measureOperator(${i},${j});`);
            document.getElementById(`(${i},${j})-button`).style.visibility="visible";    
            break;
        }        
      };       
  }

  rotate(tetromino){  
    // Clone with JSON
    let p = JSON.parse(JSON.stringify(tetromino));  
    
    // Transpose matrix, p is the tetromino
    for (let y = 0; y < p.tetrominoGrid.length; ++y) {  
      for (let x = 0; x < y; ++x) {  
        [p.tetrominoGrid[x][y], p.tetrominoGrid[y][x]] =   
        [p.tetrominoGrid[y][x], p.tetrominoGrid[x][y]];  
      }  
    }
 
    // Reverse the order of the columns.  
    p.tetrominoGrid.forEach(row => row.reverse());

    return p;
  }
  
  valid(p) {
    return p.tetrominoGrid.every((row, dy) => {
      return row.every((value, dx) => {
        let x = p.x + dx;
        let y = p.y + dy;
        return value === 0 || (this.isInsideWalls(x, y) && this.isNotOccupied(x, y));
      });
    });
  }

  isNotOccupied(x, y) {
    return this.boardGrid[y] && this.boardGrid[y][x] === 0;
  }

  isInsideWalls(x, y) {
    return (
      x >= 0 && // Left wall
      x < COLS && // Right wall
      y < ROWS // Bottom wall
    );
  }

  drop() {
    let p = moves[KEY.DOWN](this.currentTetromino);
    
    if (this.valid(p)) {
      this.currentTetromino.move(p);
    } 
    else {
      this.freeze();
      this.clearLines();
      if (this.currentTetromino.y === 0) { // Game over
        return false;
      }
      this.setCurrentTetromino();
    } 
    return true;
  }

  setNextTetromino() {
    const { width, height } = this.nextTetrCtx.canvas;
    this.nextTetromino = new Tetromino(this.nextTetrCtx);
    this.nextTetrCtx.clearRect(0, 0, width, height);
    this.nextTetromino.drawTetromino();
  }

  setCurrentTetromino() {
    this.currentTetromino = this.nextTetromino;
    this.currentTetromino.boardCtx = this.boardCtx;
    this.currentTetromino.x = 3;
    this.setEntanglement();
    this.showXMbuttons();
    this.setNextTetromino();
  }

  setEntanglement(){
    for(let i = 0; i < this.boardGrid.length; i++)
      for(let j = 0; j < this.boardGrid[i].length; j++){
        if(this.boardGrid[i][j] == -4)
          this.boardGrid[i][j] = -1
        if(this.boardGrid[i][j] == -5)
          this.boardGrid[i][j] = -2
    }
    let isTetroAbleEntangled = false;
    for(let i = 0; i < this.currentTetromino.tetrominoGrid.length; i++)
      for(let j = 0; j < this.currentTetromino.tetrominoGrid[i].length; j++)
        if(this.currentTetromino.tetrominoGrid[i][j] == 4 || this.currentTetromino.tetrominoGrid[i][j] == 5){
          isTetroAbleEntangled = true;
          break;
        }
    if(!isTetroAbleEntangled){
      for(let i = 0; i < this.currentTetromino.tetrominoGrid.length; i++)
        for(let j = 0; j < this.currentTetromino.tetrominoGrid[i].length; j++)
          if(this.currentTetromino.tetrominoGrid[i][j] != 0){
            this.currentTetromino.tetrominoGrid[i][j] = Math.floor(Math.random()*2 + 4);
            break;
          }
    }

    // find the index of a piece on the board for entanglement with a piece in the current tetromino to help players to score
    let entropy = [];
    for(let i = ROWS-1; i >= 0; i--){
      let count0 = 0;
      let count1 = 0;
      let count2 = 0;
      this.boardGrid[i].forEach(element => {if(element == 0) count0++;});
      this.boardGrid[i].forEach(element => {if(element == -1) count1++;});
      this.boardGrid[i].forEach(element => {if(element == -2) count2++;});
      if(count1 == 0 && count2 == 0)
        break;
      else{
        let diff = Math.abs(count1 - count2) - (count0/2);
        if(count1 <= count2)
          entropy.push([i, diff, -1]);
        else
          entropy.push([i, diff, -2]);
      }      
    }

    if(entropy.length == 0){
      this.boardGrid[ROWS-1][0] = -4;
      this.entangledBoardPiece = [ROWS-1, 0]
    }
    else{
      entropy.sort((a, b) => b[1] - a[1])
      // console.log("length entropy = " + entropy.length);
      let entangledBoardPiece_x = entropy[0][0]

      let entangledBoardPiece_Yarray = [];
      this.boardGrid[entropy[0][0]].forEach((element, index) => {
        if(element == entropy[0][2]) 
          entangledBoardPiece_Yarray.push(index);
      });     
      let entangledBoardPiece_y = entangledBoardPiece_Yarray[Math.floor(Math.random()*entangledBoardPiece_Yarray.length)];

      if(this.boardGrid[entangledBoardPiece_x][entangledBoardPiece_y] == -1)
        this.boardGrid[entangledBoardPiece_x][entangledBoardPiece_y] = -4;
      if(this.boardGrid[entangledBoardPiece_x][entangledBoardPiece_y] == -2)
        this.boardGrid[entangledBoardPiece_x][entangledBoardPiece_y] = -5;

      this.entangledBoardPiece = [entangledBoardPiece_x, entangledBoardPiece_y]
    }

    this.isEntanglePresent = true;
  }

  freeze() { 
    this.currentTetromino.tetrominoGrid.forEach((row, y) => {  
      row.forEach((value, x) => {
        switch(value){
          case 3:
            this.boardGrid[y + this.currentTetromino.y][x + this.currentTetromino.x] = -(Math.floor(Math.random()*2) + 1);
            break;
          case 4:
          case 5:
            let flipFlag = Math.floor(Math.random()*2) == 0 ? false : true;
            if(flipFlag){
              if(this.boardGrid[board.entangledBoardPiece[0]][this.entangledBoardPiece[1]] == -4)
                 this.boardGrid[board.entangledBoardPiece[0]][this.entangledBoardPiece[1]] = -2;
              if(this.boardGrid[board.entangledBoardPiece[0]][this.entangledBoardPiece[1]] == -5)
                 this.boardGrid[board.entangledBoardPiece[0]][this.entangledBoardPiece[1]] = -1;
              if(value == 4)
                 this.boardGrid[y + this.currentTetromino.y][x + this.currentTetromino.x] = -2
              if(value == 5)
                 this.boardGrid[y + this.currentTetromino.y][x + this.currentTetromino.x] = -1
            }
            else{
              if(this.boardGrid[board.entangledBoardPiece[0]][this.entangledBoardPiece[1]] == -4)
                 this.boardGrid[board.entangledBoardPiece[0]][this.entangledBoardPiece[1]] = -1;
              if(this.boardGrid[board.entangledBoardPiece[0]][this.entangledBoardPiece[1]] == -5)
                 this.boardGrid[board.entangledBoardPiece[0]][this.entangledBoardPiece[1]] = -2;
              if(value == 4)
                 this.boardGrid[y + this.currentTetromino.y][x + this.currentTetromino.x] = -1
              if(value == 5)
                 this.boardGrid[y + this.currentTetromino.y][x + this.currentTetromino.x] = -2
            }
            break;
          case 2:
          case 1:
            this.boardGrid[y + this.currentTetromino.y][x + this.currentTetromino.x] = -value;  
            break;
        }          
      });  
    });

    // for(let x = 0; x < this.currentTetromino.tetrominoGrid.length; x++)
    //   for(let y = 0; y < this.currentTetromino.tetrominoGrid[x].length; y++){
    //     switch(this.currentTetromino.tetrominoGrid[x][y]){
    //       case 3:
    //         this.boardGrid[x + this.currentTetromino.x][y + this.currentTetromino.y] = -(Math.floor(Math.random()*2) + 1);
    //         break;
    //       case 4:
    //       case 5:
    //         let flipFlag = Math.floor(Math.random()*2) == 0 ? false : true;
    //         if(flipFlag){
    //           if(this.boardGrid[board.entangledBoardPiece[0]][this.entangledBoardPiece[1]] == -4)
    //              this.boardGrid[board.entangledBoardPiece[0]][this.entangledBoardPiece[1]] = -2;
    //           if(this.boardGrid[board.entangledBoardPiece[0]][this.entangledBoardPiece[1]] == -5)
    //              this.boardGrid[board.entangledBoardPiece[0]][this.entangledBoardPiece[1]] = -1;
    //           if(this.boardGrid[x + this.currentTetromino.x][y + this.currentTetromino.y] == -4)
    //              this.boardGrid[x + this.currentTetromino.x][y + this.currentTetromino.y] = -2
    //           if(this.boardGrid[x + this.currentTetromino.x][y + this.currentTetromino.y] == -5)
    //              this.boardGrid[x + this.currentTetromino.x][y + this.currentTetromino.y] = -1
    //         }
    //         else{
    //           if(this.boardGrid[board.entangledBoardPiece[0]][this.entangledBoardPiece[1]] == -4)
    //              this.boardGrid[board.entangledBoardPiece[0]][this.entangledBoardPiece[1]] = -1;
    //           if(this.boardGrid[board.entangledBoardPiece[0]][this.entangledBoardPiece[1]] == -5)
    //              this.boardGrid[board.entangledBoardPiece[0]][this.entangledBoardPiece[1]] = -2;
    //           if(this.boardGrid[x + this.currentTetromino.x][y + this.currentTetromino.y] == -4)
    //              this.boardGrid[x + this.currentTetromino.x][y + this.currentTetromino.y] = -1
    //           if(this.boardGrid[x + this.currentTetromino.x][y + this.currentTetromino.y] == -5)
    //              this.boardGrid[x + this.currentTetromino.x][y + this.currentTetromino.y] = -2
    //         }
    //         break;
    //       case 2:
    //       case 1:
    //         this.boardGrid[x + this.currentTetromino.x][y + this.currentTetromino.y] = -this.currentTetromino.tetrominoGrid[x][y];  
    //         break;
    //     }
    //   }
  }
  
  drawBoard() {
    drawGrid(this.boardCtx, 0, 0, this.boardGrid, BLOCK_SIZE);
  }

  drawEntanglement(){ 
    if(!this.isEntanglePresent)
      return;
    let entangledBoardPiece_x = -1;
    let entangledBoardPiece_y = -1;
    
    let foundEntangledBoardPiece = true;
    entangledBoardPiece_x = this.entangledBoardPiece[0];
    entangledBoardPiece_y = this.entangledBoardPiece[1];
    
    // let foundEntangledBoardPiece = false;
    // for(let i = 0; i < this.boardGrid.length; i++)
    //   for(let j = 0; j < this.boardGrid[i].length; j++)
    //     if(this.boardGrid[i][j] == -4 || this.boardGrid[i][j] == -5){
    //       entangledBoardPiece_x = i;
    //       entangledBoardPiece_y = j;
    //       foundEntangledBoardPiece = true;
    //       break;
    //     }
    
    let entangledTetrominoPiece_x = -1;
    let entangledTetrominoPiece_y = -1;
    let foundEntangledTetrominoPiece = false;
    for(let i = 0; i < this.currentTetromino.tetrominoGrid.length; i++)
      for(let j = 0; j < this.currentTetromino.tetrominoGrid[i].length; j++)
        if(this.currentTetromino.tetrominoGrid[i][j] == 4 || this.currentTetromino.tetrominoGrid[i][j] == 5){          
          entangledTetrominoPiece_x = i;
          entangledTetrominoPiece_y = j;
          foundEntangledTetrominoPiece = true;
          break;
        }
    if(foundEntangledTetrominoPiece && foundEntangledBoardPiece){
      
      let from_x = (entangledBoardPiece_y + 0.5)*BLOCK_SIZE;
      let from_y = (entangledBoardPiece_x + 0.5)*BLOCK_SIZE;
      let to_x = (this.currentTetromino.x + entangledTetrominoPiece_y + 0.5)*BLOCK_SIZE;
      let to_y = (this.currentTetromino.y + entangledTetrominoPiece_x + 0.5)*BLOCK_SIZE;

      this.boardCtx.strokeStyle = "#F3F3EE";
      this.boardCtx.setLineDash([3, 7]);
      this.boardCtx.beginPath();
      this.boardCtx.moveTo(from_x, from_y);
      this.boardCtx.lineTo(to_x, to_y);
      this.boardCtx.stroke();
      this.boardCtx.setLineDash([]);
    }  
  }

  clearLines() {
    let lines = 0;
    let count1 = 0;
    let count2 = 0;
    this.boardGrid.forEach((row, y) => {
      // You score a line if at least 7 pieces are of a same type
      count1 = 0;
      count2 = 0;
      row.forEach(element => {if(element == -1) count1++; if(element == -2) count2++;});
      if (count1 >= 7 || count2 >= 7) {
        lines++; // Increase for cleared line
        
        this.boardGrid.splice(y, 1); // Remove the row.
        
        // Add zero filled row at the top.
        this.boardGrid.unshift(Array(COLS).fill(0));

        if (lines > 0) {
          // Add points if we cleared some lines  
          account.score += this.getLineClearPoints(lines);
          account.lines += lines

          // If we have reached the lines for next level
          if (account.lines >= LINES_PER_LEVEL) {
            // Goto next level
            account.level++;

            // Remove lines so we start working for the next level
            account.lines -= LINES_PER_LEVEL;

            // Increase speed of game
            time.level = LEVEL[account.level];
          }
        }
      }
    });
  }

  getLineClearPoints(lines) {
    const lineClearPoints =
      lines === 1 ? POINTS.SINGLE : 
      lines === 2 ? POINTS.DOUBLE : 
      lines === 3 ? POINTS.TRIPLE : 
      lines === 4 ? POINTS.TETRIS : 
      0;
 
    return (account.level + 1) * lineClearPoints;
  }
}

class Tetromino { 
  constructor(boardCtx) {  
    this.boardCtx = boardCtx;      
    this.tetrominoGrid = SHAPES[Math.floor(Math.random() * SHAPES.length)]; 
    this.x = 0;  
    this.y = 0;  
  }
  
  drawTetromino() {
    drawGrid(this.boardCtx, this.x, this.y, this.tetrominoGrid, BLOCK_SIZE);
  }

  move(p) {  
    this.x = p.x;  
    this.y = p.y;
    this.tetrominoGrid = p.tetrominoGrid;
  }
}

function drawGrid(context, origin_x, origin_y, grid, blockSize){
  function drawArrow(fromx, fromy, tox, toy){
    let r = 6;

    fromx = fromx*blockSize;
    fromy = fromy*blockSize;
    tox = tox*blockSize;
    toy = toy*blockSize;
    context.strokeStyle = "black";

    let headlen = 7; // length of head in pixels
    let dx = tox - fromx;
    let dy = toy - fromy;
    let angle = Math.atan2(dy, dx);
    
    context.beginPath();
    context.moveTo(fromx, fromy);
    context.lineTo(tox, toy);
    context.stroke();

    context.beginPath();
    context.moveTo(tox, toy);
    context.lineTo(tox - headlen * Math.cos(angle - Math.PI / 6), toy - headlen * Math.sin(angle - Math.PI / 6));
    context.stroke();

    context.beginPath();
    context.moveTo(tox, toy);
    context.lineTo(tox - headlen * Math.cos(angle + Math.PI / 6), toy - headlen * Math.sin(angle + Math.PI / 6));
    context.stroke();    
  }

  function drawPiece(topleft_x, topleft_y, type){  
    let COLOR = { "-1": "gray", 
                  "1" : "gray", 
                  "-2": "gray", 
                  "2" : "gray", 
                  "3" : "cyan",
                  "-4": "yellow",
                  "4" : "yellow",
                  "-5": "yellow",
                  "5" : "yellow"
                };
    context.strokeStyle = "black";              
    context.fillStyle = COLOR[type];
    context.rect(topleft_x*blockSize, topleft_y*blockSize, blockSize, blockSize);
    context.fill();
    context.stroke();
    // context.rect(topleft_x*blockSize + 1, topleft_y*blockSize + 1, blockSize - 2, blockSize -2);
    // context.stroke();
  
    switch(type){
      case -4:
      case  4:
      case -1:
      case  1:
        drawArrow(topleft_x, topleft_y + 0.5, topleft_x + 1, topleft_y + 0.5);
        break;
      case  5:
      case -5:
      case -2:
      case  2:
        drawArrow(topleft_x + 0.5, topleft_y + 1, topleft_x + 0.5, topleft_y);
        break;
      case 3:
        drawArrow(topleft_x, topleft_y + 0.5, topleft_x + 1, topleft_y + 0.5);
        drawArrow(topleft_x + 0.5, topleft_y + 1, topleft_x + 0.5, topleft_y);
        // drawArrow(topleft_x, topleft_y, topleft_x + 1, topleft_y + 1);
        // drawArrow(topleft_x, topleft_y + 1, topleft_x + 1, topleft_y);
        break;
    }
  }

  grid.forEach((row, y) => {
    row.forEach((entry, x) => {
      if(entry != 0)
        drawPiece(origin_x + x, origin_y + y, entry)
    });
  });
}

function flipOperator(i, j) {
  switch(board.currentTetromino.tetrominoGrid[i][j]) {
    case 1:
      board.currentTetromino.tetrominoGrid[i][j] = 2;
      break;
    case 2:
      board.currentTetromino.tetrominoGrid[i][j] = 1;
      break;
    case 4:
      board.currentTetromino.tetrominoGrid[i][j] = 5;
      break;
    case 5:
      board.currentTetromino.tetrominoGrid[i][j] = 4;
      break;
  }
}

function hadamardOperator(i, j) {
  if(board.currentTetromino.tetrominoGrid[i][j] == 1 || board.currentTetromino.tetrominoGrid[i][j] == 2) {
      board.currentTetromino.tetrominoGrid[i][j] = 3;      
      document.getElementById(`(${i},${j})-button`).innerHTML = "M";
      document.getElementById(`(${i},${j})-button`).setAttribute("onclick", `measureOperator(${i},${j});`);
      document.getElementById(`(${i},${j})-button`).style.visibility="visible";
  }
}

function measureOperator(i, j){

  switch(board.currentTetromino.tetrominoGrid[i][j]){
    case 3:
      board.currentTetromino.tetrominoGrid[i][j] = Math.floor(Math.random()*2) + 1;
      document.getElementById(`(${i},${j})-button`).innerHTML = "H";
      document.getElementById(`(${i},${j})-button`).setAttribute("onclick", `hadamardOperator(${i},${j});`);
      document.getElementById(`(${i},${j})-button`).style.visibility="visible";
      break;
    case 4:
    case 5:
      flipFlag = Math.floor(Math.random()*2) == 0 ? false : true;
      if(flipFlag){
        if(board.boardGrid[board.entangledBoardPiece[0]][board.entangledBoardPiece[1]] == -4)
          board.boardGrid[board.entangledBoardPiece[0]][board.entangledBoardPiece[1]] = -2;
        if(board.boardGrid[board.entangledBoardPiece[0]][board.entangledBoardPiece[1]] == -5)
          board.boardGrid[board.entangledBoardPiece[0]][board.entangledBoardPiece[1]] = -1;
        if(board.currentTetromino.tetrominoGrid[i][j] == 4)
          board.currentTetromino.tetrominoGrid[i][j] = 2
        if(board.currentTetromino.tetrominoGrid[i][j] == 5)
          board.currentTetromino.tetrominoGrid[i][j] = 1
      }
      else{
        if(board.boardGrid[board.entangledBoardPiece[0]][board.entangledBoardPiece[1]] == -5)
          board.boardGrid[board.entangledBoardPiece[0]][board.entangledBoardPiece[1]] = -2;
        if(board.boardGrid[board.entangledBoardPiece[0]][board.entangledBoardPiece[1]] == -4)
          board.boardGrid[board.entangledBoardPiece[0]][board.entangledBoardPiece[1]] = -1;
        if(board.currentTetromino.tetrominoGrid[i][j] == 4)
          board.currentTetromino.tetrominoGrid[i][j] = 1
        if(board.currentTetromino.tetrominoGrid[i][j] == 5)
          board.currentTetromino.tetrominoGrid[i][j] = 2
      }
      board.isEntanglePresent = false;
      document.getElementById(`(${i},${j})-button`).innerHTML = "E";
      document.getElementById(`(${i},${j})-button`).setAttribute("onclick", `entanglementOperator(${i},${j});`);
      document.getElementById(`(${i},${j})-button`).style.visibility="visible";
      break;
  }
}

function entanglementOperator(i, j){
  if(board.entangledBoardPiece.length != 0){
    if(board.boardGrid[board.entangledBoardPiece[0]][board.entangledBoardPiece[1]] == -1)
      board.boardGrid[board.entangledBoardPiece[0]][board.entangledBoardPiece[1]] = -4
    if(board.boardGrid[board.entangledBoardPiece[0]][board.entangledBoardPiece[1]] == -2)
      board.boardGrid[board.entangledBoardPiece[0]][board.entangledBoardPiece[1]] = -5

    switch(board.currentTetromino.tetrominoGrid[i][j]){
      case 1:
        board.currentTetromino.tetrominoGrid[i][j] = 4;
        break;
      case 2:
        board.currentTetromino.tetrominoGrid[i][j] = 5;  
        break;
      case 3:
        board.currentTetromino.tetrominoGrid[i][j] = Math.floor(Math.random()*2) + 4;
        console.log("ERROR 3")
        break;
      case 4:
        console.log("ERROR 4");
        break;
      case 5:
        console.log("ERROR 3");
        break;
    }

    board.isEntanglePresent = true;
    document.getElementById(`(${i},${j})-button`).innerHTML = "M";
    document.getElementById(`(${i},${j})-button`).setAttribute("onclick", `measureOperator(${i},${j});`);
    document.getElementById(`(${i},${j})-button`).style.visibility="visible";
  }
  else{
    document.getElementById(`(${i},${j})-button`).innerHTML = "H";
    document.getElementById(`(${i},${j})-button`).setAttribute("onclick", `hadamardOperator(${i},${j});`);
    document.getElementById(`(${i},${j})-button`).style.visibility="visible";
  }
}

function handleKeyPress(event) {
  // Stop the event from bubbling.  
  event.preventDefault();

  if (moves[event.keyCode]) {
    // Get new state of tetromino
    let p = moves[event.keyCode](board.currentTetromino);

    if (event.keyCode === KEY.SPACE) {
      // Hard drop
      while (board.valid(p)) {        
        board.currentTetromino.move(p);
        account.score += POINTS.HARD_DROP;
        p = moves[KEY.SPACE](board.currentTetromino);
      }
    }

    if (board.valid(p)) { 
      board.currentTetromino.move(p);
      if (event.keyCode === KEY.DOWN) {
        account.score += POINTS.SOFT_DROP;
      }
      if (event.keyCode === KEY.UP) {
        board.showXMbuttons();
      }  
    }
  }
}

function addEventListener() {
  document.removeEventListener('keydown', handleKeyPress);
  document.addEventListener('keydown', handleKeyPress);
}

function drawGame() {
  const { width, height } = boardContext.canvas;
  boardContext.clearRect(0, 0, width, height);   
 
  board.drawBoard();
  board.currentTetromino.drawTetromino();
  board.drawEntanglement();
}

function resetGame() {
  account.score = 0;
  account.lines = 0;
  account.level = 0;
  board = new Board(boardContext, nextTetrominoContext);
  time = { start: performance.now(), elapsed: 0, level: LEVEL[0] };
}
 
function play() {
  isPaused = true;
  pause();
  resetGame();
  addEventListener();

  // If we have an old game running then cancel it
  if (requestId) {
    cancelAnimationFrame(requestId);
  }
  time.start = performance.now();
  animate();
}

var isPaused = false;
function pause(){
  if(isPaused){
    document.getElementById("pause-button").innerHTML = "Pause";
    for(let i = 0; i <= 3; i++)
      for(let j = 0; j <= 3; j++)
        document.getElementById(`(${i},${j})-button`).disabled = false;
    isPaused = false;
  }    
  else{
    document.getElementById("pause-button").innerHTML = "Resume";
    for(let i = 0; i <= 3; i++)
      for(let j = 0; j <= 3; j++)
        document.getElementById(`(${i},${j})-button`).disabled = true;
    isPaused = true;
  } 
}

time = { start: 0, elapsed: 0, level: 1000 };

function animate(now = 0) {
  if(!isPaused){
    // Update elapsed time.
    time.elapsed = now - time.start;

    // If elapsed time has passed time for current level
    if (time.elapsed > time.level) {
      // Restart counting from now
      time.start = now;

      if (!board.drop()) {
        gameOver();
        return;
      }
    }
    drawGame();
  }  
  requestId = requestAnimationFrame(animate);
}

function gameOver() {
  cancelAnimationFrame(requestId);
  boardContext.fillStyle = 'black';
  boardContext.fillRect(BLOCK_SIZE, 3*BLOCK_SIZE, 8*BLOCK_SIZE, 1.2*BLOCK_SIZE);
  boardContext.font = '30px Arial';
  boardContext.fillStyle = 'red';
  boardContext.fillText('GAME OVER', 1.8*BLOCK_SIZE, 4*BLOCK_SIZE);
}

function readme(){
  var newWindow = window.open();
  let html = document.getElementById("DocumentationPanel").innerHTML;
  newWindow.document.write(html);
}