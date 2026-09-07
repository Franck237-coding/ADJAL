package cm.adjal.api;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class AdjalApiApplication {
    public static void main(String[] args) {
        SpringApplication.run(AdjalApiApplication.class, args);
    }
}