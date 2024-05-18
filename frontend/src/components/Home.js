import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../authentication/AuthProvider';

const Home = () => {
  const [users, setUsers] = useState([]);
  const [gameCode, setGameCode] = useState('');
  const { token } = useAuth();
  const navigate = useNavigate();

  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8080/users/', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to fetch users');
      }
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error('Failed to fetch users', error);
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
    fetchData();
  }, []);

  return (
    <div>
      <h2>Users</h2>
      <ul>
        {users.map(user => (
          <li key={user.id}>{user.userName}</li>
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
