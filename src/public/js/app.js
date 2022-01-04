"use strict";

var isLoggedInInitialy = false;
var initialUser = null;
var initialPermission = true;

$.ajax({
        url: "/api/identity/login",
        method: "GET"
    }).done((data) => {
        console.log("login success");
        isLoggedInInitialy = true;
        initialUser = data;
    })
    .fail(() => {
        console.error("login failed");
    })
    .always(() => {
        angular.element(function() {
            angular.bootstrap(document, ['app']);
        });
    });

var app = angular.module("app", ['ngRoute', 'ngResource', 'ngAnimate']);

app.factory('auth', function($q) {
    var data = {
        isLoggedIn: isLoggedInInitialy,
        user: initialUser
    }

    var qArr = [];

    return {
        isLoggedIn: function() {
            return data.isLoggedIn;
        },
        waitLogin: function() {
            return $q((resolve, reject) => {
                if (data.isLoggedIn) {
                    resolve(true);
                } else {
                    qArr.push(resolve);
                }
            });
        },
        getData: function() {
            return data;
        },
        setLogin: function(user) {
            data.isLoggedIn = true;
            data.user = user;
            qArr.forEach(q => {
                q(true);
            });
            qArr = [];
        },
        logout: function() {
            data.isLoggedIn = false;
            data.user = null;
        }
    }
});

app.service('authInterceptor', function($q, $location, auth) {
        var service = this;

        service.responseError = function(response) {
            if (response.status == 401 && auth.isLoggedIn()) {
                auth.logout();
                //$location.path("/login");
            }
            return $q.reject(response);
        };
    })
    .config(['$httpProvider', function($httpProvider) {
        $httpProvider.interceptors.push('authInterceptor');
    }])

// app.run(['$rootScope', '$location', 'auth', function($rootScope, $location, auth) {
//     $rootScope.$on('$routeChangeStart', function(event) {
//         if ($location.path() == "/login") {
//             return;
//         }
//         if (!auth.isLoggedIn()) {
//             event.preventDefault();
//             $location.path('/login');
//         }
//     });
// }]);

app.config(['$routeProvider',
    function($routeProvider) {
        $routeProvider
            .when('/', {
                templateUrl: "pages/recipes.html",
                controller: "recipesController",
                reloadOnSearch: false,
                resolve: {
                    data: function(recipesFactory) {
                        return recipesFactory.query().$promise;
                    }
                }
            })
            .when('/recipe/:id', {
                templateUrl: "pages/recipe.html",
                controller: "recipeController",
                reloadOnSearch: false,
                resolve: {
                    data: function(recipesFactory, $route) {
                        return recipesFactory.get({
                            id: $route.current.params.id
                        }).$promise;
                    }
                }
            })
            .when('/login', {
                templateUrl: 'pages/login.html',
                controller: "loginController"
            })
            .when('/register', {
                templateUrl: 'pages/register.html',
                controller: "registerController"
            })
            .when('/postregister', {
                templateUrl: 'pages/post-register.html'
            })
            .when('/verified', {
                templateUrl: 'pages/verified.html'
            })
            .when('/create', {
                templateUrl: 'pages/new-recipe.html',
                controller: "newRecipeController",
                resolve: {
                    popularTags: (tagsFactory, $route) => {
                        return tagsFactory.query().$promise;
                    }
                }
            })
            .otherwise({
                redirectTo: '/'
            });
    }
]);