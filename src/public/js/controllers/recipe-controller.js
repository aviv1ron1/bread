"use strict";

angular.module('app').controller('recipeController', function($scope, $timeout, $location, recipesFactory, data) {
    $scope.root = {
        data: data,
        expertMode: false
    };

    recipesFactory.weights({
        id: $scope.root.data.name,
        breadType: $scope.root.data.name,
        weight: $scope.root.data.weight
    }, (w) => {
    	console.log(w)
        $scope.root.weights = w;
    })

    function calculateWeight() {
        if (allReady) {
            // $.ajax({
            //     url: "/api/bread/" + name + "/weight",
            //     data: {
            //         breadType: name,
            //         weight: $("#totalWeightBadge").text()
            //     },
            //     success: (matcon) => {
            //         $("#matcon").loadTemplate("/templates/ingredient.html", matcon)
            //     }
            // })
            recipesFactory.weights({
                id: $scope.root.data.name,
                breadType: $scope.root.data.name,
                weight: $scope.root.weight
            })
        }
    }

    function calculateTimes(h, m) {
        // var t = $('.timepicker').val();
        // if (h) {
        //     t = h + ":" + m;
        // }
        // var from = $("#startOrEnd").prop("checked") ? "end" : "start";
        // recipesFactory.times({
        //     breadType: name,
        //     from: from,
        //     time: t,
        //     id: $scope.root.data.name
        // }, (matcon) => {
        //     $scope.root.matcon = matcon;
        //     console.log(matcon);
        // })
    }

    function setStartTime() {
        var d = new Date();
        var minutes = d.getMinutes();
        var hour = d.getHours();
        minutes += 10;
        var mod = minutes % 5;
        minutes -= mod;
        if (minutes / 60 > 1) {
            minutes %= 60;
            hour += 1;
            if (hour / 24 > 1) {
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
            $scope.root.numLoafs = value[0];
            //$scope.$apply();
        });
        numLoafs.noUiSlider.on("change", (value) => {
            $scope.root.numLoafs = value[0];
            $scope.$apply();
            //calculateWeight();
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
            $scope.root.weight = value[0];
            //$scope.$apply();
        });
        weight.noUiSlider.on("change", (value) => {
            $scope.root.weight = value[0];
            $scope.$apply();
            calculateWeight();
        });
        // $.get("/api/bread/" + name, (data) => {
        //     $("#img").attr("src", "/img/" + data.img);
        //     weight.noUiSlider.set(data.weight);
        //     allReady = true;
        //     calculateWeight();
        // })
    }

    initWeight()
    initNumLoafs()

});