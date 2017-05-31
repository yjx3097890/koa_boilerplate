/**
 * Created by jixianyan on 2017/5/26.
 */
'use strict';

import test from 'ava';
import { user1 } from './data/_userData';
const Server = require('../src/core/Server');
let userService;
test.before('start server',  function * () {

    const server = new Server();
    yield* server.connectDB();

    userService = require('../src/service/userService');
});


test.beforeEach('prepare Data',  function * (t) {
    const User = process.core.db.models.User;
    yield User.truncate();

});

test('create user', function * (t) {

    let dbUser = yield userService.create(user1);
     t.is(dbUser.username, user1.username);
});


