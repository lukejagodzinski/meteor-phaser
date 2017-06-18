import { Mongo } from 'meteor/mongo';

const Players = new Mongo.Collection('players');

export default Players;