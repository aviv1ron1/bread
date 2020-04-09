const moment = require('moment');
const matconim = require('./matconim.json');
const express = require('express');
const path = require('path');

var app = express()

var api = express();

app.use("/api", api);
app.use(express.static(path.join(__dirname, 'public')));

function timeToStr(t) {
	if(t/60 >= 1) {
		var s = (t/60).toFixed(0) + " hours";
		if(t%60 > 0) {
			s += " and " + t%60 + " minutes";
		}
		return s;
	}
	return t +  " minutes";
}

function caculateAmount(finalAmount, breadType) {
    return (JSON.parse(JSON.stringify(matconim[breadType].ingredients))).map((ing) => {
        ing.amount = (ing.amount * finalAmount).toFixed(0);
        return ing;
    })
}

function calculateTimesFromStart(startTime, breadType) {
    var start = moment();
    start.hour(startTime.split(":")[0]);
    start.minute(startTime.split(":")[1]);
    var matcon = matconim[breadType].times;
    var ret = []
    for (var i = 0; i < matcon.length; i++) {
        var t = matcon[i];
        ret.push({
            name: t.name,
            from: moment(start).format("HH:mm"),
            to: start.add(t.time, 'm').format("HH:mm"),
            duration: timeToStr(t.time)
        })
        
    }
    ret.push({
        name: "ready",
        from: start.format("HH:mm")
    })
    return ret;
}

function calculateTimesFromEnd(endTime, breadType) {
    var end = moment();
    end.hour(endTime.split(":")[0]);
    end.minute(endTime.split(":")[1]);
    var matcon = matconim[breadType].times;
    var ret = []
    ret.push({
        name: "ready",
        from: moment(end).format("HH:mm")
    })
    for (var i = matcon.length - 1; i > -1; i--) {
        var t = matcon[i];
        ret.push({
            name: t.name,
            to: moment(end).format("HH:mm"),
            from: end.subtract(t.time, "m").format("HH:mm"),
            duration: timeToStr(t.time)
        })
    }

    return ret.reverse();
}


api.get("/bread", (req, res) => {
    var arr = [];
    for (let [name, b] of Object.entries(matconim)) {
        arr.push({
            "name": name,
            "weight": b.weight,
            "temperature": b.temperature,
            "img": b.img
        })
    }
    res.json(arr);
});

api.get("/bread/:breadType", (req, res) => {
    if (matconim[req.params.breadType]) {
        var b = matconim[req.params.breadType];
        res.json({
            "name": req.params.breadType,
            "weight": b.weight,
            "temperature": b.temperature,
            "img": b.img
        })
    } else {
        res.status(404).end();
    }
});

api.get("/bread/:breadType/times", (req, res) => {
    if (matconim[req.params.breadType]) {
    	if(req.query.from == "start") {
    		res.json(calculateTimesFromStart(req.query.time, req.params.breadType));
    	}
        else {
        	res.json(calculateTimesFromEnd(req.query.time, req.params.breadType));
        }
    } else {
        res.status(404).end();
    }
});

api.get("/bread/:breadType/weight", (req, res) => {
    if (matconim[req.params.breadType]) {
        res.json(caculateAmount(req.query.weight, req.params.breadType));
    } else {
        res.status(404).end();
    }
});


app.listen(8080, () => {
    console.log('http server listening');
})