package cm.adjal.api.controller;

import cm.adjal.api.dto.request.ReportRequests;
import cm.adjal.api.dto.response.ReportResponses;
import cm.adjal.api.security.AuthenticatedUser;
import cm.adjal.api.service.ReportService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/reports")
public class ReportController {
    private final ReportService reportService;
    public ReportController(ReportService reportService) { this.reportService = reportService; }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    ReportResponses.Report create(@AuthenticationPrincipal AuthenticatedUser user, @Valid @RequestBody ReportRequests.Create body) {
        requireBuyer(user);
        return ReportResponses.Report.from(reportService.create(user.id(), body.farmerId(), body.reason(), body.details()));
    }

    @GetMapping("/mine")
    List<ReportResponses.Report> mine(@AuthenticationPrincipal AuthenticatedUser user) {
        if (user == null) throw new org.springframework.web.server.ResponseStatusException(HttpStatus.UNAUTHORIZED);
        return reportService.mine(user.id()).stream().map(ReportResponses.Report::from).toList();
    }

    private void requireBuyer(AuthenticatedUser user) {
        if (user == null || !"buyer".equals(user.role()))
            throw new org.springframework.web.server.ResponseStatusException(HttpStatus.FORBIDDEN, "Buyer role required");
    }
}