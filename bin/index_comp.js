#! /usr/bin/env node

//! This is the more complicated one. Less features, but will end up being better.
//! The recommended one to us is the one in language folder, but you can use this.

//? Imports
const yargs = require("yargs");
const chalk = require("chalk");
const process = require("node:process");
const boxen = require("boxen");
const readline = require("readline");
const { stdin, stdout } = require("node:process");

//? Importing my files
const { run } = require('./language_comp/suzuScript');

function comp() {
    const rl = readline.createInterface({
        input: stdin,
        output: stdout
    })
    
    //? Args
    const usage = "\nUsage: suzu <dir> to compile the language";const options = yargs  
          .usage(usage)
          .option("d", {alias:"directory", describe: "Directory to compile from", type: "string", demandOption
    : false })
    .option("o", {alias:"output", describe: "Directory to output to", type: "string", demandOption
    : false })
    .option("s", {alias:"setup", describe: "Generates a file tree (Priority over others, other args will not fire)", type: "bool", demandOption
    : false })
    .option("cmd", {alias:"command", describe: "Open the command interface", type: "bool", demandOption
    : false })
          .help(true)  
          .argv;
    
    //? Checking if setup was used
    if(yargs.argv.s == true || yargs.argv.setup) {
        setup();
        process.exit(1);
    }
    
    let keysFound = [];

    for(const key in yargs.argv) {
        if(key != '_' && key != "$0"){
            keysFound.push(key);
        }
    }

    console.log(keysFound);

    if(keysFound.length == 0) {
        console.log(chalk.red("[ERROR] Missing args"));
        process.exit(0);
    }

    //? Checking if they want the command interface
    if(yargs.argv.cmd || yargs.argv.command) {
        //? Logging that they entired the interface
        console.clear();
        console.log(chalk.blueBright("Welcome to the ") + chalk.blue("Suzu Command interface."));
        console.log(chalk.red("To run code directly from the console, just type anything. (Files are not supported yet)"));
        console.log("\n\n");
        //? To make it recursive
        function cmd() {
            rl.question(chalk.blueBright("SuzuScript~   "), (command) => {
                command = command.trim();
                if(!command || command == "") return cmd();
                //? Getting the tokens from the file
                const tokens = run(command, "Console", command);
    
                try {
                    console.log(tokens.as_string());
                } catch (err) {
                    console.log(tokens.toString());
                }
    
                cmd();
            })
        }
    
        cmd();
    }
}

//? For when I can set up the base files
function setup() {
    console.log(boxen(chalk.red("\n[ERROR] Base language not set up yet. Cannot continue.\n")));
}

module.exports.comp = comp;