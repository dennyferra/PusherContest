const Pusher = require('pusher');
const fetch = require('node-fetch');

class Game {
  constructor() {
    this.pusher = new Pusher({
      appId: process.env.APPID,
      key: process.env.KEY,
      secret: process.env.SECRET,
      cluster: 'us2',
      encrypted: true
    });

    this.roundTime = 300 * 1000;
    this.newRoundWait = 15 * 1000;

    this.presence = null;
    this.users = [];
    this.synced = true;
    this.timeout = null;

    this.round = {
      lastPrice: 0,
      end: new Date()
    };

    this.timerDone();
  }

  timerDone() {
    if (this.timeout) clearTimeout(this.timeout);

    this.pusher.trigger('game', 'status', { action: 'round-end' });

    this.getCurrentPrice()
      .then(data => {
        let nextPrice = (data && data.PRICE) || this.lastPrice;

        // TODO: Calculate winner(s)
        this.pusher.trigger('game', 'status', {
          action: 'round-winner',
          test: 123
        });

        setTimeout(() => {
          var date = new Date().getTime();
          date += this.roundTime;
          this.round.end = new Date(date);
          this.round.lastPrice = nextPrice;

          console.log('Round starting', this.round);

          this.pusher.trigger('game', 'status', {
            action: 'round-start',
            round: this.round
          });

          this.timeout = setTimeout(this.timerDone.bind(this), this.roundTime);
        }, this.newRoundWait);
      })
      .catch(err => {
        console.error('ERROR', err);

        var date = new Date().getTime();
        date += this.roundTime;
        this.round.end = new Date(date);
        this.round.lastPrice = nextPrice;

        this.pusher.trigger('game', 'status', {
          action: 'round-start',
          round: this.round
        });

        this.timeout = setTimeout(this.timerDone.bind(this), this.roundTime);
      });
  }

  getCurrentPrice() {
    return fetch(
      'https://min-api.cryptocompare.com/data/pricemultifull?fsyms=ETH&tsyms=USD'
    )
      .then(res => res.json())
      .then(body => {
        if (body && body.RAW && body.RAW.ETH && body.RAW.ETH.USD) {
          return body.RAW.ETH.USD;
        }

        return null;
      });
  }

  // ISSUE:

  // game: Array[2]
  // 0: Object
  // id: "7yDBlhVZLyyZoLTjJDNptw=="
  // nickname: "ggggggggggg"
  // nicknameLower: "ggggggggggg"
  // 1: "7yDBlhVZLyyZoLTjJDNptw=="

  webhook(req, res) {
    if (!this.synced) {
      res.sendStatus(200);
      return;
    }

    const signature = req.headers['x-pusher-signature'];
    console.log('Webhook Signature', signature);
    if (!signature) {
      sendStatus(403);
      return;
    }

    const data = req.body;

    // Example
    // { channel: 'presence-game',
    // user_id: '+QksjftPxQuBRA4DX2WkyA==',
    // name: 'member_removed' }

    if (data.events) {
      data.events.forEach(ev => {
        let index;
        switch (ev.name) {
          case 'member_added':
            index = this.users.findIndex(f => f.id === ev.user_id);
            if (index === -1) this.users.push({ id: ev.user_id });
            break;
          case 'member_removed':
            index = this.users.findIndex(f => f.id === ev.user_id);
            console.log('Member Removed', index, ev);
            if (index >= 0) this.users.splice(index, 1);
            console.log('Member Removed', this.users);
            break;
          default:
            console.info('Unhandled event', ev);
        }
      });
    }

    res.sendStatus(200);
  }
}

module.exports = Game;
