angular.module("app").factory("tagsFactory", ['$resource', function($resource) {
    return $resource('/api/tags/:id', {}, {
        // times: {
        // 	method: "get",
        // 	url: "/api/bread/:id/times"
        // },
        // weights: {
        // 	method: "get",
        // 	url: "/api/bread/:id/weight",
        // 	isArray: true
        // }
    })
}]);