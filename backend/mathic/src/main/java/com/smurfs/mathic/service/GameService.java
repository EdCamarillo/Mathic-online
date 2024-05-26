package com.smurfs.mathic.service;

import com.smurfs.mathic.dto.GameDto;
import com.smurfs.mathic.dto.PlayerDto;
import com.smurfs.mathic.exceptions.InvalidGameException;
import com.smurfs.mathic.exceptions.InvalidParamException;
import com.smurfs.mathic.exceptions.NotFoundException;
import com.smurfs.mathic.model.Game;
import com.smurfs.mathic.model.GamePlay;
import com.smurfs.mathic.model.GameStatus;
import com.smurfs.mathic.model.User;
import com.smurfs.mathic.storage.GameStorage;
import org.springframework.stereotype.Service;
import java.util.UUID;

import static com.smurfs.mathic.model.GameStatus.*;

@Service
public class GameService {

    public GameDto getGameById(String gameId) throws NotFoundException {
        if (!GameStorage.getInstance().getGames().containsKey(gameId)) {
            throw new NotFoundException("Game not found");
        }
    
        Game game = GameStorage.getInstance().getGames().get(gameId);
        return toGameDto(game);
    }

    private PlayerDto toPlayerDto(User user) {
        return new PlayerDto(user.getId(), user.getUserName());
    }

    private GameDto toGameDto(Game game) {
        return new GameDto(
                game.getGameId(),
                toPlayerDto(game.getPlayer1()),
                game.getPlayer2() != null ? toPlayerDto(game.getPlayer2()) : null
        );
    }

    public GameDto createGame(User player){
        Game game = new Game();
        int[] initialCardValuesPlayer1 = {1, 1}; // Initialize player 1's cards to 1
        int[] initialCardValuesPlayer2 = {1, 1}; // Initialize all card values to 1
        game.setPlayer1Cards(initialCardValuesPlayer1);
        game.setPlayer2Cards(initialCardValuesPlayer2);
        game.setGameId(UUID.randomUUID().toString());

        game.setPlayer1(player);
        game.setStatus(NEW);
        game.setCurrentTurn(player); // Set the initial turn to player 1
        GameStorage.getInstance().setGame(game);

        return toGameDto(game);
    }

    public GameDto leavePlayer1(String gameId) throws InvalidParamException{
        if(!GameStorage.getInstance().getGames().containsKey(gameId)){
            throw new InvalidParamException("Game with provided ID does not exist");
        }

        Game game = GameStorage.getInstance().getGames().get(gameId);

    if (game.getPlayer2() == null) {
        game.setStatus(FINISHED);
    } else {
        game.setPlayer1(game.getPlayer2());
        game.setPlayer2(null);
        game.setStatus(WAITING);
    }

        GameStorage.getInstance().setGame(game);

        // if(game.getPlayer2() == null)
        // {
        //     game.setPlayer1(null);
        //     game.setStatus(FINISHED);
        //     GameStorage.getInstance().setGame(game);
        //     return toGameDto(game);
        // }
        
        // game.setPlayer1(game.getPlayer2());
        // game.setPlayer2(null);
        // game.setStatus(WAITING);
        // GameStorage.getInstance().setGame(game);

        return toGameDto(game);
    }

    public GameDto leavePlayer2(String gameId) throws InvalidParamException{
        if(!GameStorage.getInstance().getGames().containsKey(gameId)){
            throw new InvalidParamException("Game with provided ID does not exist");
        }

        Game game = GameStorage.getInstance().getGames().get(gameId);

        game.setPlayer2(null);
        game.setStatus(WAITING);
        GameStorage.getInstance().setGame(game);

        return toGameDto(game);
    }



    //TODO: IMPLEMENT GAME SURRENDER
    public GameDto finishGameBySurrender(String gameId) throws NotFoundException, InvalidGameException {
        if (!GameStorage.getInstance().getGames().containsKey(gameId)) {
            throw new NotFoundException("Game not found");
        }

        Game game = GameStorage.getInstance().getGames().get(gameId);

        if (game.getStatus() == FINISHED) {
            throw new InvalidGameException("Game is already finished");
        }

        game.setStatus(FINISHED);
        GameStorage.getInstance().setGame(game);

        return toGameDto(game);
    }

