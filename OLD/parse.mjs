//Parsor for the language (.suzu);
//Author: PuppyNuff

//imports
import fs from "node:fs";
import { exec } from "child_process";
import { Client, GatewayIntentBits } from "discord.js";
import path from "path";

//Main code
const strings = {};
const ints = {};
const arrays = {};
const dictionaries = {};
const varType = ["int", "string", "array"];
var parenthisis = 0;
var labelUsed = false;

export function parse(inputFile, outputFile, strict) {
    if (!inputFile || !outputFile) throw new Error("No input or output file specified");
    var dirPath = path.dirname(outputFile);

    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }

    var code;
    try {
        code = fs.readFileSync(inputFile, "utf8").toString();
    } catch (e) {
        throw new Error("Could not read file: " + inputFile);
    }

    var lines = code.split("\n");

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trimEnd();
        if (!line.includes("for") && !line.includes("if") && !line.includes("while") && !line.endsWith(";") && !line.includes("}") && !line == "\r" && !line.includes("//") && !line.includes("{") && !line.endsWith(",")) throw new Error("Invalid syntax on line " + (i + 1) + "Lines code : " + line);
    }

    var compiledCode = "";

    if (lines[0].includes('"usejs"')) {
        code.replace('"usejs"', "");
        fs.writeFileSync(outputFile, code);
        return exec(`node ${outputFile}`);
    }

    if (strict == true) {
        compiledCode += "'use strict';\n";
    }
    while (code.includes(".suzu")) {
        code = code.replace(".suzu", ".mjs");
    }

    for (var i = 0; i < lines.length; i++) {

        lines[i] = lines[i].split("//")[0];

        if (lines[i] == "") continue;
        if (lines[i].includes("string")) compiledCode = parseString(lines[i], compiledCode);
        else if (lines[i].includes("int")) compiledCode = parseInt(lines[i], compiledCode);
        else if (lines[i].includes("Array")) compiledCode = parseArray(lines[i], compiledCode);
        else if (lines[i].includes("dict")) compiledCode = parseDict(lines, compiledCode, i);
        else if (lines[i].includes("createClient(")) compiledCode = createClient(lines[i], compiledCode);
        else if (lines[i].includes("createBot(")) compiledCode = createBot(lines[i], compiledCode);
        else if (lines[i].includes("window(")) compiledCode = window(lines[i], compiledCode);
        else if (lines[i].includes("label(")) compiledCode = label(lines[i], compiledCode);
        else if (lines[i].includes("button(")) compiledCode = button(lines[i], compiledCode);
        else if (lines[i].includes("scrollArea(")) compiledCode = scrollArea(lines[i], compiledCode);
        else if (lines[i].includes("buttonClicked(")) {
            compiledCode = buttonClick(lines, compiledCode, i);
            while (!lines[i].includes("}")) {
                i++;
            }
            i++;
        }
        else compiledCode += lines[i] + "\n";
    }

    fs.writeFileSync(outputFile, compiledCode);
    return exec(`node ${outputFile}`);

}

function parseString(line, compiledCode) {

    var args = line.split(" ");
    var part = line.split(`"`);
    var name;
    var isConst;

    for (let i = 0; i < args.length; i++) {

        if (args[i] === "const") {
            isConst = true;
        }

        if (args[i] === "string") {
            while (!name) {
                name = args[i + 1];
                i++;
            }
            break;
        }
    }

    if (isConst === true) {
        compiledCode += `const ${name} = "${part[1]}";\n`;
    }
    else {
        compiledCode += `var ${name} = "${part[1]}";\n`;
    }

    strings[name] = part[1];

    return compiledCode;
}

