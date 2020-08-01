const calculator = require('../modules/calculator.js');
const fs = require('fs');

var matcon1 = {
    hydration: 0.5,
    "ingredients": [{
        "name": "f",
        "amount": 1,
        "type": "flour"
    }, {
        "name": "water",
        "type": "hydration",
        "calculate": true
    }]
}

var matcon2 = {
    hydration: 0.5,
    "ingredients": [{
        "name": "f",
        "amount": 1,
        "type": "flour"
    }, {
        "name": "water",
        "type": "hydration",
        "calculate": true
    }, {
        "name": "oil",
        "type": "hydration",
        "amount": 0.1
    }]
}

var matcon3 = {
    hydration: 0.5,
    "ingredients": [{
        "name": "f1",
        "amount": 0.5,
        "type": "flour"
    }, {
        "name": "f2",
        "amount": 0.25,
        "type": "flour"
    }, {
        "name": "f3",
        "amount": 0.25,
        "type": "flour"
    }, {
        "name": "water",
        "type": "hydration",
        "calculate": true
    }]
}

var matcon4 = {
    hydration: 0.5,
    "ingredients": [{
        "name": "f1",
        "amount": 1,
        "type": "flour"
    }, {
        "name": "water",
        "type": "hydration",
        "calculate": true
    }, {
        "name": "poolish",
        "pre": true,
        "hydration": 1,
        "ingredients": [{
            "name": "f1",
            "type": "flour",
            "amount": {
                "from": "f1",
                "precent": 0.2
            }
        }, {
            "name": "water",
            "type": "hydration",
            "amount": 1
        }, {
            "name": "yeast",
            "amount": 0.1
        }]
    }]
}

var matcon5 = {
    hydration: 0.5,
    "ingredients": [{
        "name": "f1",
        "amount": 1,
        "type": "flour"
    }, {
        "name": "water",
        "type": "hydration",
        "calculate": true
    }, {
        "name": "starter",
        "pre": true,
        "hydration": 1,
        "ingredients": [{
            "name": "f1",
            "type": "flour",
            "amount": {
                "from": "f1",
                "precent": 0.2
            }
        }, {
            "name": "water",
            "type": "hydration",
            "calculate": true
        }, {
            "name": "madre",
            "type": "madre",
            "hydration": 0.5,
            "amount": 0.5
        }]
    }]
}

var brioche = {
    "hydration": 0.65,
    "ingredients": [{
        "name": "white flour",
        "amount": 1,
        "type": "flour"
    }, {
        "name": "salt",
        "type": "hydration",
        "amount": 0.04
    }, {
        "name": "butter",
        "type": "hydration",
        "amount": 0.4
    }, {
        "name": "milk",
        "type": "hydration",
        "amount": 0.4
    }, {
        "name": "sugar",
        "amount": 0.25
    }, {
        "name": "eggs",
        "amount": 0.17,
        "type": "hydration"
    }, {
        "name": "water",
        "type": "hydration",
        "calculate": true
    }, {
        "name": "yeast",
        "amount": 0.02
    }]
}

var hamburger = {
    "hydration": 0.7,
    "ingredients": [{
        "name": "white flour",
        "amount": 0.6,
        "type": "flour"
    }, {
        "name": "whole wheat flour",
        "amount": 0.4,
        "type": "flour"
    }, {
        "name": "salt",
        "amount": 0.02
    }, {
        "name": "butter",
        "type": "hydration",
        "amount": 0.1
    }, {
        "name": "water",
        "type": "hydration",
        "calculate": true
    }, {
        "name": "sugar",
        "amount": 0.12
    }, {
        "name": "eggs",
        "amount": 0.12,
        "type": "hydration"
    }, {
        "name": "yeast",
        "amount": 0.015
    }, {
    	"name": "choux",
    	"pre": true,
    	"hydration": 5,
    	"ingredients": [
    		{
    			"name": "whole wheat flour",
    			"type": "flour",
    			"amount": {
    				"from": "whole wheat flour",
    				"precent": 0.1
    			}
    		}, {
    			"name": "water",
    			"type": "hydration",
    			"calculate": true
    		}
    	]
    }]
}

