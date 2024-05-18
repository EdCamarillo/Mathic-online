package com.smurfs.mathic.model;

public class GamePlay {
    private String gameId;
    private User player;
    private int cardIndex;
    private int targetIndex;

    public GamePlay(String gameId, User player, int cardIndex, int targetIndex) {
        this.gameId = gameId;
        this.player = player;
        this.cardIndex = cardIndex;
        this.targetIndex = targetIndex;
    }

    // Getters and setters
    public String getGameId() {
        return gameId;
    }

    public void setGameId(String gameId) {
        this.gameId = gameId;
    }

    public User getPlayer() {
        return player;
    }

    public void setPlayer(User player) {
        this.player = player;
    }

    public int getCardIndex() {
        return cardIndex;
    }

    public void setCardIndex(int cardIndex) {
        this.cardIndex = cardIndex;
    }

    public int getTargetIndex() {
        return targetIndex;
    }

    public void setTargetIndex(int targetIndex) {
        this.targetIndex = targetIndex;
    }
}
