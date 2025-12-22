package com.example.time_manager.security;

import java.security.SecureRandom;

public final class PasswordGenerator {
    private static final SecureRandom RNG = new SecureRandom();

    private static final String ALPHABET =
            "ABCDEFGHJKLMNPQRSTUVWXYZ" +
            "abcdefghijkmnopqrstuvwxyz" +
            "23456789" +
            "!@#$%*?";

    private PasswordGenerator() {}

    public static String generate(int length) {
        if (length < 10) throw new IllegalArgumentException("length must be >= 10");
        StringBuilder sb = new StringBuilder(length);
        for (int i = 0; i < length; i++) {
            sb.append(ALPHABET.charAt(RNG.nextInt(ALPHABET.length())));
        }
        return sb.toString();
    }
}
