angular.module("app").factory("loginFactory", ['$resource', function($resource) {
    return $resource('/api/identity/', {}, {
        login: {
        	method: "POST",
        	url: "/api/identity/login"
        },
        isLoggedIn: {
        	method: "GET",
        	url: "/api/identity/login"
        },
        logout: {
            method: "DELETE",
            url: "/api/identity/logout"
        },
        register: {
            method: "POST",
            url: "/api/identity/register"
        }
    })
}]);