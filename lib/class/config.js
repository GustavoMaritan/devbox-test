
const Uteis = require('../resources/uteis'),
    command = require('child_process').exec,
    path = require('path');
let _child = null;

class Config extends Uteis {

    /**
     * 
     * @param {object} config 
     * 
     * @example
     * 
     * new Config({
     *      uri: '',
     *      headers: {},
     *      filename: 'app.js',
     *      hideMessages: true,
     *      printCtrlStats: false,
     *      printStats: false
     * })
     * 
     */
    constructor(config) {
        super();
        this.config = config;
        this.controllers = [];
        this.messages = [];
    }

    async exec() {
        _child = command('node', [path.join(process.cwd(), this.config.filename)], {
            detached: true,

        });
        await this._time(3000);
    }

    _killProcess() {
        if (_child) {
            //process.exit(-_child.pid);
            _child.kill();
            //process.exit(-1);
        }
        return this;
    }

    async init() {
        try {
            if (this.config.filename) {
                console.warn('Start aplicação em desenv...');
                process.exit(-1);
                //await this.exec();
            }
            
            this._msgHead();

            for (let i = 0; i < this.controllers.length; i++) {
                await this.controllers[i].start(this.messages);
                this.messages = this.controllers[i].messages;
            }
            this._msgFoot();
            return this._killProcess();
        } catch (ex) {
            this._msgFalha(ex);
            return this._killProcess();
        }
    }

    /**
     * Gera instancias do TEST passando config gerais.
     * 
     * @param {function} controller 
     * 
     * @example
     * 
     * Config.add((config) => { return new Test(config) })
     */
    add(controller) {
        this.controllers.push(controller(this.config));
        return this;
    }

    get isSuccess() {
        return this.controllers.filter(x => x.isSuccess).length == this.controllers.length;
    }

    get stats() {
        this._stats = this._stats || {
            ...this._sum,
            ...{ controllers: this.controllers.length }
        }
        return this._stats;
    }

    get _sum() {
        let success = 0,
            errors = 0,
            events = 0;

        this.controllers.map(x => {
            success += x.stats.success;
            errors += x.stats.errors;
            events += x.stats.events;
        });

        return {
            success,
            errors,
            events
        }
    }

    // MESSAGES

    _msgHead() {
        this._listMessageExec()
            ._listMessage('********************************************', this._colors.white)
            ._listMessage('************ INICIANDO TESTES **************', this._colors.yellow)
            ._listMessage('********************************************', this._colors.white);
        return this;
    }

    _msgFoot() {
        this
            ._listMessage('********************************************', this._colors.white)
            ._listMessage('************ TESTES FINALIZADOS ************', this._colors.yellow)
            ._listMessage('********************************************', this._colors.white);

        if (this.config.printStats)
            this
                ._listMessageColors([
                    { message: '**', cor: this._colors.white },
                    { message: `    ${this.isSuccess ? 'Sucesso.' : 'Nao Foi.'}                            `, cor: this.isSuccess ? this._colors.green : this._colors.red },
                    { message: '**', cor: this._colors.white }
                ])
                ._listMessage('**                                        **', this._colors.white)
                ._listMessageColors([
                    { message: '**', cor: this._colors.white },
                    { message: `  Controllers - ${this._padLeft(this.stats.controllers)}                     `, cor: this._colors.blue },
                    { message: '**', cor: this._colors.white }
                ])
                ._listMessageColors([
                    { message: '**', cor: this._colors.white },
                    { message: `      Métodos - ${this._padLeft(this.stats.events)}                     `, cor: this._colors.blue },
                    { message: '**', cor: this._colors.white }
                ])
                ._listMessageColors([
                    { message: '**', cor: this._colors.white },
                    { message: `      Acertos - ${this._padLeft(this.stats.success)}                     `, cor: this._colors.green },
                    { message: '**', cor: this._colors.white }
                ])
                ._listMessageColors([
                    { message: '**', cor: this._colors.white },
                    { message: `        Erros - ${this._padLeft(this.stats.errors)}                     `, cor: this._colors.red },
                    { message: '**', cor: this._colors.white }
                ])
                ._listMessage('**                                        **', this._colors.white)
                ._listMessage('**                                        **', this._colors.white)
                ._listMessage('********************************************', this._colors.white)
                ._listMessage('********************************************', this._colors.white);

        return this;
    }

    _msgFalha(ex) {
        this._clearMessages()
            ._listMessage('********************************************', this._colors.white)
            ._listMessageColors([
                { message: '**', cor: this._colors.white },
                { message: '              TESTE FALHOU              ', cor: this._colors.red },
                { message: '**', cor: this._colors.white },
            ])
            ._listMessage('********************************************', this._colors.white)
            ._listMessage(this.printObject(ex));
        return this;
    }
}

module.exports = Config;
