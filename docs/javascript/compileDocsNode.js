#!/usr/bin/env node

'use strict';

process.on('uncaughtException', function (err) {
  console.log('Caught exception: ' + err);
  process.exit(1);
});

const referenceHtmlTemplate = __dirname + "/" + process.argv[2];
const commandsHtmlTemplate = __dirname + "/" + process.argv[3];
const faqHtmlTemplate = __dirname + "/" + process.argv[4];
const template = __dirname + "/" + process.argv[5];
const jsonCommandsFile = process.argv[6];
const pandocOutputDir = __dirname + "/" + process.argv[7];

const jsdom = require('jsdom');
const fs = require('fs');

const buildDocs = require("./buildDocs.js");
const mjAPI = require("mathjax-node/lib/mj-page.js");
const jsonData = require(jsonCommandsFile);

mjAPI.start();

buildFAQ(faqHtmlTemplate, __dirname + "/faq.html");

buildCommands(commandsHtmlTemplate, __dirname + "/commands.html");

buildReference(referenceHtmlTemplate, __dirname + "/reference.html");

buildSinglePage(template, "#Body", pandocOutputDir + "tutorial/Tutorial.html",  __dirname + "/tutorial.html",
    '<script>$(document).ready(function () {$("#hail-navbar").load("navbar.html", function () {$(".nav li").removeClass("active"); $("#docs").addClass("active"); $("#tutorial").addClass("active");});});</script>');

buildSinglePage(template, "#Body", pandocOutputDir + "overview/Overview.html",  __dirname + "/overview.html",
    '<script>$(document).ready(function () {$("#hail-navbar").load("navbar.html", function () {$(".nav li").removeClass("active"); $("#docs").addClass("active"); $("#overview").addClass("active");});});</script>');

buildSinglePage(template, "#Body", pandocOutputDir + "reference/GettingStarted.html", __dirname + "/getting_started.html",
    '<script>$(document).ready(function () {$("#hail-navbar").load("navbar.html", function () {$(".nav li").removeClass("active"); $("#docs").addClass("active"); $("#getting_started").addClass("active");});});</script>');

buildIndex(template, "#Body", "README.html", __dirname + "/index.html");


function error(message) {
    console.log(message);
    process.exit(1);
}

function loadReq(selector, file, $) {
    return new Promise(function (resolve, reject) {
        const s = $(selector);
        if (s.length == 0) {
            reject("No elements found for selector " + selector);
        } else {
            $(selector).load(file, function (response, status, xhr) {
                if (status == "error") {
                    console.log("error when loading file: " + file);
                    reject(status)
                } else {
                    resolve(response)
                }
            });
        }
    });
};

function runMathJax(document, callback) {
    mjAPI.typeset({
        html: document.body.innerHTML,
        renderer: "SVG",
        inputs: ["TeX"],
        xmlns: "mml"
     }, function(result) {
        document.body.innerHTML = result.html;
        const HTML = "<!DOCTYPE html>\n" + document.documentElement.outerHTML.replace(/^(\n|\s)*/, "");
        callback(HTML);
    })
}

function buildReference(htmlTemplate, outputFileName) {
    jsdom.env(htmlTemplate, function (err, window) {
        window.addEventListener("error", function (event) {
          console.error("script error!!", event.error);
          process.exit(1);
        });

        const $ = require('jquery')(window);

        const loadOverviewPromises = ["Representation",
                                    "Importing",
                                    "HailObjectProperties",
                                    "Annotations",
                                    "HailExpressionLanguage",
                                    "Filtering",
                                    "ExportingData",
                                    "ExportingTSV",
                                    "SQL"]
                                    .map(name => loadReq("#" + name, pandocOutputDir + "reference/" + name + ".html", $));

        Promise.all(loadOverviewPromises)
            .then(function() {
                 var document = jsdom.jsdom($('html').html());
                 runMathJax(document, function(html) {
                    fs.writeFile(outputFileName, html);
                 });
            }, error)
            .catch(error);
    });
}