function parseInt(line, compiledCode) {

    var args = line.split(" ");
    var name;
    var value;
    var isConst;

    for (let i = 0; i < args.length; i++) {

        if (args[i] === "const") {
            isConst = true;
        }

        if (args[i] === "int") {
            while (!name) {
                name = args[i + 1];
                i++;
            }

            while (!value) {
                if (args[i] == null) throw new Error("No value specified for int");
                value = args[i + 1].replace(";", "").replace("\r", "");
                if (isNaN(value)) value = null;
                i++;
            }
            break;
        }
    }

    if (isConst === true) {
        compiledCode += `const ${name} = ${value};\n`;
    }
    else {
        compiledCode += `var ${name} = ${value};\n`;
    }

    ints[name] = value;

    return compiledCode;
}

function parseArray(line, compiledCode) {
    var args = line.split(" ");
    var part = line.substring(line.indexOf("[") + 1, line.indexOf("]"));
    var name;
    var isConst;

    for (let i = 0; i < args.length; i++) {

        if (args[i] === "const") {
            isConst = true;
        }

        if (args[i] === "Array") {
            while (!name) {
                name = args[i + 1];
                i++;
            }
            break;
        }
    }

    if (isConst === true) {
        compiledCode += `const ${name} = [${part}];\n`;
    }
    else {
        compiledCode += `var ${name} = [${part}];\n`;
    }

    arrays[name] = part;

    return compiledCode;

}


function parseDict(lines, compiledCode, i) {
    var args = lines[i].split(" ");
    var name;
    var isConst;

    for (let i = 0; i < args.length; i++) {

        if (args[i] === "const") {
            isConst = true;
        }

        if (args[i] === "dict") {
            while (!name) {
                name = args[i + 1];
                i++;
            }
            break;
        }
    }

    if (isConst === true) {
        compiledCode += `const ${name} = {\n`;
    }
    else {
        compiledCode += `var ${name} = {\n`;
    }

    dictionaries[name] = {};

    var dict = dictionaries[name];

    var part = lines[i].substring(lines[i].indexOf("{") + 1, lines[i].indexOf("}"));
    var parts = part.split(",");

    for (let i = 0; i < parts.length; i++) {
        var key = parts[i].split(":")[0];
        var value = parts[i].split(":")[1];
        dict[key] = value;
    }

    return compiledCode;
}

function createClient(line, compiledCode, code) {

    const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildBans, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMessageTyping, GatewayIntentBits.DirectMessages, GatewayIntentBits.DirectMessageTyping, GatewayIntentBits.DirectMessageReactions, GatewayIntentBits.GuildVoiceStates] });

    var token = line.substring(line.indexOf("(") + 1, line.indexOf(")"));

    if (!token) throw new Error("No token specified");

    compiledCode = "import { Client, GatewayIntentBits } from 'discord.js';\n" + compiledCode;

    compiledCode += `const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildBans, GatewayIntentBits.GuildMembers, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMessageTyping, GatewayIntentBits.DirectMessages, GatewayIntentBits.DirectMessageTyping, GatewayIntentBits.DirectMessageReactions, GatewayIntentBits.GuildVoiceStates] });\n`;

    compiledCode += 'client.on(`ready`, () => {console.log(`Logged in as ${client.user.tag}`)});\n';

    compiledCode += `client.login(${token});\n`;

    return compiledCode;
}


function createBot(line, compiledCode) {
    var part = line.substring(line.indexOf("(") + 1, line.indexOf(")"));
    var args = line.split(',');

    var username = args[0];
    var password = args[1];
    var auth = args[2];
    var host = args[3];
    var version = args[4];
    var SbDoggosBot = args[5];

    if (!username && !auth && !host && !version && !SbDoggosBot) throw new Error("Username, auth, host, and version are required");

    if (!SbDoggosBot) {
        compiledCode = "import mineflayer from 'mineflayer';" + compiledCode;

        compiledCode += `var options = {
    version : ${version},
    host : ${host},
    username : ${username},
    password : ${password},
    auth : ${auth},
}\nconst bot = mineflayer.createBot(options);\nbot.on('login', async () => 
    console.log("Logged in as " + bot.username);
});\n`;
    } else {
        compiledCode = "import { login, handleMessages } from 'suzufunctions';" + compiledCode;

        compiledCode += `const bot = login("SBDoggosBot");\nbot.on('login', () => {
    console.log("Logged in as " + bot.username);
})
bot.on("message", async (message) => {
    handleMessages(message);
});\n`
    }

    return compiledCode;
}

