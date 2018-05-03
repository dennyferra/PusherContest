const express = require('express')
const bodyParser = require('body-parser')
const crypto = require('crypto')
const Pusher = require('pusher')

const app = express()

const game = {
  players: []
}

app.set('port', (process.env.PORT || 5000))
app.use('/public', express.static(__dirname + '/public'))
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/', (request, response) => {
  response.sendFile('index.html', {root: __dirname + '/public/'});
})

app.get('/play', (req, res) => {
  if (!req.query.nickname) {
    res.status(400).json({ error: 'Name is required' });
  }

  const { nickname } = req.query
  
  if (nickname.length <= 2 || nickname.length > 20) {
    res.status(400).json({ error: 'Name should be 3-20 characters in length' });
  }
  
  
  const id = crypto.randomBytes(16).toString('base64')
  res.status(200).json({ id, nickname });
})

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'))

  var pusher = new Pusher({
    appId: process.env.APPID,
    key: process.env.KEY,
    secret: process.env.SECRET,
    cluster: 'us2',
    encrypted: true
  });

  pusher.trigger('game', 'user.join', {
    "message": "hello world"
  });
})
