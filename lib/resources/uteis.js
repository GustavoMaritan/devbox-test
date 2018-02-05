const clc = require('cli-color'),
    fs = require('fs'),
    path = require('path');

class Uteis {

    // LOGS

    get logs() {
        if (!this._logs) this._logs = [];
        return this._logs;
    }

    set logs(value) {
        !Array.isArray(value)
            ? this.logs.push(value)
            : value.map(x => this.logs.push(x));
    }

    get logsString() {
        let m = this.logs.map(x => {
            if (x.many) {
                let m = x.messages.map(x => {
                    return x.message;///clc[x.cor]();
                });
                return m.join('');
            }
            return x.message;///clc[x.cor]();
        });
        return m.join('\n\r');
    }

    // ----------------

    _setMsgPrintStats(message, cor) {
        return this._setMsgIsValid(this.config.printStats, message, cor)
    }

    _setMsgPrintCtrlStats(message, cor) {
        return this._setMsgIsValid(this.config.printCtrlStats, message, cor)
    }

    _setMsgPrintError(printError, message, cor) {
        return this._setMsgIsValid(printError, message, cor)
    }

    _setMsgPrintSuccess(printSuccess, message, cor) {
        return this._setMsgIsValid(printSuccess, message, cor)
    }

    _setMsgIsValid(isValid, message, cor) {
        let multiColors = Array.isArray(message);
        if (isValid) return this[multiColors ? '_listMessageColors' : '_listMessage'](message, cor);
        this.logs = multiColors ? { messages: message, many: true } : { message, cor };
        return this;
    }

    _listMessage(message, cor) {
        let msg = { message, cor };
        this.logs = msg;
        this.messages.push(msg);
        this._print(message, cor);
        return this;
    }

    /**
     * 
     * @param {Array} messages 
     * 
     * @example
     * 
     * this._listMessageColors([{ message: '', cor: ''}]);
     */
    _listMessageColors(messages) {
        let msg = { messages, many: true };
        this.logs = msg;
        this.messages.push(msg);
        this._printManyColors(messages);
        return this;
    }

    _listMessageExec() {
        console.clear();
        this.messages.map(x => {
            if (x.many)
                this._printManyColors(x.messages);
            else
                this._print(x.message, x.cor);
        });
        return this;
    }

    _clearMessages() {
        console.clear();
        this.messages = [];
        return this;
    }

    _print(message, cor) {
        if (!this.config.hideMessages)
            console.log(clc[cor](message));
        return this;
    }

    _printManyColors(messages) {
        let m = messages.map(x => {
            return clc[x.cor](x.message);
        })
        console.log(m.join(''));
        return this;
    }

    printObject(obj) {
        return JSON.stringify(obj, undefined, 4);
    }

    get _messagesConcat() {
        let m = this.messages.map(x => {
            if (x.many) {
                let m = x.messages.map(x => {
                    return x.message;///clc[x.cor]();
                });
                return m.join('');
            }
            return x.message;///clc[x.cor]();
        });
        return m;
    }

    get _colors() {
        return {
            magenta: 'magenta',
            white: 'white',
            green: 'green',
            blue: 'blue',
            yellow: 'yellow',
            red: 'red'
        }
    }

    async _time(value) {
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve();
            }, value || 2000);
        })
    }

    _assign(target, ...sources) {
        if (!sources.length) return target;

        const source = sources.shift();

        if (this._isObject(target) && this._isObject(source)) {
            for (const key in source) {
                if (this._isObject(source[key])) {
                    if (!target[key]) Object.assign(target, { [key]: {} });
                    this._assign(target[key], source[key]);
                } else {
                    Object.assign(target, { [key]: source[key] });
                }
            }
        }
        return this._assign(target, ...sources);
    }

    _isObject(item) {
        return (item && typeof item === 'object' && !Array.isArray(item));
    }

    /**
     * Retorna arquivo em base64 
     * @param {String} caminho 
     * 
     * @example
     * 
     * getFileToBase64('/resources/filename.pdf');
     */
    getFileToBase64(caminho) {
        let fullPath = process.cwd();

        fullPath = caminho.indexOf(fullPath) != -1
            ? caminho
            : path.join(fullPath, caminho);

        if (!fs.existsSync(fullPath)) return null;

        let file = fs.readFileSync(caminho);

        let a = !file
            ? null
            : new Buffer(file).toString('base64');
        return a;
    }

    _padLeft(value) {
        value = '   ' + value;
        return value.substr(value.length - 3);
    }
}

module.exports = Uteis;