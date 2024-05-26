package com.smurfs.mathic.controller;

import com.smurfs.mathic.dto.ConnectRequest;
import com.smurfs.mathic.dto.GameDto;
import com.smurfs.mathic.dto.GameInfo;
import com.smurfs.mathic.exceptions.InvalidGameException;
import com.smurfs.mathic.exceptions.InvalidParamException;
import com.smurfs.mathic.exceptions.NotFoundException;
import com.smurfs.mathic.model.Game;
import com.smurfs.mathic.model.GamePlay;
import com.smurfs.mathic.model.User;
import com.smurfs.mathic.service.GameService;
import com.smurfs.mathic.service.UserService;
import com.smurfs.mathic.storage.GameStorage;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@CrossOrigin(origins = "*")
@RestController
@RequestMapping("/game")
public class GameController {

    private final GameService gameService;
    private final UserService userService;
    private final SimpMessagingTemplate simpMessagingTemplate;

    public GameController(GameService gameService, UserService userService, SimpMessagingTemplate simpMessagingTemplate) {
        this.gameService = gameService;
        this.userService = userService;
        this.simpMessagingTemplate = simpMessagingTemplate;
    }

    @PostMapping("/start")
    public ResponseEntity<GameDto> start(@AuthenticationPrincipal User player) {
        GameDto game = gameService.createGame(player);
        List<GameInfo> gamesInfoList = getAllGames().getBody(); // Fetch the updated list of games
        simpMessagingTemplate.convertAndSend("/topic/games-list", gamesInfoList); // Broadcast the updated list
        return ResponseEntity.ok(game);
    }

    @PostMapping("/connect")
    public ResponseEntity<GameDto> connect(@AuthenticationPrincipal User player, @RequestBody ConnectRequest request) throws InvalidParamException, InvalidGameException {
        GameDto game = gameService.connectToGame(player, request.getGameId());
        List<GameInfo> gamesInfoList = getAllGames().getBody(); // Fetch the updated list of games
        simpMessagingTemplate.convertAndSend("/topic/games-list", gamesInfoList); // Broadcast the updated list
        return ResponseEntity.ok(game);
    }

    @PostMapping("/connect/random")
    public ResponseEntity<GameDto> connectRandom(@AuthenticationPrincipal User player) throws NotFoundException {
        GameDto game = gameService.connectToRandomGame(player);

        return ResponseEntity.ok(game);
    }

    @PostMapping("/gameplay")
    public ResponseEntity<Game> gamePlay(@RequestBody GamePlay request) throws InvalidGameException, NotFoundException, InvalidParamException {
        Game game = gameService.gamePlay(request);
        simpMessagingTemplate.convertAndSend("/topic/game-progress/" + game.getGameId(), game);
        return ResponseEntity.ok(game);
    }

    @GetMapping("/all")
    public ResponseEntity<List<GameInfo>> getAllGames() {
        Map<String, Game> gamesMap = GameStorage.getInstance().getGames();
        List<GameInfo> gamesInfoList = new ArrayList<>();

        for (Game game : gamesMap.values()) {
            gamesInfoList.add(new GameInfo(game.getGameId(), game.getPlayer1(), game.getStatus()));
        }

        simpMessagingTemplate.convertAndSend("/topic/games-list", gamesInfoList);

        return ResponseEntity.ok(gamesInfoList);
    }

    @PostMapping("/start-game/{gameId}")
    public ResponseEntity<Void> startGame(@PathVariable String gameId) throws NotFoundException {
        GameDto game = gameService.getGameById(gameId);
        simpMessagingTemplate.convertAndSend("/topic/game-start/" + gameId, game);
        return ResponseEntity.ok().build();
    }


    @GetMapping("/{gameId}")
    public ResponseEntity<GameDto> getGame(@AuthenticationPrincipal User user, @PathVariable String gameId) {
        try {
            GameDto game = gameService.getGameById(gameId);
            simpMessagingTemplate.convertAndSend("/topic/gameplay/" + gameId, game);

            return ResponseEntity.ok(game);
        } catch (NotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/{gameId}/data")
    public ResponseEntity<Game> getGameData(@AuthenticationPrincipal User user, @PathVariable String gameId) {
        try {
            Game game = gameService.getGameDataById(gameId);
            return ResponseEntity.ok(game);
        } catch (NotFoundException e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/players")
    public ResponseEntity<List<User>> getAllPlayers() {
        List<User> players = new ArrayList<>();

        // Retrieve all players from the game storage
        Map<String, Game> games = GameStorage.getInstance().getGames();
        for (Game game : games.values()) {
            if (game.getPlayer1() != null) {
                players.add(game.getPlayer1());
            }
            if (game.getPlayer2() != null) {
                players.add(game.getPlayer2());
            }
        }

        return ResponseEntity.ok(players);
    }

    @PutMapping("/{gameId}/player1")
    public ResponseEntity<GameDto> leavePlayer1(@AuthenticationPrincipal User user, @PathVariable String gameId){
        try{
            GameDto game = gameService.leavePlayer1(gameId);

            simpMessagingTemplate.convertAndSend("/topic/gameplay/" + game.getGameId(), game);

            return ResponseEntity.ok(game);
        }catch(Exception e){
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{gameId}/player2")
    public ResponseEntity<GameDto> leavePlayer2(@AuthenticationPrincipal User user, @PathVariable String gameId){
        try{
            GameDto game = gameService.leavePlayer2(gameId);

            simpMessagingTemplate.convertAndSend("/topic/gameplay/" + game.getGameId(), game);

            return ResponseEntity.ok(game);
        }catch(Exception e){
            return ResponseEntity.badRequest().build();
        }
    }

    @PutMapping("/{gameId}/surrender")
    public ResponseEntity<GameDto> surrender(@PathVariable String gameId)
    {
        try{
            GameDto game = gameService.finishGameBySurrender(gameId);
            simpMessagingTemplate.convertAndSend("/topic/game-progress" + game.getGameId(), game);

            return ResponseEntity.ok(game);
        }catch(Exception e){
            return ResponseEntity.badRequest().build();
        }
    }
}
