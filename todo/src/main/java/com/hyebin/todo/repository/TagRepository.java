package com.hyebin.todo.repository;

import com.hyebin.todo.domain.entity.Tag;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface TagRepository extends JpaRepository<Tag, Long> {
    List<Tag> findByNameContainingIgnoreCase(String name);
    Optional<Tag> findByName(String name);
    boolean existsByName(String name);
}