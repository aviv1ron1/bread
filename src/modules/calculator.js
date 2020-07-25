const nou = require('nou');
const moment = require('moment');

function sum(arr, prop) {
    return arr.reduce((a, b) => {
        if (nou.isNotNull(prop)) {
            return a + b[prop];
        } else {
            return a + b;
        }
    }, 0);
}

function round(x) {
    return Math.round(x);
}

function extractFlour(finalWeight, hydration) {
    return finalWeight / (1 + hydration);
}

function extractHydration(finalWeight, hydration) {
    return finalWeight * (1 - 1 / (1 + hydration));
}

function select(arr, field, query) {
    return arr.filter((i) => {
        return (i[field] == query);
    })
}

function calculateAmountFromFinalWeight(finalAmount, data) {
    var flourWanted = extractFlour(finalAmount, data.hydration);
    return calculateAmount(flourWanted, data);
}

function calculateAmount(flourWanted, data) {
    data.ingredients.map((f) => {
        if (nou.isNull(f.calculate) && nou.isNull(f.pre)) {
            f.finalWeight = round(f.amount * flourWanted)
        }
    });
    var preFerments = select(data.ingredients, "pre", true);
    var preHydrationWeight = 0;
    var preAddedFloursWeight = 0;
    if (preFerments.length > 0) {
        preFerments.map((preFerment) => {
            var preFlours = select(preFerment.ingredients, "type", "flour");
            preFlours.map((preFlour) => {
                //calculate the weight of flour according to precent from the parent flour
                var sourceFlour = select(data.ingredients, "name", preFlour.amount.from)[0];
                preFlour.finalWeight = round(preFlour.amount.precent * flourWanted);
                sourceFlour.finalWeight -= preFlour.finalWeight;
            });
            var preFloursWeight = sum(preFlours, "finalWeight");
            var madres = select(preFerment.ingredients, "type", "madre");
            madres.map((madre) => {
                madre.finalWeight = round(madre.amount * preFloursWeight);
                madre.flourWeight = extractFlour(madre.finalWeight, madre.hydration);
                madre.hydrationWeight = extractHydration(madre.finalWeight, madre.hydration);
            });

            var preHydrations = preFerment.ingredients.filter((ping) => {
                return (ping.type == "hydration" && nou.isNull(ping.calculate))
            });
            preHydrations.map((hydration) => {
                hydration.finalWeight = round(hydration.amount * preFloursWeight);
            });
            //calculate current hydration and needed water in pre ferment dough
            preHydrationWeight = sum(preHydrations, "finalWeight");

            var madreFlours = sum(madres, "flourWeight");
            var madreHydrations = sum(madres, "hydrationWeight");
            preHydrationWeight += madreHydrations;
            preAddedFloursWeight += madreFlours;

            var preCalculateHydrations = preFerment.ingredients.filter((ping) => {
                return (ping.type == "hydration" && ping.calculate);
            }).map((ping) => {
                ping.finalWeight = round((preFloursWeight + madreFlours) * preFerment.hydration - madreHydrations);
                preHydrationWeight += ping.finalWeight;
            });
            preFerment.ingredients.map((ping) => {
                if (nou.isNull(ping.finalWeight)) {
                    ping.finalWeight = round(ping.amount * preFloursWeight);
                }
            })
            preFerment.finalWeight = sum(preFerment.ingredients, "finalWeight")
        })
    }
    var hydrationTotalWantedWeight = (flourWanted + preAddedFloursWeight) * data.hydration;
    var currentHydration = preHydrationWeight;

    data.ingredients.map((ing) => {
        if (ing.type == "hydration" && nou.isNull(ing.calculate) && !ing.pre) {
            currentHydration += ing.finalWeight;
        }

    })
    data.ingredients.map((ing) => {
        if (ing.calculate) {
            ing.finalWeight = round(hydrationTotalWantedWeight - currentHydration);
        }
    })
    return data;
}

function calculateTimesFromStart(startTime, matcon) {
    var start = moment();
    start.hour(startTime.split(":")[0]);
    start.minute(startTime.split(":")[1]);
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

module.exports = {
    calculateAmount: calculateAmount,
    calculateAmountFromFinalWeight: calculateAmountFromFinalWeight,
    calculateTimesFromStart: calculateTimesFromStart,
    calculateTimesFromEnd: calculateTimesFromEnd,
    select: select
}