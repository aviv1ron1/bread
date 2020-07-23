const Auth = require('../modules/auth.js');

var db = {
    getUser: jest.fn((email, callback) => {
        if (email == "notfound@a.com") {
            callback()
        } else {
            callback(null, {
                email: email,
                password: {
                    salt: '79d1f021655dabec1dd61c133a0c302d58e3a96f',
                    key: 'bb6014139a30b99172b3292d5689cbaf1e784a0a65f061c55fb4fcb6771477d76df4a077d3499e099e52be7f294303ad1a000e258ea04b16ba54f2bc3e0314dd549fc2812a60b5dd1ddf7b7531e04b6f4748b5309deef2c29f2cebc206a396988f84d520fac9bd383b5bf06fb483a3e3238e5b7ff93a3509b78c4bacea810c4f',
                    keyIterations: 100000,
                    keyLength: 128,
                    digest: 'sha512'
                }
            })
        }
    }),
    addUser: jest.fn((data, callback) => {
        callback(null, "123");
    })
}

var auth = new Auth(db);
var cauth = new Auth(db, {
    Auth: {
        keyLength: 16,
        keyIterations: 18,
        digest: "md5"
    },
    PasswordPolicy: {
    	minLength: 1, 
    	maxLength: 2
    }
})

test('auth ctor works', () => {
    expect(auth).toBeDefined();
});

test('two keys created are not the same', (done) => {
    function callback(err, result1) {
        try {
            expect(err).toBeNull();
            expect(result1).toBeDefined();
            auth.salt("a", (err, result2) => {
                try {
                    expect(err).toBeNull();
                    expect(result2).toBeDefined();
                    expect(result1.key).not.toEqual(result2.key);
                    done();
                } catch (error) {
                    done(error);
                }
            })
        } catch (error) {
            done(error);
        }

    }
    auth.salt("a", callback);
})

test('key created is the correct length', (done) => {
    auth.salt("a", (err, result) => {
        try {
            expect(err).toBeNull();
            expect(result.key.length).toBe(256);
            done();
        } catch (err) {
            done(err);
        }
    })
})

test('keyIterations created is correct with default config', (done) => {
    auth.salt("a", (err, result) => {
        try {
            expect(err).toBeNull();
            expect(result.keyIterations).toBe(100000);
            done();
        } catch (err) {
            done(err);
        }
    })
})

test('key created is the correct length with custom config', (done) => {
    cauth.salt("a", (err, result) => {
        try {
            expect(err).toBeNull();
            expect(result.key.length).toBe(32);
            done();
        } catch (err) {
            done(err);
        }
    })
})

test('custom keyIterations is passed with custom config', (done) => {
    cauth.salt("a", (err, result) => {
        try {
            expect(err).toBeNull();
            expect(result.keyIterations).toBe(18);
            done();
        } catch (err) {
            done(err);
        }
    })
})

test('custom digest is passed with custom config', (done) => {
    cauth.salt("a", (err, result) => {
        try {
            expect(err).toBeNull();
            expect(result.digest).toBe("md5");
            done();
        } catch (err) {
            done(err);
        }
    })
})

test('verify works', (done) => {
    auth.salt("a", (err, result) => {
        try {
            expect(err).toBeNull();
            auth.verify("a", result, (err, same) => {
                try {
                    expect(err).toBeNull();
                    expect(same).toBeTruthy();
                    done();
                } catch (err) {
                    done(err);
                }
            })
        } catch (err) {
            done(err);
        }
    })
})

test('verify returns false when password doesnt match', (done) => {
    auth.salt("a", (err, result) => {
        try {
            expect(err).toBeNull();
            auth.verify("b", result, (err, same) => {
                try {
                    expect(err).toBeNull();
                    expect(same).toBeFalsy();
                    done();
                } catch (err) {
                    done(err);
                }
            })
        } catch (err) {
            done(err);
        }
    })
})

test('verify returns false when keyIteration settings doesnt match', (done) => {
    auth.salt("a", (err, result) => {
        try {
            expect(err).toBeNull();
            result.keyIterations = 10;
            auth.verify("a", result, (err, same) => {
                try {
                    expect(err).toBeNull();
                    expect(same).toBeFalsy();
                    done();
                } catch (err) {
                    done(err);
                }
            })
        } catch (err) {
            done(err);
        }
    })
})

test('verify returns false when digest settings doesnt match', (done) => {
    auth.salt("a", (err, result) => {
        try {
            expect(err).toBeNull();
            result.digest = "md5";
            auth.verify("a", result, (err, same) => {
                try {
                    expect(err).toBeNull();
                    expect(same).toBeFalsy();
                    done();
                } catch (err) {
                    done(err);
                }
            })
        } catch (err) {
            done(err);
        }
    })
})

test('verify returns false when salt doesnt match', (done) => {
    auth.salt("a", (err, result) => {
        try {
            expect(err).toBeNull();
            result.salt = Buffer.alloc(5, 'a');
            auth.verify("a", result, (err, same) => {
                try {
                    expect(err).toBeNull();
                    expect(same).toBeFalsy();
                    done();
                } catch (err) {
                    done(err);
                }
            })
        } catch (err) {
            done(err);
        }
    })
})

