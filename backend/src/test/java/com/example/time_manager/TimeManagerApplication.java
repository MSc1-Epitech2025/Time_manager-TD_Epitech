package com.example.time_manager;

import org.junit.jupiter.api.Test;
import org.mockito.MockedStatic;
import org.springframework.boot.SpringApplication;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class TimeManagerApplicationTest {

    @Test
    void testMain_CallsSpringApplicationRun() {
        try (MockedStatic<SpringApplication> mockedSpring = mockStatic(SpringApplication.class)) {

            TimeManagerApplication.main(new String[]{"--test"});

            mockedSpring.verify(() ->
                    SpringApplication.run(TimeManagerApplication.class, new String[]{"--test"})
            );
        }
    }

    @Test
    void testApplicationClassExists() {
        assertDoesNotThrow(() -> Class.forName("com.example.time_manager.TimeManagerApplication"));
        assertNotNull(TimeManagerApplication.class.getAnnotation(org.springframework.boot.autoconfigure.SpringBootApplication.class));
    }
}
