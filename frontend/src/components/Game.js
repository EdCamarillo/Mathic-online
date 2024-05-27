import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../authentication/AuthProvider';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { Button, Container, Divider, Typography, Box, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';

const Game = () => {
  const { gameId } = useParams();
  const { token, user } = useAuth();
  const [game, setGame] = useState(null);
  const [selectedCardIndex, setSelectedCardIndex] = useState(null);
  const [isPlayer1, setIsPlayer1] = useState(false);
  const [stompClient, setStompClient] = useState(null);
  const [openSurrenderDialog, setOpenSurrenderDialog] = useState(false);
  const [surrendered, setSurrendered] = useState(false);
  const [winner, setWinner] = useState("");
  const navigate = useNavigate();

  const fetchGame = async () => {
    try {
      const response = await fetch(`http://localhost:8080/game/${gameId}/data`, {
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
      setIsPlayer1(data.player1.id === user.id);
    } catch (error) {
      console.error('Failed to fetch game', error);
    }
  };

  useEffect(() => {
    fetchGame();
    const client = new Client({
      webSocketFactory: () => new SockJS('http://localhost:8080/ws'),
      connectHeaders: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      onConnect: () => {
        client.subscribe(`/topic/game-progress/${gameId}`, message => {
          const updatedGame = JSON.parse(message.body);
          setGame(updatedGame);
          setSelectedCardIndex(null);
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
  }, [gameId, token, user]);

  useEffect(() => {
    const determineWinner = () => {
      if (game && game.status === "FINISHED") {
        if (game.winner) {
          setWinner(game.winner.userName);
        } else {
          if (game.player1Cards?.every(card => card === 0)) {
            setWinner(game.player2.userName);
          } else if (game.player2Cards?.every(card => card === 0)) {
            setWinner(game.player1.userName);
          }
        }
      }
    };

    determineWinner();
    fetchGame();
  }, [game, winner]);

  if (!game) {
    return <div>Loading...</div>;
  }

  const handleCardClick = (index, isOwnCard) => {
    if (isOwnCard) {
      if (playerCards[index] !== 0) {
        setSelectedCardIndex(index);
      }
    } else if (selectedCardIndex !== null && opponentCards[index] !== 0) {
      makeMove(selectedCardIndex, index);
    }
  };

  const makeMove = async (cardIndex, targetIndex) => {
    try {
      const response = await fetch(`http://localhost:8080/game/gameplay`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          gameId, 
          player: user, 
          cardIndex, 
          targetIndex 
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to make move');
      }
      const updatedGame = await response.json();
      setGame(updatedGame);
      setSelectedCardIndex(null);
    } catch (error) {
      console.error('Failed to make move', error);
    }
  };

  const handleSplit = async () => {
    try {
      const response = await fetch(`http://localhost:8080/game/gameplay`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gameId,
          player: user,
          cardIndex: 2, // Special index to indicate a split action
          targetIndex: null
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to perform split');
      }
      const updatedGame = await response.json();
      setGame(updatedGame);
    } catch (error) {
      console.error('Failed to perform split', error);
    }
  };

  const isSplitValid = () => {
    const diff = Math.abs(playerCards[0] - playerCards[1]);
    return diff > 1 && isPlayerTurn;
  };

  const handleSurrender = async () => {
    try {
      const response = await fetch(`http://localhost:8080/game/${gameId}/surrender`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          gameId, 
          player: user,
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to surrender');
      }
      const updatedGame = await response.json();
      setWinner(updatedGame.winner.userName);
      setGame(updatedGame);
      setSurrendered(true);
      //fetchGame();
    } catch (error) {
      console.error('Failed to surrender', error);
    }
  }

  const handleLeaveGame = () => {
    navigate("/home");
  };

  const handleSurrenderDialogOpen = () => {
    setOpenSurrenderDialog(true);
  };

  const handleSurrenderDialogConfirm = () => {
    handleSurrender();
    setOpenSurrenderDialog(false);
  };
  
  const handleSurrenderDialogClose = () => {
    setOpenSurrenderDialog(false);
  };

  const defaultCards = Array(2).fill(0);
  const isPlayerTurn = game.status !== "FINISHED" && game.currentTurn && game.currentTurn.id === user.id;
  const playerCards = isPlayer1 ? game.player1Cards || defaultCards : game.player2Cards || defaultCards;
  const opponentCards = isPlayer1 ? game.player2Cards || defaultCards : game.player1Cards || defaultCards;

  return (
    <Container>
      <Typography variant="body2" color="textSecondary">
        Game ID: {game.gameId}
      </Typography>

      <Box display="flex" flexDirection="column" alignItems="center" height="100vh" m={0}>

        <Box display="flex" justifyContent="center" mb="auto" mt={2}>
          <Box>
            <h3>{isPlayer1 ? (game.player2 && game.player2.userName) : (game.player1 && game.player1.userName)}</h3>
            {opponentCards && opponentCards.map((cardValue, index) => (
              <Button
                key={index}
                variant="contained"
                sx={{ 
                  width: 150, 
                  height: 200, 
                  margin: 1, 
                  fontSize: '1.5rem', 
                  color: 'white', 
                  backgroundColor: '#E7767C', 
                  '&:disabled': { backgroundColor: '#cfabad' },
                  '&:hover': { 
                    backgroundColor: '#e38489',
                    transform: 'translateY(10px)',
                    transition: 'transform 0.3s ease'
                  }
                }}
                onClick={() => handleCardClick(index, false)}
                disabled={!isPlayerTurn || selectedCardIndex === null || cardValue === 0}
              >
                {cardValue}
              </Button>
            ))}
          </Box>
        </Box>

        <Box width={'75%'} mt={5} mb={5}>
          <Divider>
            <Typography variant="h5" gutterBottom color={playerCards.every(card => card === 0) ? "#e38489" : "#87B4EE"}>
            {/* {game.status === "FINISHED" && !surrendered
            ? winner
              ? (winner === user?.userName ? "Your Opponent Surrendered!" : "You Surrendered!")
              : "You Surrendered!"
            : winner
              ? `You ${winner === user?.userName ? 'win' : 'lose'}`
              : (isPlayerTurn ? "Your Turn" : "Opponent's Turn")} */}
              {game.status === "FINISHED" && !surrendered
              ? winner
                ? `You ${winner === user?.userName ? 'win' : 'lose'}`
                : (isPlayerTurn ? "Your Turn" : "Opponent's Turn")
              : winner
                ? (winner === user?.userName ? "Your Opponent Surrendered!" : "You Surrendered!")
                : (isPlayerTurn ? "Your Turn" : "Opponent's Turn")}

                
            </Typography>
            {game.status === "FINISHED" && winner !== "" && (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleLeaveGame}
                  sx={{
                    width: 175,
                    height: 50,
                    fontSize: '1rem',
                    marginTop: 2,
                  }}
                >
                  Leave Game
                </Button>
              )}
          </Divider>
        </Box>

        <Box display="flex" justifyContent="center">
          <Box>
            <h3>{isPlayer1 ? (game.player1 && game.player1.userName) : (game.player2 && game.player2.userName)}</h3>
            {playerCards && playerCards.map((cardValue, index) => (
              <Button
                key={index}
                variant="contained"
                sx={{ 
                  width: 150, 
                  height: 200, 
                  margin: 1, 
                  fontSize: '1.5rem', 
                  color: 'white', 
                  backgroundColor: selectedCardIndex === index ? '#87B4EE' : '#91BAD6',
                  '&:disabled': { backgroundColor: '#c2d7ec' },
                  '&:hover': { 
                    backgroundColor: '#a2c9e9',
                    transform: 'translateY(-10px)',
                    transition: 'transform 0.3s ease'
                  }
                }}
                onClick={() => handleCardClick(index, true)}
                disabled={!isPlayerTurn || cardValue === 0}
              >
                {cardValue}
              </Button>
            ))}
          </Box>
        </Box>

        {isPlayerTurn && (
          <Box mt={2}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSplit}
              disabled={!isSplitValid()}
              sx={{
                marginRight: 2,
              }}
            >
              Split
            </Button>
            <Button
              variant="contained"
              color="secondary"
              onClick={handleSurrenderDialogOpen}
            >
              Surrender
            </Button>
          </Box>
        )}
      </Box>

      <Dialog
        open={openSurrenderDialog}
        onClose={handleSurrenderDialogClose}
      >
        <DialogTitle>{"Confirm Surrender"}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to surrender? This will end the game and declare your opponent the winner.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSurrenderDialogClose} color="primary">
            Cancel
          </Button>
          <Button onClick={handleSurrenderDialogConfirm} color="primary" autoFocus>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Game;
