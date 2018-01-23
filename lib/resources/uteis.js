const clc = require('cli-color'),
    fs = require('fs'),
    path = require('path');

class Uteis {

    _padLeft(value) {
        value = '   ' + value;
        return value.substr(value.length - 3);
    }

    _listMessage(message, cor) {
        this.messages.push({
            message: message,
            cor: cor
        });
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
        this.messages.push({
            messages: messages,
            many: true
        });
        this._printManyColors(messages);
        return this;
    }

    _clearMessages() {
        console.clear();
        this.messages = [];
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
            : Buffer(file).toString('base64');
        return a;
    }
}

module.exports = Uteis;