import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { throttle } from 'lodash';
import { GAME_WIDTH, GAME_HEIGHT } from '/imports/config';
import Players from '/imports/Players';
import './main.html';

window.PIXI = require('phaser/build/custom/pixi');
window.p2 = require('phaser/build/custom/p2');
window.Phaser = require('phaser/build/custom/phaser-split');

const data = {
  game: null,
  playerSprite: null,
  playersSprites: {}
};

const createPlayer = (id, doc) => {
  const playerSprite = data.game.add.sprite(doc.x, doc.y, 'player');
  playerSprite.id = id;
  data.playersSprites[id] = playerSprite;
  // If it's me.
  if (id === Meteor.connection._lastSessionId) {
    data.playerSprite = playerSprite;
  }
};

const updatePlayer = (id, fields) => {
  const playerSprite = data.playersSprites[id];
  if (playerSprite) {
    if (fields.x) playerSprite.x = fields.x;
    if (fields.y) playerSprite.y = fields.y;
  }
};

const removePlayer = (id) => {
  const playerSprite = data.playersSprites[id];
  playerSprite.destroy();
  delete data.playersSprites[id];
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
  if (data.playerSprite) {
    Players.update({
      _id: Meteor.connection._lastSessionId
    }, {
      $set: {
        x: data.playerSprite.position.x,
        y: data.playerSprite.position.y
      }
    });
  }
}, 50);

const update = () => {
  if (data.cursors.left.isDown) {
    data.playerSprite.x -= 2;
  }
  else if (data.cursors.right.isDown) {
    data.playerSprite.x += 2;
  }
  if (data.cursors.up.isDown) {
    data.playerSprite.y -= 2;
  }
  else if (data.cursors.down.isDown) {
    data.playerSprite.y += 2;
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