    public GameDto connectToGame(User player2, String gameId) throws InvalidParamException, InvalidGameException {
        if(!GameStorage.getInstance().getGames().containsKey(gameId)){
            throw new InvalidParamException("Game with provided ID does not exist");
        }
        Game game = GameStorage.getInstance().getGames().get(gameId);

        if(game.getPlayer2() != null){
            throw new InvalidGameException("Game is not valid");
        }

        game.setPlayer2(player2);
        game.setStatus(IN_PROGRESS);
        GameStorage.getInstance().setGame(game);

        return toGameDto(game);
    }

    public GameDto connectToRandomGame(User player2) throws NotFoundException {
        Game game = GameStorage.getInstance().getGames().values().stream()
                .filter(it->it.getStatus().equals(NEW))
                .findFirst().orElseThrow(()-> new NotFoundException("Game not found"));

        game.setPlayer2(player2);
        game.setStatus(IN_PROGRESS);
        GameStorage.getInstance().setGame(game);

        return toGameDto(game);
    }

    public Game getGameDataById(String gameId) throws NotFoundException {
        if (!GameStorage.getInstance().getGames().containsKey(gameId)) {
            throw new NotFoundException("Game not found");
        }
    
        return GameStorage.getInstance().getGames().get(gameId);
    }

    public Game gamePlay(GamePlay gamePlay) throws NotFoundException, InvalidGameException, InvalidParamException {
        String gameId = gamePlay.getGameId();
        if (!GameStorage.getInstance().getGames().containsKey(gameId)) {
            throw new NotFoundException("Game not found");
        }
    
        Game game = GameStorage.getInstance().getGames().get(gameId);

        if (game.getStatus().equals(FINISHED)) {
            throw new InvalidGameException("Game is already finished");
        }
    
        User currentPlayer = gamePlay.getPlayer();
        // Check turn
        if (!gamePlay.getPlayer().equals(game.getCurrentTurn())) {
            throw new InvalidGameException("It is still " + game.getCurrentTurn().toString() + "'s turn. " + currentPlayer + " tried to move");
        }
    
        // Get the opponent player
        User opponent = (currentPlayer.equals(game.getPlayer1())) ? game.getPlayer2() : game.getPlayer1();
    
        // Get the cards of the current player and the opponent
        int[] currentPlayerCards;
        int[] opponentCards;
        if (currentPlayer.equals(game.getPlayer1())) {
            currentPlayerCards = game.getPlayer1Cards();
            opponentCards = game.getPlayer2Cards();
        }
        else {
            currentPlayerCards = game.getPlayer2Cards();
            opponentCards = game.getPlayer1Cards();
        }
    
        int attackIndex = gamePlay.getCardIndex();
        int targetIndex = gamePlay.getTargetIndex();

        // Validate card indices
        if (attackIndex < 0 || attackIndex >= currentPlayerCards.length || targetIndex < 0 || targetIndex >= opponentCards.length) {
            throw new InvalidParamException("Invalid card index");
        }

        // Ensure that the attack card and the target card are not zero
        if (currentPlayerCards[attackIndex] == 0 || opponentCards[targetIndex] == 0) {
            throw new InvalidGameException("Cannot attack with or target a card with value 0");
        }
    
        // Update the attacked card value
        final int attackerCardValue = currentPlayerCards[attackIndex];
        final int attackedCardValue = opponentCards[targetIndex];
        int newAttackedCardValue = attackedCardValue + attackerCardValue;

        // Check if new attacked card value equals 5, set to 0; otherwise, modulo 5
        if (newAttackedCardValue == 5) {
            newAttackedCardValue = 0;
        } else if (newAttackedCardValue > 5) {
            newAttackedCardValue %= 5;
        }
    
        // Update the attacked card value
        opponentCards[targetIndex] = newAttackedCardValue;
        
        // Check if any player's cards are all 0, indicating a loss
        if (areAllCardsZero(currentPlayerCards) || areAllCardsZero(opponentCards)) {
            // Set game status to FINISHED
            game.setStatus(GameStatus.FINISHED);
        }

        // Switch turn to the opponent
        game.setCurrentTurn(opponent);
    
        // Update the game state in the storage
        GameStorage.getInstance().setGame(game);

        return game;
    }

    private boolean areAllCardsZero(int[] cards) {
        for (int card : cards) {
            if (card != 0) {
                return false;
            }
        }
        return true;
    }
}
