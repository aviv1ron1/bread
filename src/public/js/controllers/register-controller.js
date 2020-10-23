"use strict";

angular.module('app').controller('registerController', function($scope, $location, $timeout, $sce, auth, loginFactory) {
    $scope.d = {
        auth: auth.getData(),
        errorClass: "",
        error: null,
        inProg: false,
        passwordsDontMatch: false
    }

    $scope.register = () => {
        $scope.d.error = null;
        if ($scope.loginForm.$valid) {
            if ($scope.d.password != $scope.d.confirmPassword) {
                return;
            }
            $scope.d.inProg = true;
            loginFactory.register({}, {
                email: $scope.d.email,
                name: $scope.d.username,
                password: $scope.d.password
            }).$promise.then((user) => {
                console.log("register success!", user);
                $scope.d.inProg = false;
                $location.path("/postregister")
            }, (err) => {
                console.error("error register", err);
                $scope.d.inProg = false;
                if (typeof err.data == "string") {
                    $scope.d.error = $sce.trustAsHtml(err.data);
                } else {
                    $scope.d.error = $sce.trustAsHtml(err.data.join("<br>"));
                }
                $scope.d.errorClass = "error";
                $timeout(() => {
                    $scope.d.errorClass = "";
                }, 2000)
            });
        } else {
            console.log("form not valid");
        }
    }

});