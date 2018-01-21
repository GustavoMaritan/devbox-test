const Uteis = require('../resources/uteis'),
    request = require('request-promise');

class Test extends Uteis {

    /**
     * constructor
     * Parametro passado pela class Config
     * @param {object} config 
     * 
     * @example
     * 
     *  var config = {
     *      uri: '',
     *      headers: {},
     *      printCtrlStats: false
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
    }

    // PUBLIC 

    async start(messages) {
        this.messages = messages || [];
        const results = [];
        this._msgHead();

        let next = true;
        for (let i = 0; i < this.execusoes.length; i++) {               // EVENTS 
            for (let j = 0; j < this.execusoes[i].list.length; j++) {   // EVENTS -> EXECS
                next = await this.execusoes[i].list[j]()                       // EXECS
                //await this.time();
                if (!next) break;
            }
            if (!next) break;
        }

        this._msgFoot();
        return this;
    }

    /**
     * SETA EVENTOS TESTES
     * @param {object} config 
     * 
     * @example
     * 
     *  var config = {
     *      title: ''
     *      url: '',
     *      method: '',
     *      params: {},
     *      await: true,
     *      printError: false,
     *      printSuccess: false,
     *      merge: {},
     *      body: {},
     *      headers: {},
     *      expected: retorno => retorno.statusCode == 200
     *  }
     */
    event(config) {
        this.stats.events++;
        var execusao = {
            id: this.execusoes.length,
            list: [],
            config: config
        };

        if (config.body) execusao.list.push(this.$body(config.body));
        if (config.merge) execusao.list.push(this.$merge(config.merge));
        execusao.list.push(this.$urlPrepare(config));
        execusao.list.push(this.$message(`Teste ${config.title || ''} iniciado.`, this._colors.green));
        execusao.list.push(this.$exec(execusao.id, config));
        execusao.list.push(this.$finish(execusao.id));
        execusoes.push(execusao);
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
            if (!attr)
                return _this.retorno;

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

    getRetornoStatus() {
        let _this = this;
        return () => {
            return _this.retornoStatus;
        }
    }

    getExecucao(id) {
        return this.execusoes[id];
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

    /**
     * Resultado esperado pelo teste
     * @param {function} condition 
     * 
     * @example
     * 
     *  this.$expected(x => x.statusCode == 200)
     * 
     * @private
     */
    _retExpected(condition) {
        return condition(this.retorno);
    }

    // MESSAGES

    _msgHead() {
        this._listMessageExec()
            ._listMessage(``, this._colors.white)
            ._listMessage(`----------- TESTE => ${this.title} -----------`, this._colors.magenta);
        return this;
    }

    _msgFoot() {
        if (this.config.printCtrlStats)
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
                ._listMessage(`**************************************************`, this._colors.white);

        this._listMessage(``, this._colors.white)
            ._listMessage(`----------- FINALIZADO ${this.title} -----------------------------`, this._colors.magenta)
            ._listMessage(``, this._colors.white);
        return this;
    }

    _msgFinishError(exec) {
        this._listMessageExec()
            ._listMessage(`Teste ${exec.config.title || ''} finalizado com erro.`, this._colors.red);

        if (exec.config.printError) {
            this._listMessage(`Error object.`, this._colors.yellow)
                ._listMessage(this.printObject(this.retorno), this._colors.yellow);
        }
        this._listMessage(`-----------------------------------`, this._colors.white);
        return this;
    }

    _msgFinishSuccess(exec) {
        this._listMessageExec()
            ._listMessage(`Teste ${exec.config.title || ''} finalizado com sucesso.`, this._colors.green);
        if (exec.config.printSuccess) {
            this._listMessage(this.printObject(this.retorno), this._colors.yellow);
        }
        this._listMessage(`-----------------------------------`, this._colors.white);
        return this;
    }

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
                _this.retorno = retorno;
                _this.retornoStatus = true;
                return true;
            } catch (error) {
                _this.retorno = retorno;
                _this.retornoStatus = false;
                return true;
            }
        }
    }

    $urlPrepare(config) {
        let _this = this;
        return () => {
            config.headers = this._assign(config.headers || {}, _this.config.headers || {});
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

    $finish(id) {
        let _this = this;
        return () => {
            let exec = _this.getExecucao(id),
                retorno = _this.getReturn(),
                retornoStatus = _this.getRetornoStatus(),
                next = true;

            if (exec.config.expected)
                retornoStatus = _this._retExpected(exec.config.expected);

            switch (retornoStatus) {
                case false:
                    _this.stats.errors++;
                    _this.erros.push({ retorno: retorno, exec: exec });
                    _this._msgFinishError(exec);
                    next = !exec.config.await;
                    break;
                case true:
                    _this.stats.success++;
                    _this.success.push({ exec: exec, retorno: retorno });
                    _this._msgFinishSuccess(exec)
                    break;
            }

            return next;
        }
    }
}

module.exports = Test;
