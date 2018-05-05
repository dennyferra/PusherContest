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
  }

  subscribe() {
    this.presence = pusher.subscribe('presence-game');
    this.presence.bind('pusher:subscription_error', data => {
      console.log('presence.subscription_error', data);
    });

    this.presence.bind('pusher:subscription_succeeded', members => {
      console.log('presence.subscription_succeeded', members);
      //members.each(m => this.rootStore.game.members.push(m));
    });

    this.presence.bind('pusher:member_added', member => {
      // todo
    });

    this.presence.bind('pusher:member_removed', member => {
      // todo
    });
  }
}

module.exports = Game;
