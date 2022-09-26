//? Importing chalk
const chalk = require("chalk");
const { child_process } = require("child_process");


//* #####################################################################################
//? # CONSTANTS
//* #####################################################################################
const DIGITS = "1234567890";

//* #####################################################################################
//? # ERRORS
//* #####################################################################################

class Error {
    constructor(error_name, pos_start, pos_end, details) {
        this.error_name = error_name;
        this.details = details;
        this.pos_start = pos_start;
        this.pos_end = pos_end;
    }

    as_string() {
        const result = chalk.red(`${this.error_name} : ${this.details}
        
In File ${this.pos_start.fn},
On line ${this.pos_start.ln + 1}`);
        return result;
    }
}

class IllegalCharError extends Error {
    constructor(pos_start, pos_end, details) {
        super("Illegal Character", pos_start, pos_end, details);
    }
}

//* #####################################################################################
//? # TOKENS
//* #####################################################################################

const SHORT       =   "SHORT"; //* 16 Bit integer
const INT         =     "INT"; //* 32 Bit integer
const LONG        =    "LONG"; //* 64 Bit integer
const SFLOAT      =  "SFLOAT"; //* 16 Bit Floating point number
const FLOAT       =   "FLOAT"; //* 32 Bit floating point number
const LFLOAT      =  "LFLOAT"; //* 64 Bit floating point number
const PLUS        =    "PLUS"; //* +
const MINUS       =   "MINUS"; //* -
const MUL         =     "MUL"; //* *
const DIV         =     "DIV"; //* /
const LPAREN      =  "LPAREN"; //* (
const RPAREN      =  "RPAREN"; //* )

class Token {
    constructor(type_, value = undefined, pos_start = undefined, pos_end = undefined) {
        this.type = type_;
        this.value = value;

        if(pos_start) {
            this.pos_start = pos_start;
            this.pos_end = pos_start + 1;
        }

        if(pos_end) {
            this.pos_end = pos_end;
        }
    }

    repr() {
        if(this.value) {
            return `${this.type}:${this.value}`;
        }

        return `${this.type}`;
    }
}

//* #####################################################################################
//? # POSITION
//* #####################################################################################

class Position {
    constructor(idx, ln, col, fn, ftxt) {
        this.idx = idx;
        this.ln = ln;
        this.col = col;
        this.fn = fn;
        this.ftxt = ftxt;
    }

    advance(current_char) {
        this.idx += 1;
        this.col += 1;

        if(current_char == '\n') {
            this.ln += 1;
            this.col = 0;
        }

        return this;
    }

    copy() {
        return new Position(this.idx, this.ln, this.col, this.fn, this.txt);
    }
}

//* #####################################################################################
//? # LEXER
//* #####################################################################################
class Lexer {

    constructor(text, fn, fntxt) {
        this.text = text;
        this.fn = fn;
        this.pos = new Position(-1, 0, -1, fn, fntxt);
        this.cur_char = 0;
        this.advance()
    }

    advance() {
        this.pos.advance();
        if(this.pos.idx < this.text.length) {
            this.cur_char = this.text[this.pos.idx];
        } else {
            this.cur_char = undefined;
        }
    }

    make_tokens() {
        let tokens = [];

        while(this.cur_char != undefined) {
            if(this.cur_char == " ") {
                this.advance();
            } else {
                if(this.cur_char === '+') {
                    tokens.push(new Token(PLUS));
                    this.advance();
                    continue;
                }

                if(this.cur_char === '-') {
                    tokens.push(new Token(MINUS));
                    this.advance();
                    continue;
                }

                if(this.cur_char === '/') {
                    tokens.push(new Token(DIV));
                    this.advance();
                    continue;
                }

                if(this.cur_char === '*') {
                    tokens.push(new Token(MUL));
                    this.advance();
                    continue;
                }

                if(this.cur_char === ')') {
                    tokens.push(new Token(LPAREN));
                    this.advance();
                    continue;
                }

                if(this.cur_char === '(') {
                    tokens.push(new Token(RPAREN));
                    this.advance();
                    continue;
                }

                if(DIGITS.includes(this.cur_char)) {
                    const number = this.make_number();
                    tokens.push(number);
                    this.advance();
                    continue;
                }

                const pos_start = this.pos.copy();
                return new IllegalCharError(pos_start, this.pos, `"` + this.cur_char + `"`);
            }
        }

        return tokens;
    }

    make_number() {
        let num_str = '';
        let dot_count = 0;

        while (this.cur_char != undefined && `${DIGITS}.`.includes(this.cur_char)) {
            if(this.cur_char === ".") {
                if(dot_count === 1) break;

                dot_count += 1;
                num_str += ".";
            } else {
                num_str += this.cur_char;
            }

            this.advance();
        }

        if(dot_count == 0) {
            return new Token(INT, +num_str);
        } else {
            return new Token(FLOAT, +num_str);
        }
    }
}

//* #####################################################################################
//? # NODES
//* #####################################################################################

//? For the short type
class ShortNode {
    constructor(tok) {
        if(tok > 32767 || tok < -32767) console.log(chalk.red("[ERROR] Invalid short size! Raise the size to an int or log"));
        if(tok.includes(".")) console.log(chalk.red("[ERROR] Integers cannot have a decimal. Change to a float"));

        this.tok = tok;
    }

    repr() {
        return `${this.tok}`;
    }
}