var pandemi = {
    "hydration": 0.65,
    "ingredients": [{
        "name": "white flour",
        "amount": 0.8,
        "type": "flour"
    }, {
        "name": "whole wheat flour",
        "amount": 0.2,
        "type": "flour"
    }, {
        "name": "salt",
        "amount": 0.02
    }, {
        "name": "butter",
        "type": "hydration",
        "amount": 0.05
    }, {
        "name": "water",
        "type": "hydration",
        "calculate": true
    }, {
        "name": "sugar",
        "amount": 0.04
    }, {
        "name": "milk",
        "amount": 0.125,
        "type": "hydration"
    }, {
        "name": "starter",
        "pre": true,
        "hydration": .5,
        "ingredients": [
            {
                "name": "whole wheat flour",
                "type": "flour",
                "amount": {
                    "from": "whole wheat flour",
                    "precent": 0.2
                }
            }, {
                "name": "water",
                "type": "hydration",
                "calculate": true
            }, {
                "name": "madre",
                "type": "madre",
                "hydration": 0.65,
                "amount": 0.1
            }
        ]
    }]
}

var classic50PrecentWholeWheat = {
    "hydration": 0.85,
    "ingredients": [{
        "name": "whole wheat flour",
        "amount": 0.5,
        "type": "flour"
    }, {
        "name": "cafri flour",
        "amount": 0.25,
        "type": "flour"
    }, {
        "name": "strong white flour",
        "amount": 0.25,
        "type": "flour"
    }, {
        "name": "salt",
        "type": "hydration",
        "amount": 0.02
    }, {
        "name": "oil",
        "type": "hydration",
        "amount": 0.025
    }, {
        "name": "water",
        "type": "hydration",
        "calculate": true
    }, {
        "name": "starter",
        "hydration": 0.65,
        "pre": true,
        "ingredients": [{
            "name": "whole wheat flour",
            "type": "flour",
            "amount": {
                "precent": 0.2,
                "from": "whole wheat flour"
            }
        }, {
            "name": "water",
            "calculate": true,
            "type": "hydration"
        }, {
            "name": "madre",
            "amount": 0.33,
            "type": "madre",
            "hydration": 0.65
        }]
    }]
}

var pizza = {
    "hydration": 0.65,
    "ingredients": [{
        "name": "pizza flour",
        "amount": 1,
        "type": "flour"
    }, {
        "name": "salt",
        "type": "hydration",
        "amount": 0.02
    }, {
        "name": "water",
        "type": "hydration",
        "calculate": true
    }, {
        "name": "sourdough",
        "hydration": 0.65,
        "amount": 0.15
    }]
}

test('select returns selected items', () => {
    var s = calculator.select([{
        "a": "a"
    }, {
        "a": "b"
    }], "a", "a");
    expect(s.length).toBe(1);
    expect(s[0]).toStrictEqual({
        "a": "a"
    })
})

test('simple matcon 1 flour 0.5 water', () => {
    var amounts = calculator.calculateAmount(50, matcon1);
    expect(calculator.select(amounts.ingredients, "name", "f")[0].finalWeight).toBe(50);
    expect(calculator.select(amounts.ingredients, "name", "water")[0].finalWeight).toBe(25);
});

test('simple matcon 1 flour 0.5 water and 0.1 oil', () => {
    var amounts = calculator.calculateAmount(50, matcon2);
    expect(calculator.select(amounts.ingredients, "name", "f")[0].finalWeight).toBe(50);
    expect(calculator.select(amounts.ingredients, "name", "oil")[0].finalWeight).toBe(5);
    expect(calculator.select(amounts.ingredients, "name", "water")[0].finalWeight).toBe(20);
});

