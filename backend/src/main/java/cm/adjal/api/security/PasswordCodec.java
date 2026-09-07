package cm.adjal.api.security;

import org.bouncycastle.crypto.generators.SCrypt;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

@Component
public class PasswordCodec {
    private static final int N = 16_384;
    private static final int R = 8;
    private static final int P = 1;
    private static final int KEY_LENGTH = 64;

    public HashResult hash(String password) {
        String salt = randomHex(32);
        return new HashResult(hex(derive(password, salt)), salt);
    }

    public boolean matches(String password, String storedHash, String storedSalt) {
        byte[] expected = derive(password, storedSalt);
        byte[] actual;
        try {
            actual = fromHex(storedHash);
        } catch (IllegalArgumentException ignored) {
            return false;
        }
        return MessageDigest.isEqual(expected, actual);
    }

    private byte[] derive(String password, String salt) {
        // Node's crypto.scrypt receives the hex salt string as UTF-8 bytes.
        return SCrypt.generate(
            password.getBytes(StandardCharsets.UTF_8),
            salt.getBytes(StandardCharsets.UTF_8),
            N, R, P, KEY_LENGTH
        );
    }

    private static String randomHex(int bytes) {
        byte[] value = new byte[bytes];
        new java.security.SecureRandom().nextBytes(value);
        return hex(value);
    }

    public static String hex(byte[] bytes) {
        StringBuilder result = new StringBuilder(bytes.length * 2);
        for (byte value : bytes) result.append(String.format("%02x", value));
        return result.toString();
    }

    public static byte[] fromHex(String value) {
        if ((value.length() & 1) != 0) throw new IllegalArgumentException("Invalid hex");
        byte[] result = new byte[value.length() / 2];
        for (int i = 0; i < result.length; i++) {
            int high = Character.digit(value.charAt(i * 2), 16);
            int low = Character.digit(value.charAt(i * 2 + 1), 16);
            if (high < 0 || low < 0) throw new IllegalArgumentException("Invalid hex");
            result[i] = (byte) ((high << 4) + low);
        }
        return result;
    }

    public record HashResult(String hash, String salt) {}
}