const PasswordPolicy = require('../modules/password-policy.js');

var pp = new PasswordPolicy();
var cp = new PasswordPolicy({
    "password-policy": {
        minLength: 7,
        maxLength: 10,
        mustIncludeNumbers: false,
        mustIncludeUpperCase: true,
        mustIncludeSpecial: true,
        maxRepeat: 3
    }
})

test('PasswordPolicy returns true with default config', done => {
    function callback(err, valid) {
        try {
            expect(err).toBeNull();
            expect(valid).toBeTruthy();
            done();
        } catch (error) {
            done(error);
        }
    }
    pp.validate("abcd1234", callback);
});


test('PasswordPolicy false when too short with default config', done => {
    function callback(err, valid) {
        try {
            expect(err).toBe("password must be at least 8 characters");
            expect(valid).toBeUndefined();
            done();
        } catch (error) {
            done(error);
        }
    }
    pp.validate("abcd123", callback);
});

test('PasswordPolicy false when too long with default config', done => {
    function callback(err, valid) {
        try {
            expect(err).toBe("password must be maximum 100 characters");
            expect(valid).toBeUndefined();
            done();
        } catch (error) {
            done(error);
        }
    }
    var pass = "";
    for (var i = 0; i < 94; i++) {
        pass += String.fromCharCode(i + 67)
    }
    pp.validate("abcd123" + pass, callback);
});

test('PasswordPolicy false when no numbers with default config', done => {
    function callback(err, valid) {
        try {
            expect(err).toBe("password must include at least one number");
            expect(valid).toBeUndefined();
            done();
        } catch (error) {
            done(error);
        }
    }
    pp.validate("abcdefgh", callback);
});

test('PasswordPolicy returns false when max repeat exceeded with default config', done => {
    function callback(err, valid) {
        try {
            expect(err).toBe("password must not include the same character repeating more than 2 times");
            expect(valid).toBeUndefined();
            done();
        } catch (error) {
            done(error);
        }
    }
    pp.validate("AAAcdefg1#", callback);
});


///custom config

test('PasswordPolicy returns true with custom config', done => {
    function callback(err, valid) {
        try {
            expect(err).toBeNull();
            expect(valid).toBeTruthy();
            done();
        } catch (error) {
            done(error);
        }
    }
    cp.validate("AAbbcc#", callback);
});

test('PasswordPolicy false when too short with custom config', done => {
    function callback(err, valid) {
        try {
            expect(err).toBe("password must be at least 7 characters");
            expect(valid).toBeUndefined();
            done();
        } catch (error) {
            done(error);
        }
    }
    cp.validate("Abbcc#", callback);
});

test('PasswordPolicy false when too long with custom config', done => {
    function callback(err, valid) {
        try {
            expect(err).toBe("password must be maximum 10 characters");
            expect(valid).toBeUndefined();
            done();
        } catch (error) {
            done(error);
        }
    }
    cp.validate("abcd123abcd", callback);
});

test('PasswordPolicy true when no numbers with custom config', done => {
    function callback(err, valid) {
        try {
            expect(err).toBeNull();
            expect(valid).toBeTruthy();
            done();
        } catch (error) {
            done(error);
        }
    }
    cp.validate("Abcdefgh#", callback);
});

test('PasswordPolicy returns false when no upper case with custom config', done => {
    function callback(err, valid) {
        try {
            expect(err).toBe("password must include at least one upper case character (A-Z)");
            expect(valid).toBeUndefined();
            done();
        } catch (error) {
            done(error);
        }
    }
    cp.validate("abcdefg#", callback);
});

test('PasswordPolicy returns false when no special char with custom config', done => {
    function callback(err, valid) {
        try {
            expect(err).toBe("password must include at least one special character (for example ! @ # $)");
            expect(valid).toBeUndefined();
            done();
        } catch (error) {
            done(error);
        }
    }
    cp.validate("abcdefgH", callback);
});

test('PasswordPolicy returns false when max repeat exceeded with custom config', done => {
    function callback(err, valid) {
        try {
            expect(err).toBe("password must not include the same character repeating more than 3 times");
            expect(valid).toBeUndefined();
            done();
        } catch (error) {
            done(error);
        }
    }
    cp.validate("AAAAdefgh#", callback);
});

test('PasswordPolicy returns true when max repeat not exceeded with custom config', done => {
    function callback(err, valid) {
        try {
            expect(err).toBeNull();
            expect(valid).toBeTruthy();
            done();
        } catch (error) {
            done(error);
        }
    }
    cp.validate("AAAcdefgh#", callback);
});