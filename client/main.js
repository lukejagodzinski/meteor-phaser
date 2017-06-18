import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { throttle } from 'lodash';
import { GAME_WIDTH, GAME_HEIGHT } from '/imports/config';
import Players from '/imports/Players';
import './main.html';

window.PIXI = require('phaser-ce/build/custom/pixi');
window.p2 = require('phaser-ce/build/custom/p2');
window.Phaser = require('phaser-ce/build/custom/phaser-split');

const data = {
  game: null,
  player: null,
  players: {}
};

const createPlayer = (id, doc) => {
  const player = data.game.add.sprite(doc.x, doc.y, 'player');
  player.id = id;
  data.players[id] = player;
  // If it's me.
  if (id === Meteor.connection._lastSessionId) {
    data.player = player;
  }
};

const updatePlayer = (id, fields) => {
  const player = data.players[id];
  if (player) {
    if (fields.x) player.x = fields.x;
    if (fields.y) player.y = fields.y;
  }
};

const removePlayer = (id) => {
  const player = data.players[id];
  player.destroy();
  delete data.players[id];
}

const preload = () => {
  data.game.load.spritesheet('player', 'player.png', 32, 48);
  data.game.load.image('background', 'background.png');
};

const create = () => {
  data.game.physics.startSystem(Phaser.Physics.ARCADE);
  data.game.add.tileSprite(0, 0, GAME_WIDTH, GAME_HEIGHT, 'background');
  data.cursors = data.game.input.keyboard.createCursorKeys();

  Players.find().observeChanges({
    added(id, doc) {
      createPlayer(id, doc);
    },
    changed(id, fields) {
      updatePlayer(id, fields);
    },
    removed(id) {
      removePlayer(id);
    }
  });
}

const sendPlayerData = throttle(function() {
  if (data.player) {
    Players.update({
      _id: Meteor.connection._lastSessionId
    }, {
      $set: {
        x: data.player.position.x,
        y: data.player.position.y
      }
    });
  }
}, 50);

const update = () => {
  if (data.cursors.left.isDown) {
    data.player.x -= 2;
  }
  else if (data.cursors.right.isDown) {
    data.player.x += 2;
  }
  if (data.cursors.up.isDown) {
    data.player.y -= 2;
  }
  else if (data.cursors.down.isDown) {
    data.player.y += 2;
  }

  sendPlayerData();
};

const render = () => {
};

Template.body.onCreated(function() {
  this.subscribe('players');
});

Template.body.onRendered(function() {
  data.game = new Phaser.Game(GAME_WIDTH, GAME_HEIGHT, Phaser.CANVAS, null, {
    preload,
    create,
    update,
    render
  });
});