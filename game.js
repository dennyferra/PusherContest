const Pusher = require('pusher');

class Game {
  constructor() {
    this.pusher = new Pusher({
      appId: process.env.APPID,
      key: process.env.KEY,
      secret: process.env.SECRET,
      cluster: 'us2',
      encrypted: true
    });

    this.presence = null;
    this.users = [];
    this.synced = false;
  }

  init() {
    this.synced = true;

    // TODO: API Request to get users in presence channel
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
        let id;
        switch (ev.name) {
          case 'member_added':
            id = ev.user_id;
            break;
          case 'member_removed':
            id = ev.user_id;
            break;
          default:
            console.log('Unhandled event', ev);
        }
      });
    }

    res.sendStatus(200);
  }
}

module.exports = Game;
