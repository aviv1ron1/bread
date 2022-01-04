"use strict";

angular.module('app').directive('switch', function() {
    return {
        templateUrl: '/js/directives/switch.html',
        restrict: 'E',
        scope: {
            d: '=d',
            edit: '=edit'
        },
        link: function(scope, element, attributes) {
            scope.on = attributes.on;
            scope.off = attributes.off;
        }
    };
});