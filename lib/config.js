
const Uteis = require('./uteis'),
    command = require('child_process').spawn,
    path = require('path');

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
     *      hideMessages: true
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
        command('node', [path.join(process.cwd(), this.config.filename)], {
            detached: true
        });
        await this._time(3000);
    }

    async init() {
        try {
            if (this.config.filename) await this.exec();

            this._listMessageExec();
            this._listMessage('********************************************', this._colors.white);
            this._listMessage('************ INICIANDO TESTES **************', this._colors.yellow);
            this._listMessage('********************************************', this._colors.white);

            for (let i = 0; i < this.controllers.length; i++) {
                await this.controllers[i].start(this.messages);
                this.messages = this.controllers[i].messages;
            }

            this._listMessage('********************************************', this._colors.white);
            this._listMessage('************ TESTES FINALIZADOS **************', this._colors.yellow);
            this._listMessage('********************************************', this._colors.white);
            this._listMessageColors([
                {
                    message: '**',
                    cor: this._colors.white
                }, {
                    message: `    ${this.isSuccess ? 'Sucesso.' : 'Nao Foi.'}                            `,
                    cor: this.isSuccess ? this._colors.green : this._colors.red
                }, {
                    message: '**',
                    cor: this._colors.white
                }
            ])
            this._listMessage('**                                        **', this._colors.white);
            this._listMessageColors([
                {
                    message: '**',
                    cor: this._colors.white
                }, {
                    message: `  Controllers - ${this._padLeft(this.stats.controllers)}                     `,
                    cor: this._colors.blue
                }, {
                    message: '**',
                    cor: this._colors.white
                }
            ])
            this._listMessageColors([
                {
                    message: '**',
                    cor: this._colors.white
                }, {
                    message: `      Métodos - ${this._padLeft(this.stats.events)}                     `,
                    cor: this._colors.blue
                }, {
                    message: '**',
                    cor: this._colors.white
                }
            ])
            this._listMessageColors([
                {
                    message: '**',
                    cor: this._colors.white
                }, {
                    message: `      Acertos - ${this._padLeft(this.stats.success)}                     `,
                    cor: this._colors.green
                }, {
                    message: '**',
                    cor: this._colors.white
                }
            ])
            this._listMessageColors([
                {
                    message: '**',
                    cor: this._colors.white
                }, {
                    message: `        Erros - ${this._padLeft(this.stats.errors)}                     `,
                    cor: this._colors.red
                }, {
                    message: '**',
                    cor: this._colors.white
                }
            ])
            //this._listMessage(`**    ${this.isSuccess ? 'Sucesso.' : 'Nao Foi.'}                            **`, this.isSuccess ? this._colors.green : this._colors.red);
            //this._listMessage('**                                        **', this._colors.white);
            //this._listMessage(`**  Controllers - ${this._padLeft(this.stats.controllers)}                     **`, this._colors.blue);
            //this._listMessage(`**      Métodos - ${this._padLeft(this.stats.events)}                     **`, this._colors.blue);
            //this._listMessage(`**      Acertos - ${this._padLeft(this.stats.success)}                     **`, this._colors.green);
            //this._listMessage(`**        Erros - ${this._padLeft(this.stats.errors)}                     **`, this._colors.red);
            this._listMessage('**                                        **', this._colors.white);
            this._listMessage('**                                        **', this._colors.white);
            this._listMessage('********************************************', this._colors.white);
            this._listMessage('********************************************', this._colors.white);
            return this;
        } catch (error) {
            console.log(JSON.stringify(error, undefined, 4));
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
}

module.exports = Config;
