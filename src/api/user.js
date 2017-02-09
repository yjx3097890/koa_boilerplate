'use strict';

const router = module.exports = require('koa-router')();

const userSerivce = require('../service/userService');


router.get('/', function *(next) {

    this.body = yield userSerivce.query(this.query);
    console.log(this.query)
});

router.post('/', function *(next) {
    this.body = yield userSerivce.create(this.request.body);
});

router.put('/:id', function *(next) {
    this.throw(404, this.params.id);

});

router.del('/:id', function *(next) {

    yield* userSerivce.deleteById(this.params.id);
    this.body = {ok:true}
});
