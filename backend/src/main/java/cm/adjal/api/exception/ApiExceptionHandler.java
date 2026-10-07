package cm.adjal.api.exception;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.MethodArgumentNotValidException;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.NoSuchElementException;

@RestControllerAdvice
public class ApiExceptionHandler {
    /**
     * Image trop lourde : sans ce gestionnaire, Spring remontait la cause
     * (IllegalStateException) et l'API répondait à tort « 409 Conflit ».
     */
    @ExceptionHandler(org.springframework.web.multipart.MaxUploadSizeExceededException.class)
    @ResponseStatus(HttpStatus.PAYLOAD_TOO_LARGE)
    Map<String, String> uploadTooLarge(org.springframework.web.multipart.MaxUploadSizeExceededException exception) {
        return Map.of("error", "Image trop lourde : 10 Mo maximum.");
    }

    @ExceptionHandler(org.springframework.web.multipart.MultipartException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    Map<String, String> invalidUpload(org.springframework.web.multipart.MultipartException exception) {
        exception.printStackTrace(System.err);
        return Map.of("error", "Envoi du fichier invalide : choisissez une image JPEG, PNG ou WebP.");
    }

    @ExceptionHandler(IllegalArgumentException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    Map<String, String> badRequest(IllegalArgumentException exception) {
        exception.printStackTrace(System.err);
        return Map.of("error", exception.getMessage() == null ? "Invalid request" : exception.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    @ResponseStatus(HttpStatus.BAD_REQUEST)
    Map<String, Object> validation(MethodArgumentNotValidException exception) {
        Map<String, String> fields = new LinkedHashMap<>();
        exception.getBindingResult().getFieldErrors().forEach(error ->
            fields.putIfAbsent(error.getField(), error.getDefaultMessage() == null ? "Invalid value" : error.getDefaultMessage())
        );
        return Map.of("error", "Validation failed", "fields", fields);
    }

    @ExceptionHandler(NoSuchElementException.class)
    @ResponseStatus(HttpStatus.NOT_FOUND)
    Map<String, String> notFound(NoSuchElementException exception) {
        return Map.of("error", exception.getMessage() == null ? "Not found" : exception.getMessage());
    }

    @ExceptionHandler(IllegalStateException.class)
    @ResponseStatus(HttpStatus.CONFLICT)
    Map<String, String> invalidState(IllegalStateException exception) {
        exception.printStackTrace(System.err);
        return Map.of("error", exception.getMessage() == null ? "Invalid state transition" : exception.getMessage());
    }

    @ExceptionHandler(ResponseStatusException.class)
    ResponseEntity<Map<String, String>> responseStatus(ResponseStatusException exception) {
        return ResponseEntity.status(exception.getStatusCode())
            .body(Map.of("error", exception.getReason() == null ? "Request rejected" : exception.getReason()));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    ResponseEntity<Map<String, String>> conflict(DataIntegrityViolationException exception) {
        String detail = exception.getMostSpecificCause() == null
            ? ""
            : String.valueOf(exception.getMostSpecificCause().getMessage()).toLowerCase();
        if (detail.contains("email") || detail.contains("uk_accounts_email")) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "Email already in use"));
        }
        if (detail.contains("slug") || detail.contains("uk_categories_slug")) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("error", "Category slug already in use"));
        }
        return ResponseEntity.status(HttpStatus.CONFLICT)
            .body(Map.of("error", "Resource already exists or violates a constraint"));
    }
}