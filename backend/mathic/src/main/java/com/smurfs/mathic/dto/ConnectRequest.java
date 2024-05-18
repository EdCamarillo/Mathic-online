package com.smurfs.mathic.dto;

public class ConnectRequest {
    private String gameId;

    public ConnectRequest() {
    }

    public ConnectRequest(String gameId) {
        this.gameId = gameId;
    }

    public String getGameId() {
        return gameId;
    }

    public void setGameId(String gameId) {
        this.gameId = gameId;
    }
}

