var params = new URLSearchParams(new URL(window.location).search);
var name = params.get("name");
var allReady = false;

function calculateWeight() {
    if (allReady) {
        $.ajax({
            url: "/api/bread/" + name + "/weight",
            data: {
                breadType: name,
                weight: $("#totalWeightBadge").text()
            },
            success: (matcon) => {
                console.log(matcon);
                $("#matcon").loadTemplate("/templates/ingredient.html", matcon)
            }
        })
    }
}

function calculateTimes(h,m) {
    var t = $('.timepicker').val();
    if(h) {
        t = h + ":" + m;
    }
    var from = $("#startOrEnd").prop("checked") ? "end" : "start";
    $.ajax({
        url: "/api/bread/" + name + "/times",
        data: {
            breadType: name,
            from: from,
            time: t
        },
        success: (matcon) => {
            //console.log(matcon);
            $("#times").loadTemplate("/templates/time.html", matcon)
        }
    })
}

function setStartTime() {
    var d = new Date();
    var minutes = d.getMinutes();
    var hour = d.getHours();
    minutes += 10;
    var mod = minutes % 5;
    minutes -= mod;
    if (minutes % 60 > 0) {
        minutes %= 60;
        hour += 1;
        if (hour % 24 > 0) {
            hour %= 24;
        }
    }
    var t = hour + ":" + minutes;
    var start = d.getHours() + ":" + d.getMinutes();
    $('.timepicker').timepicker({
        twelveHour: false,
        defaultTime: t,
        onSelect: calculateTimes
    }).val(t)
    calculateTimes();
}

function initNumLoafs() {
    var numLoafs = document.getElementById('numLoafs');
    noUiSlider.create(numLoafs, {
        start: [1],
        step: 1,
        range: {
            'min': [0],
            'max': [11]
        },
        connect: 'lower',
        format: {
            // 'to' the formatted value. Receives a number.
            to: function(value) {
                return value.toFixed(0);
            },
            // 'from' the formatted value.
            // Receives a string, should return a number.
            from: function(value) {
                return parseInt(value).toFixed(0);
            }
        },
        tooltips: true,
        padding: 1,
        pips: {
            mode: 'range',
            density: 9
        }
    });
    numLoafs.noUiSlider.on("update", (value) => {
        $("#numLoafsBadge").text(value[0]);
        $("#totalWeightBadge").text($("#numLoafsBadge").text() * $("#weightBadge").text());
    });
    numLoafs.noUiSlider.on("change", (value) => {
        calculateWeight();
    });
}

function initWeight() {
    var weight = document.getElementById('weight');
    noUiSlider.create(weight, {
        start: [900],
        step: 10,
        range: {
            'min': [0],
            'max': [1500]
        },
        connect: 'lower',
        format: {
            // 'to' the formatted value. Receives a number.
            to: function(value) {
                return value.toFixed(0);
            },
            // 'from' the formatted value.
            // Receives a string, should return a number.
            from: function(value) {
                return parseInt(value).toFixed(0);
            }
        },
        tooltips: true,
        padding: 10,
        pips: {
            mode: 'count',
            values: 16
        }
    });
    weight.noUiSlider.on("update", (value) => {
        $("#weightBadge").text(value[0]);
        $("#totalWeightBadge").text($("#numLoafsBadge").text() * $("#weightBadge").text());
    });
    weight.noUiSlider.on("change", (value) => {
        calculateWeight();
    });
    $.get("/api/bread/" + name, (data) => {
        $("#img").attr("src", "/img/" + data.img);
        weight.noUiSlider.set(data.weight);
        allReady = true;
        calculateWeight();
    })
}

$(document).ready(() => {
    $("nav").loadTemplate("templates/header.html");
    setStartTime();
    initNumLoafs();
    initWeight();
    $("#startOrEnd").change((e) => {
        calculateTimes();
    })
    $("#title").text(name);
})