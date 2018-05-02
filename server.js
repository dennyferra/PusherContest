const express = require('express')
const bodyParser = require('body-parser')
const crypto = require('crypto')

const app = express()

const game = {
  players: []
}

app.set('port', (process.env.PORT || 5000))
app.use('/public', express.static(__dirname + '/public'))
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "codesandbox.io");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

app.get('/', (request, response) => {
  response.sendFile('index.html', {root: __dirname + '/public/'});
})

app.get('/play', (req, res) => {
  if (!req.query.name) {
    res.status(400).json({ error: 'Name is required' });
  }
  
  if (req.query.name.length > 20) {
    res.status(400).json({ error: 'Name should be 20 characters maximum' });
  }
  
  
  const id = crypto.randomBytes(16).toString('base64')
  res.status(200).json({ id, name: req.query.name });
})

app.listen(app.get('port'), function() {
  console.log("Node app is running at localhost:" + app.get('port'))
})
