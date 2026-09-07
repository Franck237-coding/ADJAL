package cm.adjal.api.controller;

import cm.adjal.api.dto.request.AccountRequests;
import cm.adjal.api.dto.request.ProfileRequests;
import cm.adjal.api.dto.response.AccountResponse;
import cm.adjal.api.security.AuthenticatedUser;
import cm.adjal.api.service.AccountService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/api/account", "/api/users"})
public class AccountController {
    private final AccountService accountService;

    public AccountController(AccountService accountService) {
        this.accountService = accountService;
    }

    @GetMapping("/me")
    AccountResponse me(@AuthenticationPrincipal AuthenticatedUser user) {
        return AccountResponse.from(user);
    }

    @DeleteMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void delete(@AuthenticationPrincipal AuthenticatedUser user,
                @Valid @RequestBody AccountRequests.DeleteAccount body) {
        accountService.deleteOwnAccount(user, body.password());
    }

    @PatchMapping("/profile")
    AccountResponse updateProfile(@AuthenticationPrincipal AuthenticatedUser user,
                                  @Valid @RequestBody ProfileRequests.UpdateProfile body) {
        java.util.Map<String, Object> values = new java.util.LinkedHashMap<>();
        values.put("name", body.name());
        values.put("phone", body.phone());
        values.put("city", body.city());
        values.put("avatarUrl", body.avatarUrl());
        values.put("latitude", body.latitude());
        values.put("longitude", body.longitude());
        return AccountResponse.from(accountService.updateProfile(user.id(), values).orElseThrow());
    }
}