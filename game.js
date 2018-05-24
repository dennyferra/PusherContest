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

    this.roundTime = 2 * 60 * 1000;
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

  setGuess(user, guess) {
    const game = this;
    return new Promise((resolve, reject) => {
      let gameUser = game.users.find(f => f.id === user.id);
      if (gameUser && !gameUser.guess) {
        gameUser.guess = guess;

        const data = {
          nickname: gameUser.nickname,
          guess: true,
          direction:
            guess > game.round.lastPrice
              ? 1
              : guess < game.round.lastPrice
                ? -1
                : 0
        };

        console.log('Pushing trigger', data);

        game.pusher.trigger('game', 'status', {
          action: 'guess',
          data: data
        });

        resolve(data);
      } else {
        reject(gameUser);
      }
    });
  }

  resetGuesses() {
    this.users.map(u => (u.guess = null));
  }

  timerDone() {
    if (this.timeout) clearTimeout(this.timeout);

    this.pusher.trigger('game', 'status', { action: 'round-end' });

    this.getCurrentPrice()
      .then(data => {
        let nextPrice = (data && data.PRICE) || this.lastPrice;

        const winner = this.users.reduce((acc, u) => {
          if (u.hasOwnProperty('guess') && u.guess != null) {
            if (acc === null) return u;
            const prev = Math.abs(nextPrice - acc.guess);
            const curr = Math.abs(nextPrice - u.guess);

            if (curr < prev) return u;
            return acc;
          }
          return acc;
        }, null);

        console.log(
          'winner',
          nextPrice,
          winner ? winner.guess : 0,
          winner ? nextPrice - winner.guess : 0
        );

        this.pusher.trigger('game', 'status', {
          action: 'round-winner',
          name: winner ? winner.nickname : null,
          guess: winner ? winner.guess : null,
          nextPrice,
          diff: winner ? Math.abs(nextPrice - winner.guess).toFixed(2) : 0
        });

        setTimeout(() => {
          this.resetGuesses();
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
