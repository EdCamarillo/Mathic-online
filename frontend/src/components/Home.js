import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../authentication/AuthProvider';

const Home = () => {
  const [games, setGames] = useState([]);
  const [gameCode, setGameCode] = useState('');
  const { token } = useAuth();
  const navigate = useNavigate();

  const fetchGames = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/game/all', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch games');
      }
      const data = await response.json();
      setGames(data);
    } catch (error) {
      console.error('Failed to fetch games', error);
    }
  };

  const createGame = async () => {
    try {
      const response = await fetch('http://localhost:8080/game/start', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to create game');
      }
      const data = await response.json();
      navigate(`/room/${data.gameId}`);
    } catch (error) {
      console.error('Failed to create game', error);
    }
  };

  const joinGame = async () => {
    try {
      const response = await fetch('http://localhost:8080/game/connect', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ gameId: gameCode }),
      });
      if (!response.ok) {
        throw new Error('Failed to join game');
      }
      const data = await response.json();
      navigate(`/room/${data.gameId}`);
    } catch (error) {
      console.error('Failed to join game', error);
    }
  };

  useEffect(() => {
    fetchGames();
  }, []);

  return (
    <div>
      <h2>Games</h2>
      <ul>
        {games.map(game => (
          <li key={game.gameId}>
            Game ID: {game.gameId} - Player 1: {game.player1.userName} - Status: {game.status}
          </li>
        ))}
      </ul>
      <div>
        <button onClick={createGame}>Create Game</button>
      </div>
      <div>
        <input
          type="text"
          value={gameCode}
          onChange={(e) => setGameCode(e.target.value)}
          placeholder="Enter game code"
        />
        <button onClick={joinGame}>Join Game</button>
      </div>
    </div>
  );
};

export default Home;
