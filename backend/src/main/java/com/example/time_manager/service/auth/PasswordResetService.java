package com.example.time_manager.service.auth;

import com.example.time_manager.model.User;
import com.example.time_manager.model.PasswordResetToken;
import com.example.time_manager.repository.UserRepository;
import com.example.time_manager.repository.PasswordResetTokenRepository;
import com.example.time_manager.service.mail.MailService;
import com.example.time_manager.security.PasswordGenerator;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.UUID;

@Service
@Transactional
public class PasswordResetService {

    private final UserRepository userRepo;
    private final PasswordResetTokenRepository tokenRepo;
    private final PasswordEncoder encoder;
    private final MailService mailService;
    private final String frontBaseUrl = "https://localhost:4200";

    private static final Duration TOKEN_TTL = Duration.ofMinutes(30);

    public PasswordResetService(
            UserRepository userRepo,
            PasswordResetTokenRepository tokenRepo,
            PasswordEncoder encoder,
            MailService mailService
    ) {
        this.userRepo = userRepo;
        this.tokenRepo = tokenRepo;
        this.encoder = encoder;
        this.mailService = mailService;
    }

    public void sendSetPasswordEmailFor(User user) {
    sendSetPasswordEmailFor(user, null);
    }

    public void sendSetPasswordEmailFor(User user, String tempPassword) {
        String token = UUID.randomUUID().toString().replace("-", "")
                + UUID.randomUUID().toString().replace("-", "");

        PasswordResetToken t = new PasswordResetToken();
        t.setToken(token);
        t.setUserId(user.getId());
        t.setExpiresAt(Instant.now().plus(TOKEN_TTL));
        tokenRepo.save(t);

        String resetUrl = frontBaseUrl + "/reset-password?token=" + token;

        mailService.sendResetPasswordEmail(
                user.getEmail(),
                user.getFirstName(),
                resetUrl,
                TOKEN_TTL.toMinutes(),
                tempPassword
        );
    }

    public void requestResetByEmail(String email) {
        User u = userRepo.findByEmail(email).orElse(null);
        if (u == null) return;
        sendSetPasswordEmailFor(u);
    }

    public void requestResetWithTempPassword(String email) {
        User u = userRepo.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("No account found with this email address"));
        
        // Generate temp password
        String tempPassword = PasswordGenerator.generate(14);
        
        // Reset password
        u.setPassword(encoder.encode(tempPassword));
        
        // Reset first connection
        u.setFirstConnection(true);
        userRepo.save(u);
        
        // Send email
        sendSetPasswordEmailFor(u, tempPassword);
    }

    public void resetPassword(String token, String newPassword) {
        PasswordResetToken t = tokenRepo.findByToken(token)
                .orElseThrow(() -> new IllegalArgumentException("Invalid token"));

        if (t.isUsed()) throw new IllegalArgumentException("Token already used");
        if (Instant.now().isAfter(t.getExpiresAt())) throw new IllegalArgumentException("Token expired");

        User u = userRepo.findById(t.getUserId())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        u.setPassword(encoder.encode(newPassword));
        userRepo.save(u);

        t.setUsed(true);
        tokenRepo.save(t);
    }
}
