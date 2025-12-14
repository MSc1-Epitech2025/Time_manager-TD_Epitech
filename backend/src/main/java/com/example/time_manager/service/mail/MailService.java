package com.example.time_manager.service.mail;

import jakarta.mail.internet.MimeMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.context.Context;
import org.thymeleaf.spring6.SpringTemplateEngine;

@Service
public class MailService {

    private final JavaMailSender mailSender;
    private final SpringTemplateEngine templateEngine;

    public MailService(JavaMailSender mailSender, SpringTemplateEngine templateEngine) {
        this.mailSender = mailSender;
        this.templateEngine = templateEngine;
    }

    public void sendResetPasswordEmail(
            String to,
            String firstName,
            String resetUrl,
            long minutes,
            String tempPassword
    ) {
        try {
            Context ctx = new Context();
            ctx.setVariable("firstName", firstName);
            ctx.setVariable("resetUrl", resetUrl);
            ctx.setVariable("minutes", minutes);
            ctx.setVariable("tempPassword", tempPassword);

            String html = templateEngine.process("reset-password", ctx);

            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, "UTF-8");
            helper.setTo(to);
            helper.setSubject("Time Manager - Account created");
            helper.setText(html, true);

            mailSender.send(message);
        } catch (Exception e) {
            throw new RuntimeException("Failed to send reset password email", e);
        }
    }
}
