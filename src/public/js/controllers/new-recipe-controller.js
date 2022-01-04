"use strict";

const IMG_SIZE = 256;

angular.module('app').controller('newRecipeController', function($scope, $timeout, $interval, $http, $location, popularTags) {

    $scope.d = {
        imageUploaded: null,
        zoom: 10,
        recipe: {
            labels: []
        },
        suggestedLabels: popularTags
    };

    $scope.addLabel = (lbl, index) => {
        $scope.d.suggestedLabels.splice(index, 1);
        $scope.d.recipe.labels.push(lbl);
    }

    $scope.removeLabel = (lbl, index) => {
        $scope.d.recipe.labels.splice(index, 1);
    }

    $scope.clear = () => {
        $scope.stopZoom();
        $scope.d.img = null;
        clearCanvas();
        $scope.d.imageUploaded = false;
    }

    var clearCanvas = () => {
        var canvas = angular.element("#imgCanvas")[0];
        var ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, IMG_SIZE, IMG_SIZE);
        return ctx;
    }

    var doZoom = (dir) => {
        return () => {
            var shouldStop = false;
            if (dir > 0) {
                if ($scope.d.sw < 20 || $scope.d.sh < 20) {
                    shouldStop = true;
                }
            } else {
                if ($scope.d.sx < 1 || $scope.d.sy < 1) {
                    shouldStop = true;
                }
            }
            if (shouldStop) {
                return $timeout($scope.stopZoom(), 1);
            }
            var ctx = clearCanvas();
            var z = dir * $scope.d.zoom;

            if ($scope.d.sx + z / 2 < 0 || $scope.d.sy + z / 2 < 0) {
                z = Math.min($scope.d.sx, $scope.d.sy);
            }
            // if($scope.d.img.width < $scope.d.img.height) {
            // 	z *= $scope.d.img.width / $scope.d.img.height;
            // }
            $scope.d.sx += z / 2;
            $scope.d.sw -= z;
            z = dir * $scope.d.zoom;
            // if($scope.d.img.width > $scope.d.img.height) {
            // 	z *= $scope.d.img.height / $scope.d.img.width;
            // }
            $scope.d.sy += z / 2;
            $scope.d.sh -= z;
            console.log($scope.d.sx, $scope.d.sy, $scope.d.sw, $scope.d.sh);
            ctx.drawImage($scope.d.img, $scope.d.sx, $scope.d.sy, $scope.d.sw, $scope.d.sh, 0, 0, IMG_SIZE, IMG_SIZE);
        }
    }

    var doMove = (x, y) => {
        return () => {
            var shouldStop = false;
            if ($scope.d.sx <= 0 && x < 0) {
                shouldStop = true;
            }
            if ($scope.d.sx + $scope.d.sw >= $scope.d.img.width && x > 0) {
                shouldStop = true;
            }
            if ($scope.d.sy <= 0 && y < 0) {
                shouldStop = true;
            }
            if ($scope.d.sy + $scope.d.sh >= $scope.d.img.height && y > 0) {
                shouldStop = true;
            }
            if (shouldStop) {
                return $timeout($scope.stopMove(), 1);
            }
            var ctx = clearCanvas();
            if (x != 0) {
                $scope.d.sx += x * $scope.d.zoom;
            }
            if (y != 0) {
                $scope.d.sy += y * $scope.d.zoom;
            }
            console.log($scope.d.sx, $scope.d.sy, $scope.d.sw, $scope.d.sh);
            ctx.drawImage($scope.d.img, $scope.d.sx, $scope.d.sy, $scope.d.sw, $scope.d.sh, 0, 0, IMG_SIZE, IMG_SIZE);
        }
    }

    $scope.move = (x, y) => {
        doMove(x, y)();
        $scope.d.moveInterval = $interval(doMove(x, y), 200);
    }

    $scope.zoom = (dir) => {
        doZoom(dir)();
        $scope.d.zoomInterval = $interval(doZoom(dir), 200);
    }

    $scope.stopZoom = () => {
        if (angular.isDefined($scope.d.zoomInterval)) {
            $interval.cancel($scope.d.zoomInterval);
        }
    }

    $scope.stopMove = () => {
        if (angular.isDefined($scope.d.moveInterval)) {
            $interval.cancel($scope.d.moveInterval);
        }
    }

    var getScale = () => {
        var xscale = IMG_SIZE / $scope.d.img.width;
        var yscale = IMG_SIZE / $scope.d.img.height;
        return Math.max(xscale, yscale);
    }

    $scope.uploadPicture = () => {
        $scope.imgUploadForm.$$element[0].photo.addEventListener("change", () => {
            if ($scope.imgUploadForm.$$element[0].photo.files && $scope.imgUploadForm.$$element[0].photo.files.length > 0) {
                var blob = URL.createObjectURL($scope.imgUploadForm.$$element[0].photo.files[0]);
                var img = new Image();
                img.onload = () => {
                    $scope.$apply(() => {
                        console.log("image loaded");
                        $scope.d.img = img;
                        $scope.d.imageUploaded = true;
                        var canvas = angular.element("#imgCanvas")[0];
                        var img_x = img.width;
                        var img_y = img.height;
                        $scope.d.sx = 0;
                        $scope.d.sy = 0;
                        $scope.d.sw = img_x;
                        $scope.d.sh = img_y;
                        $scope.d.resize = getScale();
                        // console.log($scope.d.sx, $scope.d.sy, $scope.d.sw, $scope.d.sh);
                        if (img_x > img_y) {
                            $scope.d.sx = (img_x * $scope.d.resize - IMG_SIZE) / 2;
                            $scope.d.sw -= (img_x * $scope.d.resize - IMG_SIZE);
                        } else {
                            $scope.d.sy = (img_y * $scope.d.resize - IMG_SIZE) / 2;
                            $scope.d.sh -= (img_y * $scope.d.resize - IMG_SIZE);
                        }
                        var ctx = canvas.getContext("2d");
                        ctx.drawImage(img, $scope.d.sx, $scope.d.sy, $scope.d.sw, $scope.d.sh, 0, 0, IMG_SIZE, IMG_SIZE);
                        // console.log(img_x, img_y, $scope.d.sx, $scope.d.sy, $scope.d.sw, $scope.d.sh);
                        $scope.d.zoom = 10 / $scope.d.resize;
                    });
                }
                img.src = blob;
            }
        }, false)
        $scope.imgUploadForm.$$element[0].photo.click();
    }

    $scope.submit = () => {
        var canvas = angular.element("#imgCanvas")[0];
        canvas.toBlob(function(blob) {
            console.log(blob);
            $http.post("/api/blob", blob, {
                    headers: {
                        'Content-Type': undefined
                    }
                })
                .then(function(response) {
                    var data = response.data;
                    var status = response.status;
                    var statusText = response.statusText;
                    var headers = response.headers;
                    var config = response.config;
                    console.log("Success", status);
                }).catch(function(errorResponse) {
                    console.error("Error", errorResponse);
                });
        })
    }

});