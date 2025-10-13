package com.example.time_manager;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = "com.example.time_manager")
public class TimeManagerApplication {

    public static void main(String[] args) {
        SpringApplication.run(TimeManagerApplication.class, args);
    }
}
