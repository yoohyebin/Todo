package com.hyebin.todo.dto;

import jakarta.validation.constraints.NotBlank;

public class TagRequestDto {

    @NotBlank(message = "태그명을 입력하세요")
    private String name;

    private String color;

    // Getter, Setter
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }
}
