const Auth = require('../modules/auth.js');

const bunyan = require('bunyan');
const Ajv = require('ajv');
const moment = require('moment');

const PasswordPolicy = require('../modules/password-policy.js');
//const Mailer = require('../modules/mailer.js');

const ItemNotFoundError = require('../errors/item-not-found-error.js');
const ItemExistsError = require('../errors/item-exists-error.js');
const PasswordPolicyError = require('../errors/password-policy-error.js');

const registerSchema = require('../schemas/register-schema.json');
const matconSchema = require('../schemas/matcon-schema.json');
const reviewSchema = require('../schemas/review-schema.json');
const userSchema = require('../schemas/user-schema.json');

var logger = bunyan.createLogger({
    name: "auth.test"
});

var db = {
    getUserByEmail: jest.fn((email, callback) => {
        if (email == "notfound@a.com") {
            callback(new ItemNotFoundError());
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
        callback(null, {
            id: "123",
            _rev: "456"
        });
    }),
    setPreRegister: jest.fn((data, callback) => {
        callback(null, {
            id: "789",
            _rev: "890"
        })
    }),
    getPreRegister: jest.fn((id, callback) => {
        if (id == "notfound") {
            return callback(new ItemNotFoundError());
        }
        callback(null, {
            email: "email@example.com",
            token: "123",
            timestamp: moment().format(),
            emailValidated: false,
            id: id,
            _id: id
        })
    }),
    removePreRegister: jest.fn((id, callback) => {
        callback(null, id);
    }),
    updatePreRegister: jest.fn((data, callback) => {
        callback(null, { id: "123", token: "123" });
    }) 
}

var services = {
    db: db,
    logger: logger,
    emailValidator: require("email-validator")
}

services.mailer = {
    send: jest.fn((mail, callback) => {
        callback(null, "test");
    })
}

services.ajv = new Ajv();
services.ajv.addSchema(registerSchema, "register");
services.ajv.addSchema(matconSchema, "matcon");
services.ajv.addSchema(reviewSchema, "review");
services.ajv.addSchema(userSchema, "user");
services.passwordPolicy = new PasswordPolicy({}, services);

var auth = new Auth({}, services);
var cauth = new Auth({
    auth: {
        keyLength: 16,
        keyIterations: 18,
        digest: "md5"
    }
}, services)

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
            expect(db.getUserByEmail.mock.calls.length).toBe(1);
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
            expect(db.getUserByEmail.mock.calls.length).toBe(2);
            done();
        } catch (err) {
            done(err);
        }
    })
})

