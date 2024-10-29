const express = require('express');
const sessions = require('express-session');
const cookieParser = require('cookie-parser');

const app = express();

app.use(cookieParser());
app.use(sessions({
    secret: 'minhachave',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 30000 }
}));

// Dados de exemplo de usuários
const usuarios = [
    { id: 1, username: 'usuario1', password: 'senha1' },
    { id: 2, username: 'usuario2', password: 'senha2' }
];

// Middleware para verificar se o usuário está autenticado
function verificarAutenticacao(req, res, next) {
    if (req.session.usuario) {
        next();
    } else {
        res.send(`<h1>Acesso Negado</h1><a href="/login">Faça login</a>`);
    }
}

// Rota de login
app.get('/login', (req, res) => {
    res.send(`
        <h1>Login</h1>
        <form method="post" action="/login">
            <label>Usuário:</label>
            <input type="text" name="username"><br>
            <label>Senha:</label>
            <input type="password" name="password"><br>
            <button type="submit">Entrar</button>
        </form>
    `);
});

// Processa o login
app.post('/login', express.urlencoded({ extended: true }), (req, res) => {
    const { username, password } = req.body;
    const usuario = usuarios.find(u => u.username === username && u.password === password);

    if (usuario) {
        req.session.usuario = usuario;
        res.cookie('loggedIn', 'true', { maxAge: 100, httpOnly: true });
        res.redirect('/filmes');
    } else {
        res.send('<h1>Usuário ou senha incorretos</h1><a href="/login">Tente novamente</a>');
    }
});

// Rota de logout
app.get('/logout', (req, res) => {
    req.session.destroy();
    res.clearCookie('loggedIn');
    res.send('<h1>Logout realizado com sucesso</h1><a href="/login">Voltar ao login</a>');
});

// Dados de exemplo (filmes)
const filmes = [
    { id: 1, titulo: 'O Poderoso Chefão', preco: 20 },
    { id: 2, titulo: 'Interestelar', preco: 25 },
    { id: 3, titulo: 'Matrix', preco: 15 }
];

// Rota para exibir a lista de filmes
app.get('/filmes', verificarAutenticacao, (req, res) => {
    res.send(`
        <h1>Lista de Filmes</h1>
        <ul>
        ${filmes.map(filme => `
                <li>${filme.titulo} - R$${filme.preco}
                    <a href="/adicionar/${filme.id}">Adicionar ao Carrinho</a>
                </li>
            `).join('')}
        </ul>
        <a href="/carrinho">Ver Carrinho</a><br>
        <a href="/logout">Logout</a>
    `);
});

// Rota para adicionar filme ao carrinho
app.get('/adicionar/:id', verificarAutenticacao, (req, res) => {
    const id = parseInt(req.params.id);
    const filme = filmes.find(f => f.id === id);

    if (filme) {
        if (!req.session.carrinho) {
            req.session.carrinho = [];
        }
        req.session.carrinho.push(filme);
    }

    res.redirect('/filmes');
});

// Rota do carrinho
app.get('/carrinho', verificarAutenticacao, (req, res) => {
    const carrinho = req.session.carrinho || [];
    res.send(`
        <h1>Carrinho</h1>
        <ul>
        ${carrinho.map(filme => `
                <li>${filme.titulo} - R$${filme.preco}</li>
            `).join('')}
        </ul>
        <a href="/filmes">Continuar Comprando</a><br>
        <a href="/logout">Logout</a>
    `);
});

// Inicializa o servidor
app.listen(8080, () => {
    console.log('Servidor rodando em http://localhost:8080');
});
