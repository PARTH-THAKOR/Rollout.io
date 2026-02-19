package com.rollout.io.server.apigateway.controllers;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;

@Controller
public class WelcomeController {

    @GetMapping("/")
    public String home() {
        return "index";
    }

    @PostMapping("/login")
    public String redirectToSwagger() {
        return "redirect:/webjars/swagger-ui/index.html";
    }

}
