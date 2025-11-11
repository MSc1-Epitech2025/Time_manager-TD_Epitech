package com.example.time_manager;

import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class TimeManagerApplicationTest {

    @Test
    void testMain_CallsSpringApplicationRun() {
        try (MockedStatic<SpringApplication> mocked = mockStatic(SpringApplication.class)) {
            String[] args = {"--spring.profiles.active=test"};

            TimeManagerApplication.main(args);

            mocked.verify(() -> SpringApplication.run(TimeManagerApplication.class, args));
        }
    }

    @Test
    void testApplicationClassExists() {
        SpringBootApplication annotation =
                TimeManagerApplication.class.getAnnotation(SpringBootApplication.class);

        assertNotNull(annotation);
        assertEquals("com.example.time_manager", annotation.scanBasePackages()[0]);
    }

    @Test
    void testConstructorDoesNotThrow() {
        assertDoesNotThrow(TimeManagerApplication::new);
    }

    @Test
    void testMainWithNullArgsDoesNotThrow() {
        try (MockedStatic<SpringApplication> mocked = mockStatic(SpringApplication.class)) {
            assertDoesNotThrow(() -> TimeManagerApplication.main(null));
            mocked.verify(() -> SpringApplication.run(TimeManagerApplication.class, (String[]) null)); // ✅ cast ajouté
        }
    }
}
