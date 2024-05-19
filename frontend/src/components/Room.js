import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../authentication/AuthProvider';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const Room = () => {
  const { gameId } = useParams();
  const [game, setGame] = useState(null);
  const { token, user } = useAuth();
  const navigate = useNavigate();
  const [stompClient, setStompClient] = useState(null);

  useEffect(() => {
    const fetchGame = async () => {
      try {
        const response = await fetch(`http://localhost:8080/game/${gameId}`, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (!response.ok) {
          throw new Error('Failed to fetch game');
        }
        const data = await response.json();
        setGame(data);
      } catch (error) {
        console.error('Failed to fetch game', error);
      }
    };

    fetchGame();

    // Establish WebSocket connection using STOMP
    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      connectHeaders: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      onConnect: () => {
        client.subscribe(`/topic/gameplay/${gameId}`, message => {
          const updatedGame = JSON.parse(message.body);
          setGame(updatedGame);
        });
        // Notify player 2 that game is starting
        client.subscribe(`/topic/game-start/${gameId}`, message => {
          navigate(`/game/${gameId}`);
        });
      },
      onStompError: (frame) => {
        console.error('Broker reported error: ' + frame.headers['message']);
        console.error('Additional details: ' + frame.body);
      },
    });

    client.activate();
    setStompClient(client);

    // Cleanup WebSocket connection and notify server when component unmounts
    return () => {
      if (client) {
        client.deactivate();
      }
    };
  }, [gameId, token, navigate]);

  if (!game) {
    return <div>Loading...</div>;
  }

  const startGame = async () => {
    try {
      const response = await fetch(`http://localhost:8080/game/start-game/${gameId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to start game');
      }
      navigate(`/game/${gameId}`);
    } catch (error) {
      console.error('Failed to start game', error);
    }
  };

  const isPlayer1 = game.player1 && user && game.player1.id === user.id;

  return (
    <div>
      <h2>Game Room</h2>
      <p>Game ID: {game.gameId}</p>
      <p>Player 1: {game.player1.username}</p>
      <p>Player 2: {game.player2 ? game.player2.username : 'Waiting for player 2...'}</p>
      {isPlayer1 && game.player2 && (
        <button onClick={startGame}>Start Game</button>
      )}
    </div>
  );
};

export default Room;
