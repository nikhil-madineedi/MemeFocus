package com.memefocus.controller;

import com.memefocus.model.Task;
import com.memefocus.repository.TaskRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    @Autowired
    private TaskRepository taskRepository;

    public record CreateTaskRequest(String name) {}

    @GetMapping
    public ResponseEntity<List<Task>> getTasks(HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        List<Task> tasks = taskRepository.findByUserId(userId);
        return ResponseEntity.ok(tasks);
    }

    @PostMapping
    public ResponseEntity<?> createTask(@RequestBody CreateTaskRequest requestBody, HttpServletRequest request) {
        if (requestBody.name() == null || requestBody.name().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Task name cannot be empty"));
        }

        Long userId = (Long) request.getAttribute("userId");
        Task task = new Task(requestBody.name().trim(), userId);
        Task savedTask = taskRepository.save(task);
        return ResponseEntity.status(HttpStatus.CREATED).body(savedTask);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> toggleTask(@PathVariable Long id, HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        Optional<Task> taskOpt = taskRepository.findById(id);

        if (taskOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Task task = taskOpt.get();
        if (!task.getUserId().equals(userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied"));
        }

        task.setCompleted(!task.isCompleted());
        Task updatedTask = taskRepository.save(task);
        return ResponseEntity.ok(updatedTask);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTask(@PathVariable Long id, HttpServletRequest request) {
        Long userId = (Long) request.getAttribute("userId");
        Optional<Task> taskOpt = taskRepository.findById(id);

        if (taskOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Task task = taskOpt.get();
        if (!task.getUserId().equals(userId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of("error", "Access denied"));
        }

        taskRepository.delete(task);
        return ResponseEntity.ok(Map.of("message", "Task deleted successfully"));
    }
}
