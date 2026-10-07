package cm.adjal.api.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;

/**
 * Transactional email through Spring Boot's JavaMailSender.
 *
 * No provider-specific HTTP API is used here. Any SMTP server works:
 * a hosted mailbox, an organisation's mail server, or a local development
 * SMTP relay. Credentials stay in the runtime environment.
 */
@Service
public class EmailService {
    private final JavaMailSender mailSender;
    private final String host;
    private final String username;
    private final String password;
    private final String from;

    public EmailService(
        ObjectProvider<JavaMailSender> mailSender,
        @Value("${spring.mail.host:}") String host,
        @Value("${spring.mail.username:}") String username,
        @Value("${spring.mail.password:}") String password,
        @Value("${adjal.email.from:no-reply@adjal.cm}") String from
    ) {
        this.mailSender = mailSender.getIfAvailable();
        this.host = host;
        this.username = username;
        this.password = password;
        this.from = from;
    }

    public boolean isConfigured() {
        boolean credentialsAreValid = username.isBlank() == password.isBlank();
        return mailSender != null && !host.isBlank() && !from.isBlank() && credentialsAreValid;
    }

    public void sendPasswordReset(String to, String token, int expiresInMinutes) {
        if (!isConfigured()) {
            throw new IllegalStateException(
                "SMTP is not configured. Set SMTP_HOST, SMTP_PORT, MAIL_FROM and, when required, SMTP_USER and SMTP_PASS."
            );
        }
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(
                message, false, StandardCharsets.UTF_8.name()
            );
            helper.setFrom(from, "A DJAL");
            helper.setTo(to);
            helper.setSubject("Réinitialisez votre mot de passe A DJAL");
            helper.setText(
                """
                Une demande de réinitialisation du mot de passe A DJAL a été reçue.

                Dans l’application, saisissez ce code de récupération : %s
                Ce code expire dans %d minutes et ne peut être utilisé qu’une seule fois.

                Si vous n’êtes pas à l’origine de cette demande, vous pouvez ignorer cet e-mail.
                """.formatted(token, expiresInMinutes),
                """
                <p>Une demande de réinitialisation du mot de passe A DJAL a été reçue.</p>
                <p>Dans l’application, saisissez ce code de récupération :</p>
                <p style="font-family:monospace;font-size:28px;letter-spacing:6px;color:#2F7D32"><strong>%s</strong></p>
                <p>Ce code expire dans %d minutes et ne peut être utilisé qu’une seule fois.</p>
                <p>Si vous n’êtes pas à l’origine de cette demande, vous pouvez ignorer cet e-mail.</p>
                """.formatted(escapeHtml(token), expiresInMinutes)
            );
            mailSender.send(message);
        } catch (MessagingException | MailException | java.io.UnsupportedEncodingException exception) {
            throw new IllegalStateException("Password reset email delivery failed", exception);
        }
    }

    private static String escapeHtml(String value) {
        return value.replace("&", "&amp;").replace("<", "&lt;")
            .replace(">", "&gt;").replace("\"", "&quot;").replace("'", "&#039;");
    }
}