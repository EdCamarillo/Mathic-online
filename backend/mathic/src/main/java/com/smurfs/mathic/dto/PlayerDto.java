package com.smurfs.mathic.dto;

import lombok.Data;

@Data
public class PlayerDto {
    private Integer id; 

    private String username;

    public PlayerDto(Integer id, String username) {
        this.id = id;
        this.username = username;
    }
}
