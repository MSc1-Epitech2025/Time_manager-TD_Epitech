package com.example.time_manager.services;

import com.example.time_manager.service.mail.MailService;
import jakarta.mail.internet.MimeMessage;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.mail.javamail.JavaMailSender;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

class MailServiceTest {

    @Mock
    private JavaMailSender mailSender;

    @Mock
    private SpringTemplateEngine templateEngine;

    @Mock
    private MimeMessage mimeMessage;

    private MailService mailService;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        mailService = new MailService(mailSender, templateEngine);
    }

    @Test
    void sendResetPasswordEmail_success() throws Exception {
        String to = "user@example.com";
        String firstName = "John";
        String resetUrl = "http://localhost:4200/reset?token=abc123";
        long minutes = 30;
        String tempPassword = "TempPass123!";
        String htmlContent = "<html><body>Reset email content</body></html>";

        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        when(templateEngine.process(eq("reset-password"), any(Context.class))).thenReturn(htmlContent);

        mailService.sendResetPasswordEmail(to, firstName, resetUrl, minutes, tempPassword);

        verify(mailSender).createMimeMessage();
        verify(templateEngine).process(eq("reset-password"), any(Context.class));
        verify(mailSender).send(mimeMessage);
    }

    @Test
    void sendResetPasswordEmail_verifyTemplateContext() throws Exception {
        String to = "test@test.com";
        String firstName = "Jane";
        String resetUrl = "http://example.com/reset";
        long minutes = 60;
        String tempPassword = "SecurePass456!";

        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        when(templateEngine.process(eq("reset-password"), any(Context.class))).thenReturn("<html></html>");

        mailService.sendResetPasswordEmail(to, firstName, resetUrl, minutes, tempPassword);

        ArgumentCaptor<Context> contextCaptor = ArgumentCaptor.forClass(Context.class);
        verify(templateEngine).process(eq("reset-password"), contextCaptor.capture());

        Context capturedContext = contextCaptor.getValue();
        assertThat(capturedContext.getVariable("firstName")).isEqualTo(firstName);
        assertThat(capturedContext.getVariable("email")).isEqualTo(to);
        assertThat(capturedContext.getVariable("resetUrl")).isEqualTo(resetUrl);
        assertThat(capturedContext.getVariable("minutes")).isEqualTo(minutes);
        assertThat(capturedContext.getVariable("tempPassword")).isEqualTo(tempPassword);
    }

    @Test
    void sendResetPasswordEmail_templateProcessingFails_throwsRuntimeException() {
        String to = "user@example.com";

        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        when(templateEngine.process(eq("reset-password"), any(Context.class)))
                .thenThrow(new RuntimeException("Template error"));

        assertThatThrownBy(() ->
                mailService.sendResetPasswordEmail(to, "John", "url", 30, "pass"))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Failed to send reset password email");
    }

    @Test
    void sendResetPasswordEmail_mailSendingFails_throwsRuntimeException() throws Exception {
        when(mailSender.createMimeMessage()).thenReturn(mimeMessage);
        when(templateEngine.process(eq("reset-password"), any(Context.class))).thenReturn("<html></html>");
        doThrow(new RuntimeException("SMTP error")).when(mailSender).send(any(MimeMessage.class));

        assertThatThrownBy(() ->
                mailService.sendResetPasswordEmail("user@test.com", "Name", "url", 15, "temp"))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Failed to send reset password email");
    }

    @Test
    void sendResetPasswordEmail_createMimeMessageFails_throwsRuntimeException() {
        when(mailSender.createMimeMessage()).thenThrow(new RuntimeException("Cannot create message"));

        assertThatThrownBy(() ->
                mailService.sendResetPasswordEmail("user@test.com", "Name", "url", 15, "temp"))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("Failed to send reset password email");
    }
}
