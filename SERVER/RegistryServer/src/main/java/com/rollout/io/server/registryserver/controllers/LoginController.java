package com.rollout.io.server.registryserver.controllers;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 * Controller handling user authentication related web requests.
 */
@Controller
public class LoginController {

    /**
     * Handles GET requests to the /login endpoint and returns the login view.
     *
     * @return the name of the login template
     */
    @GetMapping("/login")
    public String login() {
        return "login";
    }

}
