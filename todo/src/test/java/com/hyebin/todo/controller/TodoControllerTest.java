package com.hyebin.todo.controller;


import com.fasterxml.jackson.databind.ObjectMapper;
import com.hyebin.todo.domain.entity.Tag;
import com.hyebin.todo.dto.TodoRequestDto;
import com.hyebin.todo.dto.TodoResponseDto;
import com.hyebin.todo.repository.TagRepository;
import com.hyebin.todo.repository.TodoRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;


@SpringBootTest
@AutoConfigureMockMvc
public class TodoControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private TagRepository tagRepository;

    @Autowired
    private TodoRepository todoRepository;

    private Tag testTag;

    @BeforeEach
    void setUp() {
        todoRepository.deleteAll();
        tagRepository.deleteAll();
        testTag = tagRepository.save(new Tag("공부"));
    }

    @Test
    void 할일_등록_테스트() throws Exception {
        TodoRequestDto request = new TodoRequestDto();
        request.setTitle("스프링 공부");
        request.setContent("섹션4 마무리");
        request.setDueDate(LocalDateTime.now().plusDays(1));
        request.setStatus(com.hyebin.todo.domain.enums.Status.TODO);
        request.setPriority(com.hyebin.todo.domain.enums.Priority.HIGH);
        request.setTagId(testTag.getId());

        mockMvc.perform(post("/api/todos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request))
                )
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("스프링 공부"))
                .andExpect(jsonPath("$.tagName").value("공부"));
    }

    @Test
    void 할일_전체_조회_테스트() throws Exception {
        // Given: 할 일 2개 등록
        for (int i = 0; i < 2; i++) {
            TodoRequestDto request = new TodoRequestDto();
            request.setTitle("할일" + i);
            request.setStatus(com.hyebin.todo.domain.enums.Status.TODO);
            request.setPriority(com.hyebin.todo.domain.enums.Priority.MEDIUM);
            request.setTagId(testTag.getId());
            mockMvc.perform(post("/api/todos")
                    .contentType(MediaType.APPLICATION_JSON)
                    .content(objectMapper.writeValueAsString(request)));
        }

        mockMvc.perform(get("/api/todos"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)));
    }

    @Test
    void 할일_상세_조회_테스트() throws Exception {
        // Given: 할 일 등록
        TodoRequestDto request = new TodoRequestDto();
        request.setTitle("상세조회");
        request.setStatus(com.hyebin.todo.domain.enums.Status.TODO);
        request.setPriority(com.hyebin.todo.domain.enums.Priority.LOW);
        request.setTagId(testTag.getId());
        String content = objectMapper.writeValueAsString(request);

        // 등록 → 응답에서 id 추출
        String response = mockMvc.perform(post("/api/todos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(content))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        // id 추출 (TodoResponseDto로 파싱)
        TodoResponseDto saved = objectMapper.readValue(response, TodoResponseDto.class);
        Long id = saved.getId();

        // When & Then: 상세조회
        mockMvc.perform(get("/api/todos/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title").value("상세조회"));
    }

    @Test
    void 할일_삭제_테스트() throws Exception {
        // Given: 할 일 등록
        TodoRequestDto request = new TodoRequestDto();
        request.setTitle("삭제용");
        request.setStatus(com.hyebin.todo.domain.enums.Status.TODO);
        request.setPriority(com.hyebin.todo.domain.enums.Priority.MEDIUM);
        request.setTagId(testTag.getId());

        String response = mockMvc.perform(post("/api/todos")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        // id 추출
        TodoResponseDto saved = objectMapper.readValue(response, TodoResponseDto.class);
        Long id = saved.getId();

        // 삭제
        mockMvc.perform(delete("/api/todos/" + id))
                .andExpect(status().isOk());

        // 확인 (상세조회 시 404 반환)
        mockMvc.perform(get("/api/todos/" + id))
                .andExpect(status().isNotFound());
    }
}
