package com.hyebin.todo.controller;

import com.hyebin.todo.domain.entity.Tag;
import com.hyebin.todo.dto.TagRequestDto;
import com.hyebin.todo.dto.TagResponseDto;
import com.hyebin.todo.repository.TagRepository;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/tags")
public class TagController {

    private final TagRepository tagRepository;

    public TagController(TagRepository tagRepository) {
        this.tagRepository = tagRepository;
    }

    // 태그 전체 조회
    @GetMapping
    public ResponseEntity<List<TagResponseDto>> getAllTags() {
        List<TagResponseDto> list = tagRepository.findAll()
                .stream().map(this::toDto).collect(Collectors.toList());
        return ResponseEntity.ok(list);
    }

    // 태그 등록
    @PostMapping
    public ResponseEntity<TagResponseDto> createTag(@Valid @RequestBody TagRequestDto dto) {
        if (tagRepository.existsByName(dto.getName())) {
            return ResponseEntity.badRequest().build();
        }
        Tag tag = new Tag();
        tag.setName(dto.getName());
        tag.setColor(dto.getColor() != null ? dto.getColor() : "#6c757d");
        Tag saved = tagRepository.save(tag);
        return ResponseEntity.ok(toDto(saved));
    }

    // 태그 단일 조회
    @GetMapping("/{id}")
    public ResponseEntity<TagResponseDto> getTagById(@PathVariable Long id) {
        return tagRepository.findById(id)
                .map(tag -> ResponseEntity.ok(toDto(tag)))
                .orElse(ResponseEntity.notFound().build());
    }

    // 태그 삭제
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTag(@PathVariable Long id) {
        if (!tagRepository.existsById(id)) {
            return ResponseEntity.notFound().build();
        }
        tagRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    // ===== 엔티티 -> DTO 변환 =====
    private TagResponseDto toDto(Tag tag) {
        TagResponseDto dto = new TagResponseDto();
        dto.setId(tag.getId());
        dto.setName(tag.getName());
        dto.setColor(tag.getColor());
        return dto;
    }
}
