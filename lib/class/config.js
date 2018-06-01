
const Uteis = require('../resources/uteis'),
    command = require('child_process').exec,
    fs = require('fs'),
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
     *      
     *      // Log true OR Object
     *      log: true // Gera log diretorio principal
     *      //
     *      log:{
     *          path: '/src/logs',
     *          filename: 'logFilename' // Default 'Log - ${new Date().getTime()}'
     *      }
     * 
     *      //MESSAGES
     *      hideMessages: true,
     *      printCtrlStats: false,
     *      printStats: false,
     * })
     * 
     */
    constructor(config) {
        super();
        this.config = config || {};
        this.controllers = [];
        this.names = [];
        this.messages = [];
    }

    async exec() {
        if (!this.config.filename) return;
        _child = command('node', [this.config.filename], { detached: false, cwd: process.cwd() });
        await this._time(3000);
    }

    async init(args) {
        let params = args.slice(2);

        try {
            await this.exec();
            this._msgHead();
            for (let i = 0; i < this.controllers.length; i++) {
                if (params.length && !params.includes(this.names[i])) continue;

                await this.controllers[i].start(this.messages);
                this.messages = this.controllers[i].messages;
                this.logs = this.controllers[i].logs;
            }
            return this._finish();
        } catch (ex) {
            return this._finish();
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
    add(name, controller) {
        this.controllers.push(controller(this.config));
        this.names.push(name);
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

    /**
     * Gerar Log txt
     * 
     * @example
     * 
     *  config.log == boolean //('diretorio local') ;
     *  //ou
     *  config.log = {
     *      path: '/path'
     *  }
     */
    _logSave() {
        if (!this.config.log) return;

        if (typeof this.config.log == 'boolean')
            this.config.log = {};

        this.config.log.path = path.join(process.cwd(), this.config.log.path || '/logs');

        if (!fs.existsSync(this.config.log.path))
            fs.mkdirSync(this.config.log.path);

        this.config.log.filename = this.config.log.filename
            ? `${this.config.log.filename}.txt`
            : `Log - ${new Date().getTime()}.txt`;

        fs.writeFileSync(this._logPath, this.logsString);
    }

    get _logPath() {
        return path.join(this.config.log.path, this.config.log.filename);
    }

    //------------------------------------

    _finish(ex) {
        this[ex ? '_msgFalha' : '_msgFoot'](ex);
        this._logSave();
        this._killProcess();
        return this;
    }

    _killProcess() {
        if (_child) {
            //process.exit(-_child.pid);
            //_child.kill();
            //process.exit(-1);
        }
        return this;
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
            ._listMessage('********************************************', this._colors.white)
            ._setMsgPrintStats([
                { message: '**', cor: this._colors.white },
                { message: `    ${this.isSuccess ? 'Sucesso.' : 'Nao Foi.'}                            `, cor: this.isSuccess ? this._colors.green : this._colors.red },
                { message: '**', cor: this._colors.white }
            ])
            ._setMsgPrintStats('**                                        **', this._colors.white)
            ._setMsgPrintStats([
                { message: '**', cor: this._colors.white },
                { message: `  Controllers - ${this._padLeft(this.stats.controllers)}                     `, cor: this._colors.blue },
                { message: '**', cor: this._colors.white }
            ])
            ._setMsgPrintStats([
                { message: '**', cor: this._colors.white },
                { message: `      Métodos - ${this._padLeft(this.stats.events)}                     `, cor: this._colors.blue },
                { message: '**', cor: this._colors.white }
            ])
            ._setMsgPrintStats([
                { message: '**', cor: this._colors.white },
                { message: `      Acertos - ${this._padLeft(this.stats.success)}                     `, cor: this._colors.green },
                { message: '**', cor: this._colors.white }
            ])
            ._setMsgPrintStats([
                { message: '**', cor: this._colors.white },
                { message: `        Erros - ${this._padLeft(this.stats.errors)}                     `, cor: this._colors.red },
                { message: '**', cor: this._colors.white }
            ])
            ._setMsgPrintStats('**                                        **', this._colors.white)
            ._setMsgPrintStats('**                                        **', this._colors.white)
            ._setMsgPrintStats('********************************************', this._colors.white)
            ._setMsgPrintStats('********************************************', this._colors.white);

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
