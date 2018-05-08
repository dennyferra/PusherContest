const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const Game = require('./game');

const app = express();
const game = new Game();

app.set('port', process.env.PORT || 5000);
app.use('/public', express.static(__dirname + '/public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, Content-Length, X-Requested-With, X-UserId'
  );
  next();
});

app.options('/*', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS');
  res.header(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, Content-Length, X-Requested-With, X-UserId'
  );
  res.sendStatus(200);
});

app.get('/', (request, response) => {
  response.sendFile('index.html', { root: __dirname + '/public/' });
});

app.get('/game', (req, res) => {
  // TODO: This is just for testing

  res.status(200).json({
    players: game.users ? game.users.length : 0,
    lastPrice: game.lastPrice,
    end: new Date(game.end),
    game: game.users
  });
});

app.get('/play', (req, res) => {
  if (!req.query.nickname) {
    res.status(400).json({ error: 'Name is required' });
    return;
  }

  const nickname = req.query.nickname.trim();
  const nicknameLower = nickname.toLowerCase();

  if (nickname.length <= 2 || nickname.length > 20) {
    res.status(400).json({ error: 'Name should be 3-20 characters in length' });
    return;
  }

  if (
    game.users.some(s => s.nicknameLower && s.nicknameLower === nicknameLower)
  ) {
    res.status(400).json({ error: 'Nickname is not unique' });
    return;
  }

  const id = crypto.randomBytes(16).toString('base64');
  const user = { id, nickname, nicknameLower };
  game.users.push(user);
  res.status(200).json(user);
});

app.post('/pusher/auth', (req, res) => {
  var socketId = req.body.socket_id;
  var channel = req.body.channel_name;
  var userId = req.headers['x-userid'];

  if (!userId) {
    res.sendStatus(403);
    return;
  }

  const user = game.users.filter(user => user.id === userId);
  if (user.length <= 0) {
    res.sendStatus(403);
    return;
  }

  var presenceData = {
    user_id: user[0].id,
    user_info: {
      name: user[0].nickname
    }
  };
  var auth = game.pusher.authenticate(socketId, channel, presenceData);
  console.log('User auth', auth);
  res.send(auth);
});

app.post('/pusher/hook', (req, res) => {
  game.webhook(req, res);
});

app.listen(app.get('port'), () => {
  console.log('Node app is running at localhost:' + app.get('port'));
});
