package com.hyebin.todo.controller;

import com.hyebin.todo.domain.entity.Tag;
import com.hyebin.todo.dto.TagRequestDto;
import com.hyebin.todo.dto.TagResponseDto;
import com.hyebin.todo.repository.TagRepository;
import com.hyebin.todo.repository.TodoRepository;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/tags")
public class TagController {

    private final TagRepository tagRepository;
    private final TodoRepository todoRepository;

    public TagController(TagRepository tagRepository, TodoRepository todoRepository) {
        this.tagRepository = tagRepository;
        this.todoRepository = todoRepository;
    }

    // 태그 전체 조회
    @GetMapping
    public ResponseEntity<?> getAllTags() {
        List<TagResponseDto> list = tagRepository.findAll()
                .stream().map(this::toDto).collect(Collectors.toList());
        return ResponseEntity.ok(
                Map.of(
                        "success", true,
                        "data", list,
                        "message", "태그 목록 조회 성공"
                )
        );
    }

    // 태그 등록
    @PostMapping
    public ResponseEntity<?> createTag(@Valid @RequestBody TagRequestDto dto) {
        // 중복 태그명 검사
        if (tagRepository.existsByName(dto.getName())) {
            return ResponseEntity.badRequest().body(
                    Map.of(
                            "success", false,
                            "message", "이미 존재하는 태그명입니다.",
                            "errorCode", "DUPLICATE_TAG_NAME"
                    )
            );
        }

        Tag tag = new Tag();
        tag.setName(dto.getName());
        tag.setColor(dto.getColor() != null ? dto.getColor() : "#6c757d");

        Tag saved = tagRepository.save(tag);

        return ResponseEntity.status(HttpStatus.CREATED).body(
                Map.of(
                        "success", true,
                        "data", toDto(saved),
                        "message", "태그가 성공적으로 생성되었습니다."
                )
        );
    }

    // 태그 단일 조회
    @GetMapping("/{id}")
    public ResponseEntity<?> getTagById(@PathVariable Long id) {
        return tagRepository.findById(id)
                .map(tag -> ResponseEntity.ok(
                        Map.of(
                                "success", true,
                                "data", toDto(tag),
                                "message", "태그 조회 성공"
                        )
                ))
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                        Map.of(
                                "success", false,
                                "message", "존재하지 않는 태그입니다.",
                                "errorCode", "TAG_NOT_FOUND"
                        )
                ));
    }

    // 태그 수정 (새로 추가)
    @PutMapping("/{id}")
    public ResponseEntity<?> updateTag(@PathVariable Long id, @Valid @RequestBody TagRequestDto dto) {
        return tagRepository.findById(id)
                .map(existingTag -> {
                    // 다른 태그와 이름 중복 검사 (자기 자신 제외)
                    if (!existingTag.getName().equals(dto.getName()) &&
                            tagRepository.existsByName(dto.getName())) {
                        return ResponseEntity.badRequest().body(
                                Map.of(
                                        "success", false,
                                        "message", "이미 존재하는 태그명입니다.",
                                        "errorCode", "DUPLICATE_TAG_NAME"
                                )
                        );
                    }

                    // 태그 정보 업데이트
                    existingTag.setName(dto.getName());
                    existingTag.setColor(dto.getColor() != null ? dto.getColor() : existingTag.getColor());

                    Tag updated = tagRepository.save(existingTag);

                    return ResponseEntity.ok(
                            Map.of(
                                    "success", true,
                                    "data", toDto(updated),
                                    "message", "태그가 성공적으로 수정되었습니다."
                            )
                    );
                })
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                        Map.of(
                                "success", false,
                                "message", "존재하지 않는 태그입니다.",
                                "errorCode", "TAG_NOT_FOUND"
                        )
                ));
    }

    // 태그 삭제
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTag(@PathVariable Long id) {
        if (!tagRepository.existsById(id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                    Map.of(
                            "success", false,
                            "message", "존재하지 않는 태그입니다.",
                            "errorCode", "TAG_NOT_FOUND"
                    )
            );
        }

        // 해당 태그를 사용하는 Todo가 있는지 확인
        long todoCount = todoRepository.findByTag_Id(id).size();
        if (todoCount > 0) {
            return ResponseEntity.badRequest().body(
                    Map.of(
                            "success", false,
                            "message", String.format("이 태그를 사용하는 할일이 %d개 있어 삭제할 수 없습니다.", todoCount),
                            "errorCode", "TAG_IN_USE",
                            "todoCount", todoCount
                    )
            );
        }

        tagRepository.deleteById(id);

        return ResponseEntity.ok(
                Map.of(
                        "success", true,
                        "message", "태그가 성공적으로 삭제되었습니다."
                )
        );
    }

    // 태그명으로 검색 (새로 추가)
    @GetMapping("/search")
    public ResponseEntity<?> searchTagsByName(@RequestParam String name) {
        if (name == null || name.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(
                    Map.of(
                            "success", false,
                            "message", "검색어를 입력해주세요.",
                            "errorCode", "EMPTY_SEARCH_KEYWORD"
                    )
            );
        }

        List<Tag> tags = tagRepository.findByNameContainingIgnoreCase(name.trim());
        List<TagResponseDto> tagDtos = tags.stream().map(this::toDto).collect(Collectors.toList());

        return ResponseEntity.ok(
                Map.of(
                        "success", true,
                        "data", tagDtos,
                        "message", String.format("'%s'로 검색된 태그 %d개", name, tagDtos.size())
                )
        );
    }

    // 태그 사용 통계 조회 (새로 추가)
    @GetMapping("/{id}/stats")
    public ResponseEntity<?> getTagStats(@PathVariable Long id) {
        return tagRepository.findById(id)
                .map(tag -> {
                    long totalTodos = todoRepository.findByTag_Id(id).size();
                    long completedTodos = todoRepository.countByTag_IdAndStatus(id,
                            com.hyebin.todo.domain.enums.Status.DONE);
                    long pendingTodos = totalTodos - completedTodos;

                    return ResponseEntity.ok(
                            Map.of(
                                    "success", true,
                                    "data", Map.of(
                                            "tag", toDto(tag),
                                            "totalTodos", totalTodos,
                                            "completedTodos", completedTodos,
                                            "pendingTodos", pendingTodos,
                                            "completionRate", totalTodos > 0 ?
                                                    Math.round((double) completedTodos / totalTodos * 100) : 0
                                    ),
                                    "message", "태그 통계 조회 성공"
                            )
                    );
                })
                .orElse(ResponseEntity.status(HttpStatus.NOT_FOUND).body(
                        Map.of(
                                "success", false,
                                "message", "존재하지 않는 태그입니다.",
                                "errorCode", "TAG_NOT_FOUND"
                        )
                ));
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