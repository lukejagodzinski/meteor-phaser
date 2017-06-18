import { Meteor } from 'meteor/meteor';
import { GAME_WIDTH, GAME_HEIGHT } from '/imports/config';
import Players from '/imports/Players';

Meteor.publish('players', function() {
  return Players.find();
});

Meteor.onConnection(function(connection) {
  Players.insert({
    _id: connection.id,
    x: Math.floor(Math.random() * (GAME_WIDTH - 100)) + 50,
    y: Math.floor(Math.random() * (GAME_HEIGHT - 100)) + 50
  });

  connection.onClose(() => {
    Players.remove({
      _id: connection.id
    })
  });
});

Meteor.startup(function() {
  Players.remove({});
});