"use strict";

angular.module('app').controller('recipesController', function($scope, $timeout, $location, data) {
    $scope.root = {
    	data: data
    };

    $scope.breadClicked = (bread) => {
    	$location.url("/recipe/" + bread.name);
    }

});