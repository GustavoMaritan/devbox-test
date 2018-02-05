# DEVBOX-TEST

    * Testes aplicação (requisições)
    * Testes unitários

## Instalação

    * npm i devbox-test --save

### OBS...

    *   Class Config (Unica, servidor dos testes).
    *   Class Test   (Uma por Controller a ser testado).

### EXEMPLOS


```javascript

(async() => {
    const { Config, Test } = require('devbox-test');

    let testConfig = new Config({
        uri: 'Caminho base para todas requisições',
        headers: 'Header padrão para todas requisições',
        log: { path: 'src/logs' }
    });

    function teste(config){
        let test = new Test(config);

        test
            .title('Título qualquer para o controller')
            .body({}) // Body que sera usado no corpo das requisições (put|post) * Pode ser alterado
            .event({
                title: 'Cadastrar',                     // Título do método
                url: '/api/teste',                      // Caminho para o método
                method: 'post',                         // Verbo
                await: true,                            // Obriga que este método funcione para executar outros do mesmo controller
                expected: ret => ret.statusCode == 200  // Define o que esperar do resultado 
            })
            .event({
                title: 'Alterar',
                url: '/api/teste/:id',
                method: 'put',
                merge: {                                        // Faz merge com o body
                    id: test.getReturn('content.id')
                },
                params: { id: test.getReturn('content.id') }    // Insere parâmetros na url, caso nâo esteja declara coloca o parâmetro como queryString
            })
            .event({
                title: 'Buscar',
                url: '/api/teste/:id',
                method: 'delete',
                params: { id: test.getBody('id') }
            })

        return test;
    }

    testConfig
        .add(teste);
        // Adicionar quantos forem necessários
        // .add(teste2)
        // .add(teste3);

    await testConfig.init();

});

```
