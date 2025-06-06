package com.hyebin.todo.controller;

import com.hyebin.todo.domain.entity.Tag;
import com.hyebin.todo.domain.entity.Todo;
import com.hyebin.todo.domain.enums.Priority;
import com.hyebin.todo.domain.enums.Status;
import com.hyebin.todo.dto.TodoRequestDto;
import com.hyebin.todo.dto.TodoResponseDto;
import com.hyebin.todo.repository.TagRepository;
import com.hyebin.todo.service.TodoService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/todos")
public class TodoController {

    private final TodoService todoService;
    private final TagRepository tagRepository;

    public TodoController(TodoService todoService, TagRepository tagRepository) {
        this.todoService = todoService;
        this.tagRepository = tagRepository;
    }

    // 1. 할 일 등록
    @PostMapping
    public ResponseEntity<TodoResponseDto> createTodo(@Valid @RequestBody TodoRequestDto dto) {
        Tag tag = tagRepository.findById(dto.getTagId()).orElseThrow(() -> new IllegalArgumentException("존재하지 않는 태그"));
        Todo todo = new Todo(
                dto.getTitle(),
                dto.getContent(),
                dto.getDueDate(),
                tag
        );

        if (dto.getStatus() != null) todo.setStatus(dto.getStatus());
        if (dto.getPriority() != null) todo.setPriority(dto.getPriority());

        Todo saved = todoService.createTodo(todo);
        return ResponseEntity.ok(toDto(saved));
    }

    // 2. 모든 할 일 조회
    @GetMapping
    public ResponseEntity<List<TodoResponseDto>> getAllTodos(
            @RequestParam(required = false) String status,      // 상태 필터
            @RequestParam(required = false) String priority,    // 우선순위 필터
            @RequestParam(required = false) String search,      // 검색 키워드
            @RequestParam(required = false) String sort,         // 정렬 방식
            @RequestParam(required = false) Long tagId
    ) {
        List<Todo> todos;

        // 검색
        if (search != null && !search.trim().isEmpty()) {
            todos = todoService.searchTodosByTitle(search);
        }

        // 태그별 필터링
        else if (tagId != null) {
            todos = todoService.getTodosByTag(tagId);
        }

        // 상태별 필터링
        else if (status != null && !status.trim().isEmpty()) {
            Status st;
            try {
                st = Status.valueOf(status.toUpperCase());
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().build();
            }
            todos = todoService.getTodosByStatus(st);
        }

        // 우선순위별 필터
        else if (priority != null && !priority.trim().isEmpty()) {
            Priority pr;
            try {
                pr = Priority.valueOf(priority.toUpperCase());
            } catch (IllegalArgumentException e) {
                return ResponseEntity.badRequest().build();
            }
            todos = todoService.getTodosByPriority(pr);
        }

        // 정렬 기능
        else if ("dueDate".equalsIgnoreCase(sort)) {
            todos = todoService.getTodosByDueDate();
        } else if ("created".equalsIgnoreCase(sort)) {
            todos = todoService.getTodosByCreatedDate();
        }

        // 기본 조회
        else {
            todos = todoService.getAllTodos();
        }

        List<TodoResponseDto> response = todos.stream().map(this::toDto).collect(Collectors.toList());
        return ResponseEntity.ok(response);
    }

    // 3. 특정 할 일 상세 조회
    @GetMapping("/{id}")
    public ResponseEntity<TodoResponseDto> getTodoById(@PathVariable Long id) {
        Todo todo = todoService.getTodoById(id);
        if (todo == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(toDto(todo));
    }

    // 4. 할 일 수정
    @PutMapping("/{id}")
    public ResponseEntity<TodoResponseDto> updateTodo(
            @PathVariable Long id,
            @Valid @RequestBody TodoRequestDto dto) {
        Tag tag = tagRepository.findById(dto.getTagId())
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 태그"));

        Todo updateEntity = new Todo(
                dto.getTitle(),
                dto.getContent(),
                dto.getDueDate(),
                tag
        );

        Todo updated = todoService.updateTodo(id, updateEntity);
        if (updated == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(toDto(updated));
    }

    // 5. 할 일 삭제
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTodo(@PathVariable Long id) {
        boolean deleted = todoService.deleteTodo(id);
        if (!deleted) return ResponseEntity.notFound().build();
        return ResponseEntity.ok().build();
    }

    // 6. 할 일 완료 처리
    @PatchMapping("/{id}/complete")
    public ResponseEntity<TodoResponseDto> completeTodo(@PathVariable Long id) {
        Todo todo = todoService.completeTodo(id);
        if (todo == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(toDto(todo));
    }

    // 7. 할 일 다시 시작 (완료 취소)
    @PatchMapping("/{id}/restart")
    public ResponseEntity<TodoResponseDto> restartTodo(@PathVariable Long id) {
        Todo todo = todoService.restartTodo(id);
        if (todo == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(toDto(todo));
    }

    // 8. 우선순위 변경
    @PatchMapping("/{id}/priority")
    public ResponseEntity<TodoResponseDto> changePriority(
            @PathVariable Long id,
            @RequestParam String priority) {
        Priority pr;
        try {
            pr = Priority.valueOf(priority.toUpperCase());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
        Todo todo = todoService.changePriority(id, pr);
        if (todo == null) return ResponseEntity.notFound().build();
        return ResponseEntity.ok(toDto(todo));
    }

    // 9. 할 일 통계 조회
    @GetMapping("/stats")
    public ResponseEntity<?> getTodoStats() {
        long total = todoService.getTotalCount();
        long completed = todoService.getDoneCount();
        long pending = todoService.getTodoCount();
        return ResponseEntity.ok(new StatsDto(total, completed, pending));
    }

    private TodoResponseDto toDto(Todo todo) {
        TodoResponseDto dto = new TodoResponseDto();
        dto.setId(todo.getId());
        dto.setTitle(todo.getTitle());
        dto.setContent(todo.getContent());
        dto.setDueDate(todo.getDueDate());
        dto.setStatus(todo.getStatus());
        dto.setPriority(todo.getPriority());
        dto.setCreatedAt(todo.getCreatedAt());
        dto.setUpdatedAt(todo.getUpdatedAt());
        if (todo.getTag() != null) {
            dto.setTagName(todo.getTag().getName());
            dto.setTagColor(todo.getTag().getColor());
        }
        return dto;
    }

    public static class StatsDto {
        public long total;
        public long completed;
        public long pending;
        public StatsDto(long total, long completed, long pending) {
            this.total = total;
            this.completed = completed;
            this.pending = pending;
        }
    }
}
