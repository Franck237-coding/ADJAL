package cm.adjal.api.dto.response;

import cm.adjal.api.security.AuthenticatedUser;

public final class AuthResponses {
    private AuthResponses() {}

    public record Session(String accessToken, AccountResponse account) {
        public static Session from(String accessToken, AuthenticatedUser account) {
            return new Session(accessToken, AccountResponse.from(account));
        }
    }
}