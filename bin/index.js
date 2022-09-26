//* Imports
const { stdout, stdin } = require("process");
const readline = require("readline");
const chalk = require("chalk");
const { comp } = require("./index_comp");
const url = require("url");

//* Creating the readline interface
const rl = readline.createInterface({
    output : stdout,
    input : stdin
})

//* Asking which version
console.clear();

console.log(chalk.green("Which version do you want?"))
console.log(chalk.bold(chalk.blue("\n\nBase (Recommended): More features, easier to develop. Probably less intuitive though.\n Compiles to rust / js based off of file extension\n\nComp: Less features, harder for me to develop. Probably more intuitive. \n\n(Plan is to have .suzu to be the comp one, and .bsuzu be the base one\n\nIf you used the comp one, make sure you have the args in!\n\nOld : For the people who want the older one. Not recommended. Make sure you have args in!")));

rl.question("Suzu~       ", async (answer) => {
    if(answer.toLowerCase() != "comp" && answer.toLowerCase() != "base" && answer.toLowerCase() != "old") {
        console.log(chalk.red("[ERROR] Invalid input."));
        process.exit(-1);
    }

    if(answer.toLowerCase() == "comp") {
        rl.close();
        return comp();
    }

    if(answer.toLowerCase() == "old") {
        rl.close();
        const mainFunc = await import(url.pathToFileURL("A:/CodingProjects/SuzuScript/OLD/interpretor.mjs"));

        mainFunc.main();
    }


    console.log(chalk.red("Only very early version of comp has been added"));
    process.exit(0);
});