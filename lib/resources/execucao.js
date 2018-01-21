const request = require('request-promise');

function set(Test) {

    Test.prototype.$body = (obj) => {
        let _this = this;
        return () => {
            _this.body(obj);
            return true;
        }
    }

    Test.prototype.$printMessages = () => {
        let _this = this;
        return async () => {
            _this._listMessageExec();
            return true;
        }
    }

    Test.prototype.$message = (message, cor) => {
        let _this = this;
        return async () => {
            _this._print(message, cor);
            return true;
        }
    }

    Test.prototype.$merge = (obj) => {
        let _this = this;
        return async () => {
            obj = _this._prepare(obj);
            _this.body = _this._assign(_this.body, obj);
            return true;
        }
    }

    Test.prototype.$exec = (id, config) => {
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

    Test.prototype.$urlPrepare = (config) => {
        let _this = this;
        return () => {
            config.headers = _this._assign(config.headers || {}, _this.config.headers || {});
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

}

module.exports = set;