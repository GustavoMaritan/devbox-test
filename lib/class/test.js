const Uteis = require('../resources/uteis'),
    request = require('request-promise');

class Test extends Uteis {

    /**
     * constructor
     * Parametro passado pela class Config
     * @param {object} options
     * @param {object} ...params 
     * 
     * @example
     * 
     *  // options Passada pela class
     *  var config = {
     *      uri: '',
     *      headers: {},
     *      printCtrlStats: false
     *  };
     * 
     * // ...params - objetos para merge com options
     * 
     *  new Test(config, param1, param2 ...);
     */
    constructor(options, ...params) {
        super();
        this.config = this._mergeConfig(options, params);;
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
                next = await this.execusoes[i].list[j]()                // EXECS
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
        let execusao = this._getExecusao(config);
        execusao
            .add(this.$body(config.body))
            .add(this.$merge(config.merge))
            .add(this.$urlPrepare(config))
            .add(this.$message(`Teste ${config.title || ''} iniciado.`, this._colors.green))
            .add(this.$exec(config))
            .add(this.$finish(execusao.id));
        this.execusoes.push(execusao);
        return this;
    }

    /**
     * 
     * @param {object} config 
     *  
     * @example
     * 
     * var config = {
            action: service.upload,
            params: [1, 
                test.getFileToBase64(''), 
                test.getFileToBase64('')
            ],
            expected: ret => res == 1,
            async: true,
            callbackIndex: 3
        }
     *
     * 
     */
    unit(config) {
        let execusao = this._getExecusao(config);
        execusao
            .add(this.$message(`Teste ${config.title || ''} iniciado.`, this._colors.green))
            .add(this[!config.async ? '$unitExec' : '$unitExecAsync'](config))
            .add(this.$finish(execusao.id));
        this.execusoes.push(execusao);
        return this;
    }

    title(value) {
        this.title = value;
        return this;
    }

    body(obj) {
        if (obj) this._body = obj;
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

            if (!_this._body) return null;

            sl.map(x => {
                obj = !obj ? _this._body[x] : obj[x];
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

    _mergeConfig(config, params) {
        if (!params)
            return config;
        return this._assign(config, ...params);
    }

    _getExecusao(config) {
        this.stats.events++;
        let execusao = {
            id: this.execusoes.length,
            list: [],
            config: config,
            add: (value) => {
                if (value) execusao.list.push(value);
                return execusao;
            }
        };
        return execusao;
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

    _promiseUnit(config) {
        config.params = config.params || [];
        config.callbackIndex = config.callbackIndex || config.params.length;
        return new Promise((resolve, reject) => {
            config.params.splice(config.callbackIndex, 0, (...params) => {
                if (!params[0]) return reject(params);
                resolve(params);
            });
            config.action(...config.params);
        });
    }

    // MESSAGES

    _msgHead() {
        this._listMessageExec()
            ._listMessage(``, this._colors.white)
            ._listMessage(`----------- TESTE => ${this.title} -----------`, this._colors.magenta);
        return this;
    }

    _msgFoot() {
        this._setMsgPrintCtrlStats(`**************************************************`, this._colors.white)
            ._setMsgPrintCtrlStats([
                { message: '**', cor: this._colors.white },
                { message: `    ${this.isSuccess ? 'Sucesso.' : 'Nao Foi.'}                                  `, cor: this.isSuccess ? this._colors.green : this._colors.red },
                { message: '**', cor: this._colors.white }
            ])
            ._setMsgPrintCtrlStats(`**                                              **`, this._colors.white)
            ._setMsgPrintCtrlStats([
                { message: '**', cor: this._colors.white },
                { message: `             Métodos testados - ${this._padLeft(this.stats.events)}           `, cor: this._colors.blue },
                { message: '**', cor: this._colors.white }
            ])
            ._setMsgPrintCtrlStats([
                { message: '**', cor: this._colors.white },
                { message: `                      Acertos - ${this._padLeft(this.stats.success)}           `, cor: this._colors.green },
                { message: '**', cor: this._colors.white }
            ])
            ._setMsgPrintCtrlStats([
                { message: '**', cor: this._colors.white },
                { message: `                        Erros - ${this._padLeft(this.stats.errors)}           `, cor: this._colors.red },
                { message: '**', cor: this._colors.white }
            ])
            ._setMsgPrintCtrlStats(`**                                              **`, this._colors.white)
            ._setMsgPrintCtrlStats(`**************************************************`, this._colors.white)
            ._listMessage(``, this._colors.white)
            ._listMessage(`----------- FINALIZADO ${this.title} -----------------------------`, this._colors.magenta)
            ._listMessage(``, this._colors.white);
        return this;
    }

    _msgFinishError(exec) {
        this._listMessageExec()
            ._listMessage(`Teste ${exec.config.title || ''} finalizado com erro.`, this._colors.red)
            ._setMsgPrintError(exec.config.printError, `Error object.`, this._colors.yellow)
            ._setMsgPrintError(exec.config.printError, this.printObject(this.retorno), this._colors.yellow)
            ._listMessage(`-----------------------------------`, this._colors.white);
        return this;
    }

    _msgFinishSuccess(exec) {
        this._listMessageExec()
            ._listMessage(`Teste ${exec.config.title || ''} finalizado com sucesso.`, this._colors.green)
            ._setMsgPrintSuccess(exec.config.printSuccess, this.printObject(this.retorno), this._colors.yellow)
            ._listMessage(`-----------------------------------`, this._colors.white);
        return this;
    }

    // EXECUCOES

    $unitExec(config) {
        let _this = this;
        return async () => {
            try {
                config.params = config.params || [];
                _this.retorno = await config.action(...config.params);
                _this.retornoStatus = true;
                return true;
            } catch (ex) {
                _this.retorno = ex;
                _this.retornoStatus = false;
                return true;
            }
        }
    }

    $unitExecAsync(config) {
        let _this = this;
        return async () => {
            try {
                _this.retorno = await _this._promiseUnit(config);
                _this.retornoStatus = true;
                return true;
            } catch (ex) {
                _this.retorno = ex;
                _this.retornoStatus = false;
                return true;
            }
        };
    }

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
            _this._body = _this._assign(_this._body, obj);
            return true;
        }
    }

    $exec(config) {
        let _this = this;
        return async () => {
            try {
                let retorno = await request({
                    url: _this.config.uri + config.url,
                    method: config.method,
                    headers: config.headers,
                    body: _this._body,
                    json: true
                });
                _this.retorno = retorno;
                _this.retornoStatus = true;
                return true;
            } catch (error) {
                _this.retorno = error;
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
            let exec = _this.execusoes[id],
                next = true;

            if (exec.config.expected)
                _this.retornoStatus = _this._retExpected(exec.config.expected);

            switch (_this.retornoStatus) {
                case false:
                    _this.stats.errors++;
                    _this.erros.push({ retorno: _this.retorno, exec: exec });
                    _this._msgFinishError(exec);
                    next = !exec.config.await;
                    break;
                case true:
                    _this.stats.success++;
                    _this.success.push({ exec: exec, retorno: _this.retorno });
                    _this._msgFinishSuccess(exec)
                    break;
            }

            return next;
        }
    }
}

module.exports = Test;
