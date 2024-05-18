package com.smurfs.mathic.dto;

import com.smurfs.mathic.model.GameStatus;
import com.smurfs.mathic.model.User;

public class GameInfo {
    private String gameId;
    private User player1;
    private GameStatus status;

    public GameInfo(String gameId, User player1, GameStatus status) {
        this.gameId = gameId;
        this.player1 = player1;
        this.status = status;
    }

    public String getGameId() {
        return gameId;
    }


    public User getPlayer1() {
        return player1;
    }


    public GameStatus getStatus() {
        return status;
    }

}