function window(line, compiledCode) {
    compiledCode = "import { QMainWindow } from '@nodegui/nodegui'\n" + compiledCode;

    const part = line.substring(line.indexOf("(") + 1, line.indexOf(")"));
    const args = part.split(',');

    const width = args[0];
    const height = args[1];

    if (!width || !height) throw new Error("Width and height are required");

    if (args[2] && args[2].replace(" ", "") == "fixed") {
        compiledCode += `const win = new QMainWindow();
win.show();
win.setFixedSize(${width}, ${height});\n`;
    } else {
        compiledCode += `const win = new QMainWindow();
win.show();
win.setBaseSize(${width}, ${height});\n`;
    }
    return compiledCode;
}

function label(line, compiledCode) {

    if (labelUsed == false) {
        compiledCode = "import { QLabel } from '@nodegui/nodegui'\n" + compiledCode;


        var part = line.substring(line.indexOf("(") + 1, line.indexOf(")"));

        var args = part.split(",");

        compiledCode += `const label = new QLabel(win);\n`;
        compiledCode += `label.setText(${args[0]});\n`;

        compiledCode = compiledCode.replace("win.show();", "");
        compiledCode += `win.show();\n`;
        compiledCode += `global.win = win;\n`;

        labelUsed = true;

        return compiledCode;
    }

    else {
        var part = line.substring(line.indexOf("(") + 1, line.indexOf(")"));
        var args = part.split(",");
        var i;

        compiledCode += `const ${args[1]} = new QLabel(win);\n`;
        compiledCode += `${args[1]}.setText(${args[0]});\n`;

        compiledCode = compiledCode.replace("win.show();", "");
        compiledCode += `win.show();\n`;
        compiledCode += `global.win = win;\n`;
        return compiledCode;
    }

}

function button(line = "", compiledCode) {
    const part = line.substring(line.indexOf("(") + 1, line.lastIndexOf(")"));
    const args = part.split(",");
    compiledCode = "import { QPushButton } from '@nodegui/nodegui'\n" + compiledCode;
    compiledCode += `const ${args[1]} = new QPushButton(win);\n`;
    compiledCode += `${args[1]}.setText(${args[0]});\n`;
    compiledCode = compiledCode.replace("win.show();", "");
    compiledCode += `win.setCentralWidget(${args[1]});\n`;
    compiledCode += `win.show();\n`;
    return compiledCode;
}

function scrollArea(line, compiledCode) {
    compiledCode = "import { QScrollArea } from '@nodegui/nodegui'\n" + compiledCode;

    const part = line.substring(line.indexOf("(") + 1, line.indexOf(")"));
    const args = part.split(",");

    compiledCode += `const ${args[0]} = new QScrollArea(win);\n`;

    compiledCode += `${args[0]}.setWidget(${args[1]});\n`;

    compiledCode += `win.setCentralWidget(${args[0]});\n`;

    compiledCode = compiledCode.replace("win.show();", "");

    compiledCode += `win.show();\n`;

    return compiledCode;
}

function buttonClick(lines, compiledCode, i) {
    const part = lines[i].substring(lines[i].indexOf("(") + 1, lines[i].indexOf(")"));
    const args = part.split(",");
    compiledCode += `${args[0]}.addEventListener('clicked', () => {\n`;
    i++;
    parenthisis = 1;
    while (lines[i] != '}' && parenthisis != 0) {
        if (lines[i].includes("{")) parenthisis++;
        if (lines[i].includes("}")) parenthisis--;

        if ((parenthisis != 0 && !lines[i].includes('}')) || parenthisis >= 1) compiledCode += lines[i] + "\n";
        i = i + 1;
    }
    compiledCode += `});\n`;
    return compiledCode;
}