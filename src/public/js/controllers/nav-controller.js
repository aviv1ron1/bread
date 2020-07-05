"use strict";

angular.module('app').controller('navController', function($scope, $rootScope, $location, $route, auth) {
    $scope.d = {}
    $scope.d.data = [];
    $scope.d.auth = auth.getData();

    $('#navbar1').on('shown.bs.collapse', function(e) {
        $scope.d.isMenuExpanded = true;
    });

    $scope.home = function() {
        if($scope.d.isMenuExpanded) {
            $('#navbar1').collapse('hide');
        }
        $location.url("/");
        $route.reload();
    }

    $scope.menuClicked = function(item) {
        if($scope.d.isMenuExpanded) {
            $('#navbar1').collapse('hide');
        }
        $location.url(item);
    }


});