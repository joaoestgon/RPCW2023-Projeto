# RPCW2023-Projeto

## Introdução
Este relatório apresenta os resultados do projeto da UC RPCW, que consiste numa aplicação desenvolvida em Node.js com a framework Express. A aplicação consiste num sistema com múltiplos servidores, incluindo um servidor API, um servidor de logs, um servidor de aplicação e um servidor de autenticação.

O servidor API é responsável por fornecer recursos à aplicação. Oferece endpoints que permitem realizar operações de leitura, escrita e manipulação de dados. 

O servidor de logs regista todas as atividades importantes da aplicação.

O servidor de aplicação processa os pedidos dos usuários e executa a lógica da aplicação. 

Já o servidor de autenticação é responsável por gerir a autenticação e autorização dos utilizadores.

## Rotas

### API-Server

#### Resources  
| Method | Rota | Descrição |
|----------|----------|----------|
|   GET  |   /resources  |   Devolve todos os recursos ordenados por título, que obdecem a uma query opcional (por tipo, titulo ou por submissor).  |
|   GET  |   /resources/:rid  |   Devolve o recurso com 'id' igual a 'rid'  |
|   POST  |   /resources  |   Cria um novo recurso  |
|   PUT  |   /resources/:rid  |   Atualiza o tipo, titulo e/ou descrição de um recurso através do 'id'  |
|   PUT  |   /resources/:rid/review  |   Fazer uma review no recurso com 'id' igual a 'rid'  |
|   DELETE  |   /resources/:rid  |   Apaga um recurso através do 'id'  |

#### News
| Method | Rota | Descrição |
|----------|----------|----------|
|   GET  |   /news  |   Devolve todas as notícias.  |
|   POST  |   /news  |   Cria uma nova notícia  |
|   PUT  |   /news/:id  |   Atualiza uma Notícia através do 'id'  |
|   DELETE  |   /news/:id  |   Apaga uma Notícia através do 'id'  |

#### Comments
| Method | Rota | Descrição |
|----------|----------|----------|
|   GET  |   /comments/:id  |   Procura comentários de um recurso  |
|   POST  |   /comments  |   Cria um novo comentário  |
|   DELETE  |   /comments/:id  |   Apaga uma Notícia através do 'id'  |

### AUTH-Server
| Method | Rota | Descrição |
|----------|----------|----------|
|   GET  |   /users  |   Devolve todos os producers e consumer |
|   GET  |   /users/:username  |   Devolve um user  |
|   POST  |   /users/register  |   Regista um user  |
|   POST  |   /users/login  |   Faz login  |
|   PUT  |   /users/:id  |   Altera parametros de um user  |
|   PUT  |   /users  |   Altera o nivel de um user (admin only)  |
|   DELETE  |   /users/delete  |   Apaga um user  |


## Autenticação
Todos os pedidos leavam o token no url (EX.: GET /resources?token=[TOKEN])

Existem 3 niveis: admin, producer, consumer

Consumer: pode ver, comentar e dar review a recursos
Producer: pode submeter recursos e apagá-los e faz tudo o que um consumer faz
Admin: Consegue criar noticias, ver logs, gerir utilizadores e recursos


## Modelos

### Resources
```
var resourceSchema = new mongoose.Schema({
    submissionDate: Date,
    dateCreated: String,
    idProducer: String, 
    authors: [String], 
    title: String,
    description: String,
    type: String,
    path: String,
    reviews : [{
        _id: false,
        idUser : String,
        value : Number
    }]
})
```
### News
```
var newsSchema = new mongoose.Schema({
    author: String,
    title: String,
    content: String,
    timestamp: Date,
    visible: Boolean
})
```
### Comments
```
var commentSchema = new mongoose.Schema({
    idUser: String,
    idResource: String,
    date: Date,
    text: String
})
```
### Users
```
var userSchema = new mongoose.Schema({
    _id: {
        type: String,
        default: function() {
          return this.username; // Set _id field as the value of the username field
        },
    },
    name: String,
    affiliation: String,
    username: {
            type: String,
            required: true,
            unique: true },
    password: { 
            type: String, 
            required: true },
    email: { 
        type: String, 
        unique: true },
    level: { 
        type: String, 
        required: true },
    dateCreated: {
        type: String,
        required: true}
});
```
### Logs
```
{
    "user": String,
    "date": Date,
    "action": String,
    "id": id_json_server
}
```