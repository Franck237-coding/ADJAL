package cm.adjal.api.controller;

import cm.adjal.api.repository.MarketplaceRepository;
import cm.adjal.api.security.AuthenticatedUser;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.*;
import java.util.Locale;
import java.util.Map;
import java.util.NoSuchElementException;
import java.util.UUID;
import java.util.regex.Pattern;

@RestController
public class MediaController {
    private static final long MAX_BYTES = 10L * 1024L * 1024L;
    private static final Pattern STORED_NAME = Pattern.compile("^[0-9a-f-]{36}\\.(jpg|jpeg|png|webp)$");

    private final MarketplaceRepository repository;
    private final Path mediaDirectory;
    private final String appUrl;

    public MediaController(
        MarketplaceRepository repository,
        @Value("${adjal.media-dir:uploads}") String mediaDirectory,
        @Value("${adjal.app-url:http://localhost:8099}") String appUrl
    ) {
        this.repository = repository;
        this.mediaDirectory = Paths.get(mediaDirectory).toAbsolutePath().normalize();
        this.appUrl = appUrl.replaceAll("/$", "");
    }

    @PostMapping(value = "/api/media/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    Map<String, String> upload(@RequestPart("file") MultipartFile file) throws IOException {
        String url = store(file);
        return Map.of("url", url);
    }

    @PostMapping(value = "/api/profile/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    Map<String, String> uploadAvatar(
        @AuthenticationPrincipal AuthenticatedUser user,
        @RequestPart("file") MultipartFile file
    ) throws IOException {
        if (user == null) throw new NoSuchElementException("Authenticated account required");
        String url = store(file);
        repository.updateProfile(user.id(), Map.of("avatarUrl", url));
        return Map.of("avatarUrl", url);
    }

    @GetMapping("/media/{filename:.+}")
    ResponseEntity<Resource> serve(@PathVariable String filename) {
        if (!STORED_NAME.matcher(filename.toLowerCase(Locale.ROOT)).matches()) {
            return ResponseEntity.notFound().build();
        }
        Path file = mediaDirectory.resolve(filename).normalize();
        if (!file.getParent().equals(mediaDirectory) || !Files.isRegularFile(file)) {
            return ResponseEntity.notFound().build();
        }
        MediaType contentType = switch (StringUtils.getFilenameExtension(filename).toLowerCase(Locale.ROOT)) {
            case "png" -> MediaType.IMAGE_PNG;
            case "webp" -> MediaType.parseMediaType("image/webp");
            default -> MediaType.IMAGE_JPEG;
        };
        return ResponseEntity.ok()
            .cacheControl(CacheControl.maxAge(java.time.Duration.ofDays(30)).cachePublic())
            .contentType(contentType)
            .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
            .body(new FileSystemResource(file));
    }

    private String store(MultipartFile file) throws IOException {
        if (file == null || file.isEmpty()) throw new IllegalArgumentException("An image file is required");
        if (file.getSize() > MAX_BYTES) throw new IllegalArgumentException("Image must be 10 MB or smaller");
        String contentType = file.getContentType() == null ? "" : file.getContentType().toLowerCase(Locale.ROOT);
        String extension = switch (contentType) {
            case "image/jpeg", "image/jpg" -> "jpg";
            case "image/png" -> "png";
            case "image/webp" -> "webp";
            default -> throw new IllegalArgumentException("Only JPEG, PNG and WebP images are supported");
        };
        Files.createDirectories(mediaDirectory);
        String filename = UUID.randomUUID() + "." + extension;
        Path destination = mediaDirectory.resolve(filename).normalize();
        Files.copy(file.getInputStream(), destination, StandardCopyOption.REPLACE_EXISTING);
        return appUrl + "/media/" + filename;
    }
}