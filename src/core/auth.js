'use strict';

const auth = module.exports = function(role){
    return function* (next){
        if(this.session.user){
            const user = this.session.user;

            if (user.role >= role) {
                yield next;
            }else {
                this.throw(401, '用户权限不足。');
            }

        }else {
            this.throw(403, '用户未登录。');
        }
    }
};

auth.admin = 1;
auth.user = 0;

