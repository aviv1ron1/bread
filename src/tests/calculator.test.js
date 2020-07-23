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
    	"ingredients": [
    		{
    			"name": "f1",
    			"type": "flour",
    			"amount": {
    				"from": "f1",
    				"precent": 0.2
    			}
    		},
    		{
    			"name": "water",
    			"type": "hydration",
    			"amount": 1
    		}, {
    			"name": "yeast",
    			"amount": 0.1
    		}
    	]
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
    	"ingredients": [
    		{
    			"name": "f1",
    			"type": "flour",
    			"amount": {
    				"from": "f1",
    				"precent": 0.2
    			}
    		},
    		{
    			"name": "water",
    			"type": "hydration",
    			"calculate": true
    		}, {
    			"name": "madre",
    			"type": "madre",
    			"hydration": 0.5,
    			"amount": 0.5
    		}
    	]
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
    fs.writeFileSync("output.json", JSON.stringify(amounts))
    expect(calculator.select(amounts.ingredients, "name", "f1")[0].finalWeight).toBe(51);
    expect(calculator.select(amounts.ingredients, "name", "starter")[0].finalWeight).toBe(35);
    expect(calculator.select(amounts.ingredients, "name", "water")[0].finalWeight).toBe(17);
    var pre = calculator.select(amounts.ingredients, "name", "starter")[0];
    expect(calculator.select(pre.ingredients, "name", "water")[0].finalWeight).toBe(15);
    expect(calculator.select(pre.ingredients, "name", "f1")[0].finalWeight).toBe(13);
    expect(calculator.select(pre.ingredients, "name", "madre")[0].finalWeight).toBe(7);
});
