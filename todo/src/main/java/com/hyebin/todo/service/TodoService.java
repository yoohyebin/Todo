package com.hyebin.todo.service;

import com.hyebin.todo.domain.entity.Todo;
import com.hyebin.todo.domain.enums.Priority;
import com.hyebin.todo.domain.enums.Status;
import com.hyebin.todo.repository.TodoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@Transactional
public class TodoService {

    @Autowired
    private TodoRepository todoRepository;

    // 할 일 등록
    public Todo createTodo(Todo todo) {
        if (todo.getDueDate() == null) {
            todo.setDueDate(LocalDateTime.now());
        }
        return todoRepository.save(todo);
    }

    // 모든 할 일 조회
    public List<Todo> getAllTodos() {
        return todoRepository.findAll();
    }

    // ID로 할 일 조회
    public Todo getTodoById(Long id) {
        return todoRepository.findById(id).orElse(null);
    }

    // 할 일 수정
    public Todo updateTodo(Long id, Todo updatedTodo) {
        return todoRepository.findById(id)
                .map(todo -> {
                    todo.setTitle(updatedTodo.getTitle());
                    todo.setContent(updatedTodo.getContent());
                    todo.setDueDate(updatedTodo.getDueDate());
                    todo.setStatus(updatedTodo.getStatus());
                    todo.setPriority(updatedTodo.getPriority());
                    todo.setTag(updatedTodo.getTag());
                    return todoRepository.save(todo);
                })
                .orElse(null);
    }

    // 할 일 삭제
    public boolean deleteTodo(Long id) {
        if (todoRepository.existsById(id)) {
            todoRepository.deleteById(id);
            return true;
        }
        return false;
    }

    // 할 일 완료 처리
    public Todo completeTodo(Long id) {
        return changeStatus(id, Status.DONE);
    }

    // 할 일 다시 시작 (완료 → 대기)
    public Todo restartTodo(Long id) {
        return changeStatus(id, Status.TODO);
    }

    private Todo changeStatus(Long id, Status status) {
        return todoRepository.findById(id)
                .map(todo -> {
                    todo.setStatus(status);
                    return todoRepository.save(todo);
                })
                .orElse(null);
    }

    // 우선순위 변경
    public Todo changePriority(Long id, Priority priority) {
        return todoRepository.findById(id)
                .map(todo -> {
                    todo.setPriority(priority);
                    return todoRepository.save(todo);
                })
                .orElse(null);
    }

    // 완료된 할 일들만 조회
    public List<Todo> getDoneTodos() {
        return todoRepository.findByStatus(Status.DONE);
    }

    // 대기중인 할 일들만 조회
    public List<Todo> getTodoTodos() {
        return todoRepository.findByStatus(Status.TODO);
    }

    // 제목으로 검색
    public List<Todo> searchTodosByTitle(String keyword) {
        return todoRepository.findByTitleContaining(keyword);
    }

    // 태그별 할 일
    public List<Todo> getTodosByTag(Long tagId) {
        return todoRepository.findByTag_Id(tagId);
    }

    // 상태별 할 일
    public List<Todo> getTodosByStatus(Status status) {
        return todoRepository.findByStatus(status);
    }

    // 우선순위별 할 일
    public List<Todo> getTodosByPriority(Priority priority) {
        return todoRepository.findByPriority(priority);
    }

    // 생성일 순으로 정렬
    public List<Todo> getTodosByCreatedDate() {
        return todoRepository.findAllByOrderByCreatedAtDesc();
    }

    // 마감일 순으로 정렬
    public List<Todo> getTodosByDueDate() {
        return todoRepository.findAllByOrderByDueDateAsc();
    }

    // 전체 할 일 개수
    public long getTotalCount() {
        return todoRepository.count();
    }

    // 완료된 할 일 개수
    public long getDoneCount() {
        return todoRepository.countByStatus(Status.DONE);
    }

    // 대기중인 할 일 개수
    public long getTodoCount() {
        return todoRepository.countByStatus(Status.TODO);
    }
}