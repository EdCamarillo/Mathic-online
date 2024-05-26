package com.smurfs.mathic.dto;

import lombok.Data;

@Data
public class GameDto {
    private String gameId;

    private PlayerDto player1;
    
    private PlayerDto player2;

    private PlayerDto winner;

    public GameDto(String gameId, PlayerDto player1, PlayerDto player2, PlayerDto winner) {
        this.gameId = gameId;
        this.player1 = player1;
        this.player2 = player2;
        this.winner = winner;
    }
}
