package com.smurfs.mathic.model;

public class Game {

    private String gameId;
    private User player1;
    private User player2;
    private GameStatus status;
    private int[] player1Cards;
    private int[] player2Cards;
    private User currentTurn;
    private User winner;

    public Game() {
        this.player1Cards = new int[2];
        this.player2Cards = new int[2];
    }

    public int[] getPlayer1Cards() {
        return player1Cards;
    }

    public void setPlayer1Cards(int[] player1Cards) {
        this.player1Cards = player1Cards;
    }

    public int[] getPlayer2Cards() {
        return player2Cards;
    }

    public void setPlayer2Cards(int[] player2Cards) {
        this.player2Cards = player2Cards;
    }

    public void setGameId(String gameId) {
        this.gameId = gameId;
    }

    public String getGameId() {
        return gameId;
    }

    public User getPlayer1() {
        return player1;
    }

    public void setPlayer1(User player1) {
        this.player1 = player1;
    }

    public User getPlayer2() {
        return player2;
    }

    public void setPlayer2(User player2) {
        this.player2 = player2;
    }

    public GameStatus getStatus() {
        return status;
    }

    public void setStatus(GameStatus status) {

        this.status = status;
    }

    public User getCurrentTurn() {
        return currentTurn;
    }

    public void setCurrentTurn(User currentTurn) {
        this.currentTurn = currentTurn;
    }

    public User getWinner(){
        return winner;
    }

    public void setWinner(User winner){
        this.winner = winner;
    }
}

