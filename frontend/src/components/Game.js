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
  const navigate = useNavigate();

  useEffect(() => {
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
        if(data.status !== "FINISHED")
          setIsPlayer1(data.player1.id === user.id);
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
        client.subscribe(`/topic/game-progress/${gameId}`, message => {
          const updatedGame = JSON.parse(message.body);
          setGame(updatedGame);
          setSelectedCardIndex(null); // Reset selected card index after opponent's move
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
      setSelectedCardIndex(null); // Reset selected card index after move
    } catch (error) {
      console.error('Failed to make move', error);
    }
  };

  //TODO: DOES NOT UPDATE THE OTHER PLAYERS WITHOUT REFRESHING
  const handleSurrender = async() =>{
    try {
      const response = await fetch(`http://localhost:8080/game/${gameId}/surrender`,{
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!response.ok) {
        throw new Error('Failed to surrender');
      }
      const updatedGame = await response.json();
      setGame(updatedGame);
      setSurrendered(true);
      stompClient.publish({ destination: `/topic/gameplay/${gameId}`, body: JSON.stringify(updatedGame) });
      navigate("/home");
    } catch (error) {
      console.error('Failed to surrender', error);
    }
  }

  const handleLeaveGame = () =>{
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
  // const isPlayerTurn = game.currentTurn.id === user.id;
  const isPlayerTurn = game.status !== "FINISHED" && game.currentTurn && game.currentTurn.id === user.id;
  const playerCards = isPlayer1 ? game.player1Cards || defaultCards : game.player2Cards || defaultCards;
  const opponentCards = isPlayer1 ? game.player2Cards || defaultCards : game.player1Cards || defaultCards;

  const winner = surrendered
  ? (isPlayer1 ? game.player2.userName : game.player1.userName)
  : (isPlayer1
    ? (game.player1Cards.every(card => card === 0) ? game.player2.userName : game.player1.userName)
    : (game.player2Cards.every(card => card === 0) ? game.player1.userName : game.player2.userName)
  );
  // const winner = surrendered ? (isPlayer1 ? game.player2.userName : game.player1.userName) : (game.player1Cards.every(card => card === 0) ? game.player2.userName : game.player1.userName);
  // const winner = game.player1Cards.every(card => card === 0) ? game.player2.userName : game.player1.userName;
  // const winner = game.player1Cards.every(card => card === 0) ? game.player2.userName : game.player1.userName;

  return (
    <Container>
      <Typography variant="body2" color="textSecondary">
        Game ID: {game.gameId}
      </Typography>

      <Box display="flex" flexDirection="column" alignItems="center" height="100vh" m={0}>

        <Box display="flex" justifyContent="center" mb="auto" mt={2}>
          <Box>
            {/* <h3>{isPlayer1 ? game.player2.userName : game.player1.userName}</h3> */}
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
              {game.status === "FINISHED" 
                // ? `${winner} wins!` 
                ? (winner === user?.userName && !surrendered ? "Your opponent surrendered! EZ" 
                : (winner === user?.userName ? "Congratulations, You win!" : "GG, go next!"))
                : (isPlayerTurn ? "Your Turn" : "Opponent's Turn")}
            </Typography>
            {game.status === "FINISHED" && (
                <Button
                  variant="contained"
                  color="secondary"
                  onClick={handleLeaveGame}
                  sx={{
                    width: 125,
                    height: 30,
                    fontSize: '1.25rem',
                    backgroundColor: '#0096FF',
                    '&:hover': {
                      backgroundColor: '#0000FF'
                    }
                  }}
                >
                  Confirm
                </Button>
            )}
          </Divider>
        </Box>

        <Box display="flex" justifyContent="center" mt="auto" mb={5}>
          <Box>
            <h3>{isPlayer1 ? game.player1.userName : game.player2.userName}</h3>
            {playerCards.map((cardValue, index) => (
              <Button
                key={index}
                variant="contained"
                sx={{ 
                  width: 150, 
                  height: 200, 
                  margin: 1, 
                  fontSize: '1.5rem', 
                  color: 'white', 
                  backgroundColor: '#87B4EE', 
                  '&:disabled': { backgroundColor: '#abc1de' },
                  '&:hover': { 
                    backgroundColor: '#98bded',
                    transform: 'translateY(-10px)',
                    transition: 'transform 0.3s ease'
                  }
                }}
                onClick={() => handleCardClick(index, true)}
                disabled={!isPlayerTurn || selectedCardIndex !== null || cardValue === 0}
              >
                {cardValue}
              </Button>
            ))}
          </Box>
        </Box>
        {game.status !== "FINISHED" && (
          <Button
            variant="contained"
            color="error"
            onClick={handleSurrenderDialogOpen}
            sx={{ mt: 2, marginBottom:"10px" }}
          >
            Surrender
          </Button>
        )}
      </Box>
      <Dialog open={openSurrenderDialog} onClose={handleSurrenderDialogClose}>
        <DialogTitle>Confirm Surrender</DialogTitle>
        <DialogContent>
          <Typography variant="body1">Are you sure you want to surrender?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSurrenderDialogClose} color="primary">
            No
          </Button>
          <Button onClick={handleSurrenderDialogConfirm} color="secondary">
            Yes
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Game;
