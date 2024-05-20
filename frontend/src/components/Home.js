import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../authentication/AuthProvider';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Container, Box, Typography, TextField, Button, Paper, Divider, List, ListItem, ListItemText } from '@mui/material';

const Home = () => {
  const [games, setGames] = useState([]);
  const [gameCode, setGameCode] = useState('');
  const { token } = useAuth();
  const navigate = useNavigate();
  const [stompClient, setStompClient] = useState(null);

  useEffect(() => {
    const fetchGames = async () => {
      try {
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
        navigate('/login');
      }
    };

    fetchGames();

    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      connectHeaders: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      onConnect: () => {
        client.subscribe('/topic/games-list', (message) => {
          const updatedGames = JSON.parse(message.body);
          setGames(updatedGames);
        });
      },
      onStompError: (frame) => {
        console.error('Broker reported error: ' + frame.headers['message']);
        console.error('Additional details: ' + frame.body);
      },
    });

    client.activate();
    setStompClient(client);

    return () => {
      if (client) {
        client.deactivate();
      }
    };
  }, [token]);

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

  const joinGame = async (gameId) => {
    try {
      const response = await fetch('http://localhost:8080/game/connect', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ gameId }),
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

  const logout = async () => {
    navigate(`/login`);
  }

  return (
    <Container sx={{ display: 'flex', height: '100vh', padding: 4 }}>
      <Box sx={{ flex: 3, overflow: 'auto', marginRight: 4, bgcolor: '#e8e9ed', padding: 3, borderRadius: 5 }}>
        <Typography variant="h4" gutterBottom>
          Available Games
        </Typography>
        <List>
          {games.map(game => (
            <Paper key={game.gameId} sx={{ marginBottom: 2, padding: 1, borderRadius: 3 }}>
              <ListItem>
                <ListItemText
                  primary={`Player 1: ${game.player1.userName}`}
                  secondary={`Status: ${game.status}`}
                />
                {(game.status === 'NEW' || game.status === 'WAITING') && (
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => joinGame(game.gameId)}
                  >
                    Join Game
                  </Button>
                )}
              </ListItem>
            </Paper>
          ))}
        </List>
      </Box>
      <Box sx={{ flex: 1 }}>
        <Paper sx={{ padding: 4 }}>
          <TextField
            label="Enter game code"
            variant="outlined"
            fullWidth
            margin="normal"
            value={gameCode}
            onChange={(e) => setGameCode(e.target.value)}
          />
          <Button
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 2 }}
            onClick={() => joinGame(gameCode)}
          >
            Join Game
          </Button>
          <Divider sx={{ my: 4 }}>or</Divider>
          <Button
            variant="contained"
            color="secondary"
            fullWidth
            onClick={createGame}
          >
            Create Game
          </Button>
        </Paper>
        <Button
          variant="contained"
          color="error"
          fullWidth
          sx={{ mt: 2 }}
          onClick={logout}
        >
          Logout
        </Button>
      </Box>
    </Container>
  );
};

export default Home;
