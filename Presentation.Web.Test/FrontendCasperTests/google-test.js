﻿// googletesting.js
casper.test.begin('Google search retrieves 10 or more results', 5, function suite(test) {
    casper.start("http://www.google.fr/", function () {
        test.assertTitle("Google", "2 google homepage title is the one expected");
        test.assertExists('form[action="/search"]', "main form is found");
        this.fill('form[action="/search"]', {
            q: "casperjs"
        }, true);
    });

    casper.then(function () {
        test.assertTitle("casperjs - Google-søgning", "2 google title is ok");
        test.assertUrlMatch(/q=casperjs/, "2 search term has been submitted");
        test.assertEval(function () {
            return __utils__.findAll("h3.r").length >= 10;
        }, "google search for \"casperjs\" retrieves 10 or more results");
    });

    casper.run(function () {
        test.done();
    });
});