"use strict";

angular.module('app').directive('ingredient', function() {
    return {
        templateUrl: '/js/directives/ingredient.html',
        restrict: 'E',
        scope: {
            data: '=',
            expertMode: '='
        },
        link: function(scope, element, attributes) {
            console.log(scope, element, attributes);
        }
    };
});