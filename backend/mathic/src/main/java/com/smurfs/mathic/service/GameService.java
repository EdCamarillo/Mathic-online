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
        int[] initialCardValues = {1, 1}; // Initialize all card values to 1
        game.setPlayer1Cards(initialCardValues);
        game.setPlayer2Cards(initialCardValues);
        game.setGameId(UUID.randomUUID().toString());

        game.setPlayer1(player);
        game.setStatus(NEW);
        game.setCurrentTurn(player); // Set the initial turn to player 1
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
        int[] currentPlayerCards = (currentPlayer.equals(game.getPlayer1())) ? game.getPlayer1Cards() : game.getPlayer2Cards();
        int[] opponentCards = (opponent.equals(game.getPlayer1())) ? game.getPlayer1Cards() : game.getPlayer2Cards();

        int attackIndex = gamePlay.getCardIndex();
        int targetIndex = gamePlay.getTargetIndex();

        // Validate card indices
        if (attackIndex < 0 || attackIndex >= currentPlayerCards.length || targetIndex < 0 || targetIndex >= opponentCards.length) {
            throw new InvalidParamException("Invalid card index");
        }

        // Update the attacked card value
        int attackerCardValue = currentPlayerCards[attackIndex];
        int attackedCardValue = opponentCards[targetIndex];
        int newAttackedCardValue = attackedCardValue + attackerCardValue;

        // Check if new attacked card value exceeds 5
        if (newAttackedCardValue > 5) {
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