test('verify returns false when key length doesnt match', (done) => {
    auth.salt("a", (err, result) => {
        try {
            expect(err).toBeNull();
            result.keyLength = 5;
            auth.verify("a", result, (err, same) => {
                try {
                    expect(err).toBeNull();
                    expect(same).toBeFalsy();
                    done();
                } catch (err) {
                    done(err);
                }
            })
        } catch (err) {
            done(err);
        }
    })
})

test('login works', (done) => {
    auth.login("a@a.com", "a", (err, result) => {
        try {
            expect(err).toBeNull();
            expect(result).toBeTruthy();
            expect(db.getUser.mock.calls.length).toBe(1);
            done();
        } catch (err) {
            done(err);
        }
    })
})

test('login returns false when password not same', (done) => {
    auth.login("a@a.com", "aa", (err, result) => {
        try {
            expect(err).toBeNull();
            expect(result).toBeFalsy();
            expect(db.getUser.mock.calls.length).toBe(2);
            done();
        } catch (err) {
            done(err);
        }
    })
})

test('login returns false when email not found', (done) => {
    auth.login("notfound@a.com", "aa", (err, result) => {
        try {
            expect(err).toBeNull();
            expect(result).toBeFalsy();
            expect(db.getUser.mock.calls.length).toBe(3);
            done();
        } catch (err) {
            done(err);
        }
    })
})

test('register fails when email not supplied', (done) => {
    auth.register({}, (err, result) => {
        try {
            expect(err).toBe("missing email");
            expect(result).toBeUndefined();
            expect(db.getUser.mock.calls.length).toBe(3);
            expect(db.addUser.mock.calls.length).toBe(0);
            done();
        } catch (err) {
            done(err);
        }
    })
})

test.each([
    "a",
    "#@%^%#$@#$@#.com",
    "@example.com",
    "Joe Smith <email@example.com>",
    "email.example.com",
    "email@example@example.com",
    ".email@example.com",
    "email.@example.com",
    "email..email@example.com",
    "あいうえお@example.com",
    "email@example.com (Joe Smith)",
    "email@example",
    "email@-example.com",
    "email@111.222.333.44444",
    "email@example..com",
    "Abc..123@example.com"
])('register fails when email supplied not valid regex %s', (email, done) => {
    auth.register({
        email: email
    }, (err, result) => {
        try {
            expect(err).toBe("email address is not valid");
            expect(result).toBeUndefined();
            expect(db.getUser.mock.calls.length).toBe(3);
            expect(db.addUser.mock.calls.length).toBe(0);
            done();
        } catch (err) {
            done(err);
        }
    })
})

test.each([
"email@example.com",
"firstname.lastname@example.com",
"email@subdomain.example.com",
"firstname+lastname@example.com",
"1234567890@example.com",
"email@example-one.com",
"_______@example.com",
"email@example.name",
"email@example.museum",
"email@example.co.jp",
"firstname-lastname@example.com"
])('register success when email supplied is valid regex %s', (email, done) => {
    auth.register({
        email: email
    }, (err, result) => {
        try {
            expect(err).toBe("missing password");
            expect(result).toBeUndefined();
            expect(db.getUser.mock.calls.length).toBe(3);
            expect(db.addUser.mock.calls.length).toBe(0);
            done();
        } catch (err) {
            done(err);
        }
    })
})

test('register fails when password not supplied', (done) => {
    auth.register({
    	email: "email@example.com"
    }, (err, result) => {
        try {
            expect(err).toBe("missing password");
            expect(result).toBeUndefined();
            expect(db.getUser.mock.calls.length).toBe(3);
            expect(db.addUser.mock.calls.length).toBe(0);
            done();
        } catch (err) {
            done(err);
        }
    })
})

test('register fails when password policy not valid', (done) => {
    auth.register({
    	email: "email@example.com",
    	password: "a"
    }, (err, result) => {
        try {
            expect(err).toBe("password must be at least 8 characters");
            expect(result).toBeUndefined();
            expect(db.getUser.mock.calls.length).toBe(3);
            expect(db.addUser.mock.calls.length).toBe(0);
            done();
        } catch (err) {
            done(err);
        }
    })
})

test('register fails when password policy not valid with custom config to PP', (done) => {
    cauth.register({
    	email: "email@example.com",
    	password: "aaa"
    }, (err, result) => {
        try {
            expect(err).toBe("password must be maximum 2 characters");
            expect(result).toBeUndefined();
            expect(db.getUser.mock.calls.length).toBe(3);
            expect(db.addUser.mock.calls.length).toBe(0);
            done();
        } catch (err) {
            done(err);
        }
    })
})

test('register fails when user allready exists', (done) => {
    auth.register({
    	email: "email@example.com",
    	password: "Abcd123#"
    }, (err, result) => {
        try {
            expect(err).toBe("email allready exists");
            expect(result).toBeUndefined();
            expect(db.getUser.mock.calls.length).toBe(4);
            expect(db.addUser.mock.calls.length).toBe(0);
            done();
        } catch (err) {
            done(err);
        }
    })
})

test('register succeeds', (done) => {
    auth.register({
    	email: "notfound@a.com",
    	password: "Abcd123#"
    }, (err, result) => {
        try {
            expect(err).toBeNull();
            expect(result).toBe("123");
            expect(db.getUser.mock.calls.length).toBe(5);
            expect(db.addUser.mock.calls.length).toBe(1);
            done();
        } catch (err) {
            done(err);
        }
    })
})