test('login returns false when email not found', (done) => {
    auth.login("notfound@a.com", "aa", (err, result) => {
        try {
            expect(err).toBeDefined();
            expect(err instanceof ItemNotFoundError).toBeTruthy();
            expect(db.getUserByEmail.mock.calls.length).toBe(3);
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
])('pre register fails when email supplied not valid regex %s', (email, done) => {
    auth.preRegister(email, (err, result) => {
        try {
            expect(err).toBeDefined();
            expect(err.description).toBe("Item validation failed");
            expect(err.errors[0].message).toBe("email should be a valid email address");
            expect(result).toBeUndefined();
            expect(db.getUserByEmail.mock.calls.length).toBe(3);
            expect(db.setPreRegister.mock.calls.length).toBe(0);
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
])('pre register success when email supplied is valid regex %s', (email, done) => {
    auth.preRegister(email, (err, result) => {
        try {
            expect(err).toBeDefined();
            expect(err.description).toBe("this email is already registered");
            expect(result).toBeUndefined();
            expect(db.setPreRegister.mock.calls.length).toBe(0);
            done();
        } catch (err) {
            done(err);
        }
    })
})

test('validatePreRegister fails when preRegister not found', (done) => {
    auth.validatePreRegister({
        id: "notfound"
    }, (err, result) => {
        try {
            expect(err).toBeDefined();
            expect(err instanceof ItemNotFoundError).toBeTruthy();
            expect(result).toBeUndefined();
            expect(db.updatePreRegister.mock.calls.length).toBe(0);
            done();
        } catch (err) {
            done(err);
        }
    })
})

test('validatePreRegister fails when token does not match', (done) => {
    auth.validatePreRegister({
        id: "123",
        token: ""
    }, (err, result) => {
        try {
            expect(err).toBeDefined();
            expect(err.description).toBe("token does not match");
            expect(result).toBeUndefined();
            expect(db.updatePreRegister.mock.calls.length).toBe(0);
            done();
        } catch (err) {
            done(err);
        }
    })
})

test('validatePreRegister succeeds', (done) => {
    auth.validatePreRegister({
        id: "123",
        token: "123"
    }, (err, result) => {
        try {
            expect(err).toBeNull();
            expect(result.id).toBe("123");
            expect(result.token).toBeDefined();
            expect(result.token.length).toBe(40);
            expect(db.updatePreRegister.mock.calls.length).toBe(1);
            expect(db.updatePreRegister.mock.calls[0][0].emailValidated).toBeTruthy();
            expect(db.updatePreRegister.mock.calls[0][0].token).not.toMatch("123");
            done();
        } catch (err) {
            done(err);
        }
    })
})


test('register fails when email not supplied', (done) => {
    var gubeCount = db.getUserByEmail.mock.calls.length;
    auth.register({
        name: "",
        password: "Abcd123#"
    }, (err, result) => {
        try {
            expect(err).toBeDefined();
            expect(err.description).toBe("Item validation failed");
            expect(err.errors).toBeDefined()
            expect(err.errors[0]).toBeDefined()
            expect(err.errors[0].message).toBe("should have required property 'email'")
            expect(result).toBeUndefined();
            expect(db.getUserByEmail.mock.calls.length).toBe(gubeCount);
            expect(db.addUser.mock.calls.length).toBe(0);
            done();
        } catch (err) {
            done(err);
        }
    })
})

test('register fails when password not supplied', (done) => {
    var gubeCount = db.getUserByEmail.mock.calls.length;
    auth.register({
        email: "email@example.com",
        name: ""
    }, (err, result) => {
        try {
            expect(err).toBeDefined();
            expect(err.description).toBe("Item validation failed");
            expect(err.errors).toBeDefined()
            expect(err.errors[0]).toBeDefined()
            expect(err.errors[0].message).toBe("should have required property 'password'")
            expect(result).toBeUndefined();
            expect(db.getUserByEmail.mock.calls.length).toBe(gubeCount);
            expect(db.addUser.mock.calls.length).toBe(0);
            done();
        } catch (err) {
            done(err);
        }
    })
})

test('register fails when preRegister does not exist', (done) => {
    var gubeCount = db.getUserByEmail.mock.calls.length;
    auth.register({
        email: "a@a.com",
        password: "a",
        name: "",
        token: "",
        id: "notfound"
    }, (err, result) => {
        try {
            expect(err).toBeDefined();
            expect(err instanceof ItemNotFoundError).toBeTruthy();
            expect(result).toBeUndefined();
            expect(db.getUserByEmail.mock.calls.length).toBe(gubeCount);
            expect(db.addUser.mock.calls.length).toBe(0);
            done();
        } catch (err) {
            done(err);
        }
    })
})

test('register fails when preRegister token does not match', (done) => {
    var gubeCount = db.getUserByEmail.mock.calls.length;
    auth.register({
        email: "a@a.com",
        password: "a",
        name: "",
        token: "",
        id: "123"
    }, (err, result) => {
        try {
            expect(err).toBeDefined();
            expect(err.description).toBe("token does not match");
            expect(result).toBeUndefined();
            expect(db.getUserByEmail.mock.calls.length).toBe(gubeCount);
            expect(db.addUser.mock.calls.length).toBe(0);
            done();
        } catch (err) {
            done(err);
        }
    })
})

test('register fails when password policy not valid', (done) => {
    var gubeCount = db.getUserByEmail.mock.calls.length;
    auth.register({
        email: "email@example.com",
        password: "a",
        name: "",
        token: "123",
        id: "123"
    }, (err, result) => {
        try {
            expect(err).toBeDefined();
            expect(err instanceof PasswordPolicyError).toBeTruthy();
            expect(err.description).toBe("Password does not meet required password policy. password must be at least 8 characters");
            expect(result).toBeUndefined();
            expect(db.getUserByEmail.mock.calls.length).toBe(gubeCount);
            expect(db.addUser.mock.calls.length).toBe(0);
            done();
        } catch (err) {
            done(err);
        }
    })
})

test('register fails when user allready exists', (done) => {
    var gubeCount = db.getUserByEmail.mock.calls.length;
    auth.register({
        email: "email@example.com",
        password: "Abcd123#",
        name: "123",
        token: "123",
        id: "123"
    }, (err, result) => {
        try {
            expect(err).toBeDefined();
            expect(err instanceof ItemExistsError).toBeTruthy();
            expect(result).toBeUndefined();
            expect(db.getUserByEmail.mock.calls.length).toBe(gubeCount+1);
            expect(db.addUser.mock.calls.length).toBe(0);
            done();
        } catch (err) {
            done(err);
        }
    })
})

test('register succeeds', (done) => {
    var gubeCount = db.getUserByEmail.mock.calls.length;
    auth.register({
        email: "notfound@a.com",
        password: "Abcd123#",
        name: "123",
        token: "123",
        id: "123"
    }, (err, result) => {
        try {
            expect(err).toBeNull();
            expect(result).toStrictEqual({
                "_rev": "456",
                "id": "123"
            });
            expect(db.getUserByEmail.mock.calls.length).toBe(gubeCount+1);
            expect(db.addUser.mock.calls.length).toBe(1);
            expect(db.removePreRegister.mock.calls.length).toBe(1);
            done();
        } catch (err) {
            done(err);
        }
    })
})