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
    this.synced = true;
  }

  init() {
    this.synced = true;

    // TODO: API Request to get users in presence channel
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
            console.log('Member Removed', index);
            if (index >= 0) this.users.slice(index, 1);
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
