"use strict";

angular.module('app').controller('loginController', function($scope, $location, $timeout, auth, loginFactory) {
    $scope.d = {
        auth: auth.getData(),
        errorClass: "",
        error: null,
        inProg: false,
        success: false
    }

    $scope.login = () => {
        if ($scope.loginForm.$valid) {
            $scope.d.inProg = true;
            loginFactory.login({}, {
                email: $scope.d.email,
                password: $scope.d.password
            }).$promise.then((user) => {
                console.log("login success!", user);
                auth.setLogin(user);
                $scope.d.inProg = false;
                $scope.d.auth = auth.getData();
                $scope.d.success = true;
                $timeout(() => {
                    $location.path("/");
                }, 2000);
            }, (err) => {
                console.error("error login", err);
                $scope.d.inProg = false;
                $scope.d.error = err.data;
                $scope.d.errorClass = "error";
                $timeout(() => {
                    $scope.d.errorClass = "";
                }, 3000)
            });
        } else {
            console.log("form not valid");
        }
    }

});