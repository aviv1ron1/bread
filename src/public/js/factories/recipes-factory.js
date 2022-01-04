angular.module("app").factory("recipesFactory", ['$resource', function($resource) {
    return $resource('/api/bread/:id', {}, {
        times: {
        	method: "get",
        	url: "/api/bread/:id/times"
        },
        weights: {
        	method: "get",
        	url: "/api/bread/:id/weight",
        	isArray: true
        }
    })
}]);