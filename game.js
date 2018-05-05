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
    }

    const signature = req.headers['x-pusher-signature'];
    console.log('Webhook Signature', signature);
    if (!signature) {
      return sendStatus(403);
    }

    const data = req.body;
    if (data.events) {
      data.events.forEach(ev => {
        switch (ev.name) {
          case 'member_added':
            const id = ev.user_id;
            break;
          case 'member_removed':
            const id = ev.user_id;
            break;
          default:
            console.log('Unhandled event', ev);
        }
      });
    }
  }
}

module.exports = Game;