function buildCommands(htmlTemplate, outputFileName) {
    jsdom.env(htmlTemplate, function (err, window) {
        window.addEventListener("error", function (event) {
          console.error("script error!!", event.error);
          process.exit(1);
        });

        const $ = require('jquery')(window);

        const buildCommandPromises = jsonData.commands
            .filter(command => !command.hidden)
            .map(command => buildDocs.buildCommand(command, pandocOutputDir + "commands/", $));

        Promise.all(buildCommandPromises.concat([loadReq("#GlobalOptions", pandocOutputDir + "commands/" + "GlobalOptions.html", $)]))
            .then(function() {$("div#GlobalOptions div.options").append(buildDocs.buildGlobalOptions(jsonData.global.options, $))}, error)
            .then(function() {
                 var document = jsdom.jsdom($('html').html());
                 runMathJax(document, function(html) {
                    fs.writeFile(outputFileName, html);
                 });
            }, error)
            .catch(error);
    });
}

function buildFAQ(htmlTemplate, outputFileName) {
    jsdom.env(htmlTemplate, function (err, window) {
        window.addEventListener("error", function (event) {
          console.error("script error!!", event.error);
          process.exit(1);
        });

        const $ = require('jquery')(window);

    var faqNames = ["Annotations",
                    "DataRepresentation",
                    "DevTools",
                    "ErrorMessages",
                    "ExportingData",
                    "ExpressionLanguage",
                    "FilteringData",
                    "General",
                    "ImportingData",
                    "Installation",
                    "Methods",
                    "OptimizePipeline"];

    var loadFaqPromises = faqNames.map(name => loadReq("#" + name, pandocOutputDir + "faq/" + name + ".html", $));

        Promise.all(loadFaqPromises)
            .then(function () {
                buildDocs.buildFaqTOC($);
                faqNames.map(name => buildDocs.buildFaqHeader(name, $));
            }, error)
            .then(function() {
                 var document = jsdom.jsdom($('html').html());
                 runMathJax(document, function(html) {
                    fs.writeFile(outputFileName, html);
                 });
            }, error)
            .catch(error);
    });
}

function buildSinglePage(htmlTemplate, selector, pandocInput, outputFileName, scriptTag) {
    jsdom.env(htmlTemplate, function (err, window) {
        window.addEventListener("error", function (event) {
          console.error("script error!!", event.error);
          process.exit(1);
        });

        const $ = require('jquery')(window);

        var loadTutorialPromises = [loadReq(selector, pandocInput, $)];

        Promise.all(loadTutorialPromises)
            .then(function() {
                $("head").append(scriptTag);
                 var document = jsdom.jsdom($('html').html());
                 runMathJax(document, function(html) {
                    fs.writeFile(outputFileName, html);
                 });
            }, error)
            .catch(error);
    });
}

function buildIndex(htmlTemplate, selector, pandocInput, outputFileName) {
    jsdom.env(htmlTemplate, function (err, window) {
        window.addEventListener("error", function (event) {
          console.error("script error!!", event.error);
          process.exit(1);
        });

        const $ = require('jquery')(window);

        var loadTutorialPromises = [loadReq(selector, pandocInput, $)];

        Promise.all(loadTutorialPromises)
            .then(function() {
                 $("h1#hail").remove();
                 $('a[href*="badge"]').remove();
                 $('a[href*="buildTypeStatusDiv"]').remove();
                 $('a[href="https://hail.is"]').replaceWith("Hail");
                 $("head").append('<script>$(document).ready(function () {$("#hail-navbar").load("navbar.html", function () {$(".nav li").removeClass("active"); $("#home").addClass("active");});});</script>')

                 var document = jsdom.jsdom($('html').html());

                 runMathJax(document, function(html) {
                    fs.writeFile(outputFileName, html);
                 });
            }, error)
            .catch(error);
    });
}