//? For the int type
class IntNode {
    constructor(tok) {
        if(tok > 2147483684 || tok < -2147483684) console.log(chalk.red("[ERROR] Invalid int size! Raise the size to a long"));
        if(tok.toString().includes(".")) console.log(chalk.red("[ERROR] Integers cannot have a decimal. Change to a float"));

        this.tok = tok;
    }

    repr() {
        return `${this.tok}`;
    }
}

//? For the long type
class LongNode {
    constructor(tok) {
        if(tok > -(9 * 10^19) || tok < (9 * 10^19)) console.log(chalk.red("[ERROR] Invalid int size! Raise the size to a long"));
        if(tok.includes(".")) console.log(chalk.red("[ERROR] Integers cannot have a decimal. Change to a float"));

        this.tok = tok;
    }

    repr() {
        return `${this.tok}`;
    }
}

//? For the sfloat type
class SFloatNode {
    constructor(tok) {
        if(tok > 32767 || tok < -32767) console.log(chalk.red("[ERROR] Invalid short size! Raise the size to an int or log"));

        this.tok = tok;
    }

    repr() {
        return `${this.tok}`;
    }
}

//? For the float type
class FloatNode {
    constructor(tok) {
        if(tok > 2147483684 || tok < -2147483684) console.log(chalk.red("[ERROR] Invalid int size! Raise the size to a long"));
        this.tok = tok;
    }

    repr() {
        return `${this.tok}`;
    }
}

//? For the long type
class LFloatNode {
    constructor(tok) {
        if(tok > -(9 * 10^19) || tok < (9 * 10^19)) console.log(chalk.red("[ERROR] Invalid int size! Raise the size to a long"));
        if(tok.includes(".")) console.log(chalk.red("[ERROR] Integers cannot have a decimal. Change to a float"));

        this.tok = tok;
    }

    repr() {
        return `${this.tok}`;
    }
}

class BinOpNode {
    constructor(left_node, op_tok, right_node) {
        this.left_node = left_node;
        this.op_tok = op_tok;
        this.right_node = right_node;
    }

    repr() {

        let returnstr = "";
        if(!this.left_node?.tok?.value) {
            returnstr += `(${this.format(this.left_node)})`;
        } else {
            returnstr += this.left_node.tok.value;
        }


        returnstr += " " + this.op_tok.type + " ";


        if(!this.right_node?.tok?.value) {
            returnstr += this.format(this.left_node);
        }  else {
            returnstr += this.right_node.tok.value;
        }

        return returnstr;
    }

    format (node) {
        let string = "";

        for(const key in node) {
            if(key === "left_node" && !node[key]?.tok?.value) {
                string += "(";
                string += this.format(node[key]);
                string += ")";
            } else if(key === "left_node")  {
                string += node[key].tok.value
            }

            if(key === "right_node" && !node[key]?.tok?.value) {
                string += "(";
                string += this.format(node[key]);
                string += ")";
            } else if(key === "right_node")  {
                string += node[key].tok.value
            }

            if(key == "op_tok") {
                string += " " + node[key].type + " ";
            }
        }


        return string;
    }
}

//* #####################################################################################
//? # PARSE RESULT
//* #####################################################################################

class ParseResult {
    constructor() {
        this.error = undefined;
        this.node = undefined;
    }
}

//* #####################################################################################
//? # PARSER
//* #####################################################################################

class Parser {
    constructor(tokens) {
        this.tokens = tokens;
        this.tok_idx = -1;
        this.advance();
    }

    advance() {
        this.tok_idx += 1;

        if(+this.tok_idx < this.tokens.length) {
            this.current_tok = this.tokens[this.tok_idx];
        }

        return this.current_tok;
    }

    parse() {
        const res = this.expr(this);
        return res;
    }

    factor(s) {
        let tok = s.current_tok;

        if(s.current_tok.type === SFLOAT) {
            s.advance();
            return new SFloatNode(tok);
        }

        if(s.current_tok.type === FLOAT) {
            s.advance();
            return new FloatNode(tok);
        }

        if(s.current_tok.type === LFLOAT) {
            s.advance();
            return new LFloatNode(tok);
        }

        if(s.current_tok.type === SHORT) {
            s.advance();
            return new ShortNode(tok);
        }

        if(s.current_tok.type === INT) {
            s.advance();
            return new IntNode(tok);
        }

        if(s.current_tok.type === LONG) {
            s.advance();
            return new LongNode(tok);
        }
    }

    term(s) {
        return s.binOP(s.factor, [MUL, DIV]);
    }

    expr(s) {
        return s.binOP(s.term, [PLUS, MINUS]);
    }

    binOP(func, ops) {
        let left = func(this);


        while(ops.includes(this.current_tok.type)) {
            const op_tok = this.current_tok;

            this.advance();

            const right = func(this);
    
            left = new BinOpNode(left, op_tok, right);
        }

        return left;
    }
}

//* #####################################################################################
//? # RUN
//* #####################################################################################

function run(text, fn, text) {
    //* Generate tokens
    const lexer = new Lexer(text, fn, text);
    const tokens = lexer.make_tokens();
    if(!Array.isArray(tokens)) {
        return tokens;
    }

    //* Generate AST
    const parser = new Parser(tokens);
    const ast = parser.parse();

    return ast.repr();
}

module.exports.run = run;