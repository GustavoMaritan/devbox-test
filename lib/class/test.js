const Uteis = require('../resources/uteis'),
    execusao = require('../resources/execucao');

class Test extends Uteis {

    /**
     * constructor
     * @param {object} config 
     * 
     * @example
     * 
     *  var config = {
     *      uri: '',
     *      headers: {}
     *  };
     * 
     *  new Test(config);
     */
    constructor(config) {
        super();
        this.config = config;
        this.execusoes = [];
        this.countEvents = 0;
        this.stats = {
            events: 0,
            success: 0,
            errors: 0
        }
        this.erros = [];
        this.success = [];
        execusao(this);
    }

    // PUBLIC 

    async start(messages) {
        this.messages = messages || [];
        const results = [];
        this._listMessageExec()
            ._listMessage(``, this._colors.white)
            ._listMessage(`----------- TESTE => ${this.title} -----------`, this._colors.magenta);

        let next = true;
        for (let i = 0; i < this.execusoes.length; i++) {               // EVENTS 
            for (let j = 0; j < this.execusoes[i].list.length; j++) {   // EVENTS -> EXECS
                next = await this.execusoes[i].list[j]()                       // EXECS
                //await this.time();
                if (!next) break;
            }
            if (!next) break;
        }
        this._listMessage(`**************************************************`, this._colors.white)
            ._listMessageColors([
                { message: '**', cor: this._colors.white },
                { message: `    ${this.isSuccess ? 'Sucesso.' : 'Nao Foi.'}                                  `, cor: this.isSuccess ? this._colors.green : this._colors.red },
                { message: '**', cor: this._colors.white }
            ])
            ._listMessage(`**                                              **`, this._colors.white)
            ._listMessageColors([
                { message: '**', cor: this._colors.white },
                { message: `             Métodos testados - ${this._padLeft(this.stats.events)}           `, cor: this._colors.blue },
                { message: '**', cor: this._colors.white }
            ])
            ._listMessageColors([
                { message: '**', cor: this._colors.white },
                { message: `                      Acertos - ${this._padLeft(this.stats.success)}           `, cor: this._colors.green },
                { message: '**', cor: this._colors.white }
            ])
            ._listMessageColors([
                { message: '**', cor: this._colors.white },
                { message: `                        Erros - ${this._padLeft(this.stats.errors)}           `, cor: this._colors.red },
                { message: '**', cor: this._colors.white }
            ])
            ._listMessage(`**                                              **`, this._colors.white)
            ._listMessage(`**************************************************`, this._colors.white)
            ._listMessage(``, this._colors.white)
            ._listMessage(`----------- FINALIZADO ${this.title} -----------------------------`, this._colors.magenta)
            ._listMessage(``, this._colors.white);
        return this;
    }

    /**
     * SETA EVENTOS TESTES
     * @param {object} config 
     * 
     * @example
     * 
     *  var config = {
     *          title: ''
     *          url: '',
     *          method: '',
     *          params: {},
     *          await: true,
     *          printError: true,
     *          printSuccess: true,
     *          merge: {},
     *          body: {},
     *          headers: {},
     *  }
     */
    event(config) {
        this.stats.events++;
        this.execusao = {
            id: this.execusoes.length,
            list: [],
            config: config
        };

        if (config.body) this.execusao.list.push(this.$body(config.body));
        if (config.merge) this.execusao.list.push(this.$merge(config.merge));
        this.execusao.list.push(this.$urlPrepare(config));
        this.execusao.list.push(this.$message(`Teste ${config.title || ''} iniciado.`, this._colors.green));
        this.execusao.list.push(this.$exec(this.execusao.id, config));
        this.execusoes.push(this.execusao);
        return this;
    }

    title(value) {
        this.title = value;
        return this;
    }

    body(obj) {
        if (obj) this.body = obj;
        return this;
    }

    getReturn(attr) {
        let _this = this;
        return () => {
            let sl = attr.split('.'),
                obj = null;

            if (!_this.retorno) return null;

            sl.map(x => {
                obj = !obj ? _this.retorno[x] : obj[x];
            })
            return obj;
        }
    }

    getBody(attr) {
        let _this = this;
        return () => {
            let sl = attr.split('.'),
                obj = null;

            if (!_this.body) return null;

            sl.map(x => {
                obj = !obj ? _this.body[x] : obj[x];
            })
            return obj;
        }
    }

    get isSuccess() {
        return !this.stats.errors;
    }

    // PRIVATES

    _prepare(obj) {
        for (let i in obj) {
            if (typeof obj[i] == 'function')
                obj[i] = obj[i]();
        }
        return obj;
    }

    _finish(error, id, content) {
        let exec = this.execusoes[id];
        if (error) {
            this.erros.push({ error: error, exec: exec });
            this.stats.errors++;
            this._listMessageExec()
                ._listMessage(`Teste ${exec.config.title || ''} finalizado com erro.`, this._colors.red);

            if (exec.config.printError) {
                this._listMessage(`Error object.`, this._colors.yellow)
                    ._listMessage(this.printObject(error), this._colors.yellow);
            }
            this._listMessage(`-----------------------------------`, this._colors.white);
            return !exec.config.await;
        } else {
            this.success.push({ exec: exec, retorno: content });
            this.stats.success++;
            this.retorno = content;
            this._listMessageExec()
                ._listMessage(`Teste ${exec.config.title || ''} finalizado com sucesso.`, this._colors.green);
            if (exec.config.printSuccess) {
                this._listMessage(this.printObject(this.retorno), this._colors.yellow);
            }
            this._listMessage(`-----------------------------------`, this._colors.white);
            return true;
        }
    }

}

module.exports = Test;

/*


// EXECUCOES

    $body(obj) {
        let _this = this;
        return () => {
            _this.body(obj);
            return true;
        }
    }

    $printMessages() {
        let _this = this;
        return async () => {
            _this._listMessageExec();
            return true;
        }
    }

    $message(message, cor) {
        let _this = this;
        return async () => {
            _this._print(message, cor);
            return true;
        }
    }

    $merge(obj) {
        let _this = this;
        return async () => {
            obj = _this._prepare(obj);
            _this.body = _this._assign(_this.body, obj);
            return true;
        }
    }

    $exec(id, config) {
        let _this = this;

        return async () => {
            try {
                let retorno = await request({
                    url: _this.config.uri + config.url,
                    method: config.method,
                    headers: config.headers,
                    body: _this.body,
                    json: true
                });
                return _this._finish(null, id, retorno);
            } catch (error) {
                return _this._finish(error, id);
            }
        }
    }

    $urlPrepare(config) {
        let _this = this;
        return () => {
            config.headers = this._assign(config.headers || {}, this.config.headers || {});
            if (!config.params) return true;

            config.params = _this._prepare(config.params);
            let query = [];

            for (let i in config.params) {
                if (config.url.indexOf(':' + i) == -1)
                    query.push(i + '=' + config.params[i])
                else
                    config.url = config.url.replace(`:${i}`, config.params[i]);
            }
            config.url = query.length ? config.url + '?' + query.join('&') : config.url;
            return true;
        }
    }




*/