package com.hyebin.todo.repository;

import com.hyebin.todo.domain.entity.Todo;
import com.hyebin.todo.domain.enums.Priority;
import com.hyebin.todo.domain.enums.Status;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TodoRepository extends JpaRepository<Todo, Long> {
    List<Todo> findAllByOrderByCreatedAtDesc();
    List<Todo> findAllByOrderByDueDateAsc();

    List<Todo> findByTitleContaining(String title);
    List<Todo> findByTag_Id(Long tagId);
    List<Todo> findByStatus(Status status);
    List<Todo> findByPriority(Priority priority);

    long countByStatus(Status status);
}
