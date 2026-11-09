import { useState, useEffect  } from 'react';
import { auth, provider } from "./firebase";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";

import { db } from "./firebase";
import { collection, doc, setDoc, getDocs } from "firebase/firestore";


function Square({ value, onSquareClick }) {
  return (
    <button className="square" onClick={onSquareClick}>
      {value}
    </button>
  );
}

function Board({ xIsNext, squares, onPlay }) {
  function handleClick(i) {
    if (calculateWinner(squares) || squares[i]) {
      return;
    }
    const nextSquares = squares.slice();
    if (xIsNext) {
      nextSquares[i] = 'X';
    } else {
      nextSquares[i] = 'O';
    }
    onPlay(nextSquares);
  }

  const winner = calculateWinner(squares);
  let status;
  if (winner) {
    status = 'Winner: ' + winner;
  } else {
    status = 'Next player: ' + (xIsNext ? 'X' : 'O');
  }

  return (
    <>
      <div className="status">{status}</div>
      <div className="board-row">
        <Square value={squares[0]} onSquareClick={() => handleClick(0)} />
        <Square value={squares[1]} onSquareClick={() => handleClick(1)} />
        <Square value={squares[2]} onSquareClick={() => handleClick(2)} />
      </div>
      <div className="board-row">
        <Square value={squares[3]} onSquareClick={() => handleClick(3)} />
        <Square value={squares[4]} onSquareClick={() => handleClick(4)} />
        <Square value={squares[5]} onSquareClick={() => handleClick(5)} />
      </div>
      <div className="board-row">
        <Square value={squares[6]} onSquareClick={() => handleClick(6)} />
        <Square value={squares[7]} onSquareClick={() => handleClick(7)} />
        <Square value={squares[8]} onSquareClick={() => handleClick(8)} />
      </div>
    </>
  );
}

function Game({ user }) {
  const [history, setHistory] = useState([Array(9).fill(null)]);
  const [currentMove, setCurrentMove] = useState(0);
  const xIsNext = currentMove % 2 === 0;
  const currentSquares = history[currentMove];

  // Added state to display all users 
  const [allUsers, setAllUsers] = useState([]);

  function handlePlay(nextSquares) {
    const nextHistory = [...history.slice(0, currentMove + 1), nextSquares];
    setHistory(nextHistory);
    setCurrentMove(nextHistory.length - 1);
  }

  function jumpTo(nextMove) {
    setCurrentMove(nextMove);
  }

  const moves = history.map((squares, move) => {
    let description;
    if (move > 0) {
      description = 'Go to move #' + move;
    } else {
      description = 'Go to game start';
    }
    return (
      <li key={move}>
        <button onClick={() => jumpTo(move)}>{description}</button>
      </li>
    );
  });

  // Added save current user info to Firestore 
  const saveUser = async () => {
    if (!user) return;

    try {
      await setDoc(doc(db, "users", user.uid), {
        name: user.displayName,
        email: user.email,
      });
      console.log("User info saved!");
      alert("Saved user info!");
    } catch (err) {
      console.error("Saving error:", err);
    }
  };

    // Added retrieve all users from Firestore 
  const showAllUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "users"));

      if (querySnapshot.empty) {
        setAllUsers([]);
        return;
      }

      const usersList = [];
      querySnapshot.forEach((doc) => {
        usersList.push(doc.data());
      });
      setAllUsers(usersList);
    } catch (err) {
      console.error("Error retrieving data:", err);
    }
  };

  return (
    <div className="game">
      {/* Added logout */} 
      <div style={{ position: 'absolute', top: '10px', left: '20px' }}>
        <p>Welcome, {user.displayName}</p>
        <button onClick={() => signOut(auth)}>Logout</button>
      </div>

      <div className="game-board" style={{ marginTop: '100px' }}>
        <Board xIsNext={xIsNext} squares={currentSquares} onPlay={handlePlay} />
      </div>

      <div className="game-info" style={{ marginTop: '100px' }}>
        <ol>{moves}</ol>
        {/* Added Firestore UI */}
        <div style={{ marginTop: "20px" }}>
          <button onClick={saveUser}>Save My Info</button>
          <button onClick={showAllUsers} style={{ marginLeft: "10px" }}>
            Show All Players
          </button>
        </div>

        {/* Display all users */}
        <div>
          {allUsers.length === 0 ? null : (
            <div>
              <h3>All Players:</h3>
              {allUsers.map((u, index) => (
                <p key={index}>
                  {u.name} - {u.email} 
                </p>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

/* AUTH WRAPPER */
export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    await signInWithPopup(auth, provider);
  };

  if (!user) {
    return (
      <div>
        <h1>Please Login to Play</h1>
        <button onClick={handleLogin}>
          Sign in with Google
        </button>
      </div>
    );
  }

  return <Game user={user} />;
}


function calculateWinner(squares) {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];
  for (let i = 0; i < lines.length; i++) {
    const [a, b, c] = lines[i];
    if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
      return squares[a];
    }
  }
  return null;
}