test('test that different flour types get calculated right', () => {
    var amounts = calculator.calculateAmount(60, matcon3);
    expect(calculator.select(amounts.ingredients, "name", "f1")[0].finalWeight).toBe(30);
    expect(calculator.select(amounts.ingredients, "name", "f2")[0].finalWeight).toBe(15);
    expect(calculator.select(amounts.ingredients, "name", "f3")[0].finalWeight).toBe(15);
    expect(calculator.select(amounts.ingredients, "name", "water")[0].finalWeight).toBe(30);
});

test('test poolish pre ferment gets calculated right', () => {
    var amounts = calculator.calculateAmount(60, matcon4);
    expect(calculator.select(amounts.ingredients, "name", "f1")[0].finalWeight).toBe(48);
    expect(calculator.select(amounts.ingredients, "name", "poolish")[0].finalWeight).toBe(25);
    expect(calculator.select(amounts.ingredients, "name", "water")[0].finalWeight).toBe(18);
    var pre = calculator.select(amounts.ingredients, "name", "poolish")[0];
    expect(calculator.select(pre.ingredients, "name", "water")[0].finalWeight).toBe(12);
    expect(calculator.select(pre.ingredients, "name", "f1")[0].finalWeight).toBe(12);
    expect(calculator.select(pre.ingredients, "name", "yeast")[0].finalWeight).toBe(1);
});

test('test poolish pre ferment gets calculated right from final weight', () => {
    var amounts = calculator.calculateAmountFromFinalWeight(100, matcon4);
    expect(calculator.select(amounts.ingredients, "name", "f1")[0].finalWeight).toBe(54);
    expect(calculator.select(amounts.ingredients, "name", "poolish")[0].finalWeight).toBe(27);
    expect(calculator.select(amounts.ingredients, "name", "water")[0].finalWeight).toBe(20);
    var pre = calculator.select(amounts.ingredients, "name", "poolish")[0];
    expect(calculator.select(pre.ingredients, "name", "water")[0].finalWeight).toBe(13);
    expect(calculator.select(pre.ingredients, "name", "f1")[0].finalWeight).toBe(13);
    expect(calculator.select(pre.ingredients, "name", "yeast")[0].finalWeight).toBe(1);
});

test('test sourdough pre ferment gets calculated right', () => {
    var amounts = calculator.calculateAmount(60, matcon5);
    expect(calculator.select(amounts.ingredients, "name", "f1")[0].finalWeight).toBe(48);
    expect(calculator.select(amounts.ingredients, "name", "starter")[0].finalWeight).toBe(32);
    expect(calculator.select(amounts.ingredients, "name", "water")[0].finalWeight).toBe(16);
    var pre = calculator.select(amounts.ingredients, "name", "starter")[0];
    expect(calculator.select(pre.ingredients, "name", "water")[0].finalWeight).toBe(14);
    expect(calculator.select(pre.ingredients, "name", "f1")[0].finalWeight).toBe(12);
    expect(calculator.select(pre.ingredients, "name", "madre")[0].finalWeight).toBe(6);
});

test('test sourdough pre ferment gets calculated right from final weight', () => {
    var amounts = calculator.calculateAmountFromFinalWeight(96, matcon5);
    expect(calculator.select(amounts.ingredients, "name", "f1")[0].finalWeight).toBe(51);
    expect(calculator.select(amounts.ingredients, "name", "starter")[0].finalWeight).toBe(35);
    expect(calculator.select(amounts.ingredients, "name", "water")[0].finalWeight).toBe(17);
    var pre = calculator.select(amounts.ingredients, "name", "starter")[0];
    expect(calculator.select(pre.ingredients, "name", "water")[0].finalWeight).toBe(15);
    expect(calculator.select(pre.ingredients, "name", "f1")[0].finalWeight).toBe(13);
    expect(calculator.select(pre.ingredients, "name", "madre")[0].finalWeight).toBe(7);
});

test('make the fucking recipe', () => {
    var amounts = calculator.calculateAmountFromFinalWeight(250*4, pizza);
    fs.writeFileSync("output.json", JSON.stringify(amounts))
    expect(amounts.ingredients).toBeDefined();
});





