package com.review.reviewservice.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
public class SpaRedirectController {
    @RequestMapping(value = "/{path:[^\\.]*}")
    public String redirect(@PathVariable("path") String path) {
        return "forward:/index.html";
    }
}