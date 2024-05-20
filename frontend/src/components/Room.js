import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../authentication/AuthProvider';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Container, Box, Typography, Paper, Button, Grid, Divider } from '@mui/material';

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

  const getPlayerColor = (player) => {
    if ((isPlayer1 && player === game.player1) || (!isPlayer1 && player === game.player2)) {
      return '#87B4EE'; // Blue
    } else {
      return '#E7767C'; // Red
    }
  };

  return (
    <Container sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
      <Box sx={{ marginRight: 4 }}>
        <Paper sx={{ padding: 4, borderRadius: 4, bgcolor: '#e8e9ed' }}>
          <Typography variant="h6">Game ID: {game.gameId}</Typography>
        </Paper>
        {isPlayer1 && game.player2 && (
          <Button variant="contained" color="primary" sx={{ marginTop: 2 }} onClick={startGame}>
            Start Game
          </Button>
        )}
      </Box>
      <Grid container spacing={2} alignItems="center" justifyContent="center">
        <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center' }}>
          <Paper sx={{ padding: 4, textAlign: 'center', height: 100, width: 300, borderRadius: 3, bgcolor: getPlayerColor(game.player1) }}>
            <Typography variant="h5">{game.player1.username}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center', mt: 5, mb: 5 }}>
          <Divider sx={{ width: '80%', my: 2 }}>
            <Typography variant="h2">VS</Typography>
          </Divider>
        </Grid>
        <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center' }}>
          {game.player2 ? (
            <Paper sx={{ padding: 4, textAlign: 'center', height: 100, width: 300, borderRadius: 3, bgcolor: getPlayerColor(game.player2) }}>
              <Typography variant="h5">{game.player2.username}</Typography>
            </Paper>
          ) : (
            <Typography variant="h5">Waiting for a challenger...</Typography>
          )}
        </Grid>
      </Grid>
    </Container>
  );
};

export default Room;
