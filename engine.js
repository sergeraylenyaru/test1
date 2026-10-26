(function (root) {
  const SIZE = 8, TYPES = 6;
  const random = () => Math.floor(Math.random() * TYPES);
  function matches(board) {
    const found = new Set();
    for (let row = 0; row < SIZE; row++) for (let col = 0; col < SIZE; col++) {
      const i = row * SIZE + col, type = board[i];
      if (type == null) continue;
      if (col <= SIZE - 3 && type === board[i + 1] && type === board[i + 2]) {
        let j = col; while (j < SIZE && board[row * SIZE + j] === type) found.add(row * SIZE + j++);
      }
      if (row <= SIZE - 3 && type === board[i + SIZE] && type === board[i + 2 * SIZE]) {
        let j = row; while (j < SIZE && board[j * SIZE + col] === type) found.add(j++ * SIZE + col);
      }
    }
    return [...found];
  }
  function adjacent(a,b) { return Math.abs(Math.floor(a/SIZE)-Math.floor(b/SIZE)) + Math.abs(a%SIZE-b%SIZE) === 1; }
  function swap(board,a,b) { [board[a],board[b]] = [board[b],board[a]]; }
  function possible(board) {
    for(let i=0;i<board.length;i++) for(const j of [i+1,i+SIZE]) {
      if(j>=board.length || !adjacent(i,j)) continue;
      swap(board,i,j); const valid=matches(board).length>0; swap(board,i,j);
      if(valid) return [i,j];
    }
    return null;
  }
  function create() {
    let board;
    do {
      board=[];
      for(let i=0;i<SIZE*SIZE;i++) {
        let t;
        do { t=random(); } while ((i%SIZE>=2 && t===board[i-1] && t===board[i-2]) || (i>=SIZE*2 && t===board[i-SIZE] && t===board[i-SIZE*2]));
        board.push(t);
      }
    } while(!possible(board));
    return board;
  }
  function collapse(board,removed) {
    removed.forEach(i=>board[i]=null);
    for(let col=0;col<SIZE;col++) {
      const remaining=[];
      for(let row=SIZE-1;row>=0;row--) if(board[row*SIZE+col]!=null) remaining.push(board[row*SIZE+col]);
      for(let row=SIZE-1;row>=0;row--) board[row*SIZE+col]=remaining.length?remaining.shift():random();
    }
  }
  const engine={SIZE,TYPES,matches,adjacent,swap,possible,create,collapse};
  if(typeof module!=='undefined') module.exports=engine;
  else root.MatchEngine=engine;
})(typeof window!=='undefined'?window:globalThis);
