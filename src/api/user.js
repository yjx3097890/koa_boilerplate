'use strict';

const router = module.exports = require('koa-router')();

const userService = require('../service/userService');
const auth = require('../core/auth');

/**
 * @api {post} /api/user/login 用户登录
 * @apiName UserLogin
 * @apiGroup User
 * @apiPermission all
 *
 * @apiParam {String} username 用户名
 * @apiParam {String} password 密码
 * @apiParam {Boolean} isKeep 是否保持登录 默认true  TODO
 *
 * @apiSuccess {Boolean} ok=true 登录成功
 * @apiSuccess {User} user 登录用户信息
 *
 * @apiError {Boolean} ok=false 登录失败
 * @apiError {String} message 登录失败消息
 *
 */
router.post('/login', function* (next) {
    const result = yield* userService.login(this.request.body.username, this.request.body.password);
    if (result.ok) {
        this.session.user = result.user;
        userService.registerLogin(result.user.id);
    }
    this.body = result;

});

/**
 * @api {get} /api/user/logout 退出登录
 * @apiName UserLogout
 * @apiGroup User
 * @apiPermission all
 *
 *
 * @apiSuccess {Boolean} ok=true 退出成功
 *
 */
router.get('/logout',function* (next){
    this.session.user = null;
    this.body = {ok:true};
});


/**
 * @api {get} /api/user/current 取得当前用户信息
 * @apiName GetCurrentUser
 * @apiGroup User
 * @apiPermission all
 *
 * @apiSuccess {String} id 用户id
 * @apiSuccess {String} username 用户名
 * @apiSuccess {String} name 真实姓名
 * @apiSuccess {String} phone 电话
 * @apiSuccess {String} image 头像链接
 * @apiSuccess {String} email 邮箱
 * @apiSuccess {String} address 地址
 * @apiSuccess {Number} role 0-普通用户 1-管理员
 *
 */
router.get('/current', function* (next) {

    this.body = this.session.user;

});


/**
 * @api {get} /api/user 取得用户列表
 * @apiName GetUserList
 * @apiGroup User
 * @apiPermission admin
 *
 * @apiParam {Object} [where={}] 查询条件
 *
 *
 * @apiSuccess {Array} list 用户列表
 *
 */
router.get('/', auth(auth.admin), function *(next) {
    this.body = yield userService.query(this.query);
});

/**
 * @api {get} /api/user/:userId 取得单个用户信息
 * @apiName GetUserById
 * @apiGroup User
 * @apiPermission admin
 *
 * @apiParam {String} userId 用户Id
 *
 * @apiSuccess {String} id 用户id
 * @apiSuccess {String} username 用户名
 * @apiSuccess {String} name 真实姓名
 * @apiSuccess {String} phone 电话
 * @apiSuccess {String} image 头像链接
 * @apiSuccess {String} email 邮箱
 * @apiSuccess {String} address 地址
 * @apiSuccess {Number} role 0-普通用户 1-管理员
 *
 */
router.get('/:id', auth(auth.admin), function* (next) {
    this.body = yield userService.getById(this.params.id);
});

/**
 * @api {post} /api/user 用户注册
 * @apiName AddUser
 * @apiGroup User
 * @apiPermission All
 *
 * @apiParam {String} username 用户名
 * @apiParam {String} password 密码
 * @apiParam {String} name 真实姓名
 * @apiParam {String} [phone] 电话
 * @apiParam {String} [image] 头像链接
 * @apiParam {String} [email] 邮箱
 * @apiParam {String} [address] 地址
 *
 * @apiSuccess {String} id 用户id
 * @apiSuccess {String} username 用户名
 * @apiSuccess {String} name 真实姓名
 * @apiSuccess {String} phone 电话
 * @apiSuccess {String} image 头像链接
 * @apiSuccess {String} email 邮箱
 * @apiSuccess {String} address 地址
 *
 */
router.post('/', function *(next) {
    this.body = yield userService.create(this.request.body);
});

/**
 * @api {put} /api/user/:userId 用户修改自己的信息
 * @apiName EditUserSelf
 * @apiGroup User
 * @apiPermission user
 *
 * @apiParam {String} [name] 真实姓名
 * @apiParam {String} [phone] 电话
 * @apiParam {String} [image] 头像链接
 * @apiParam {String} [email] 邮箱
 * @apiParam {String} [address] 地址
 *
 * @apiSuccess {User} user 用户对象
 *
 */
router.put('/', auth(auth.user), function *(next) {
    let id = this.session.user.id;
    this.body = yield* userService.updateById(id, this.request.body);
});

/**
 * @api {delete} /api/user/:userId 删除用户
 * @apiName DeleteUser
 * @apiGroup User
 * @apiPermission admin
 *
 * @apiParam {String} userId 需要删除的用户id
 *
 * @apiSuccess {Boolean} ok 删除操作是否成功
 *
 */
router.del('/:id', auth(auth.admin), function *(next) {
    yield* userService.deleteById(this.params.id);
    this.body = {ok:true}
});


