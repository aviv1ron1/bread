"use strict";

var isLoggedInInitialy = false;
var initialUser = null;
var initialPermission = true;

$.ajax({
        url: "/api/login",
        method: "GET"
    }).done((data) => {
        console.log("login success");
        isLoggedInInitialy = true;
        initialUser = data.user;
        initialPermission = data.permission;
    })
    .fail(() => {
        console.error("login failed");
    })
    .always(() => {
        angular.element(function() {
            angular.bootstrap(document, ['app']);
        });
    });

var app = angular.module("app", ['ngRoute', 'ngResource']);

app.factory('auth', function($q) {
    var data = {
        isLoggedIn: isLoggedInInitialy,
        user: initialUser,
        permission: initialPermission
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
        setLogin: function(user, permission) {
            data.isLoggedIn = true;
            data.user = user;
            data.permission = permission;
            qArr.forEach(q => {
                q(true);
            });
            qArr = [];
        },
        logout: function() {
                data.isLoggedIn = false;
                data.user = null;
                data.permission = null;
            } //,
            //isReadOnly: data.permission == "read"
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
                templateUrl: 'pages/login.html'
            })
            // .when('/ages', {
            //     templateUrl: "pages/ages.html",
            //     controller: "agesController",
            //     reloadOnSearch: false,
            //     resolve: {
            //         data: function(hayalFactory, $route) {
            //             return hayalFactory.ages().$promise;
            //         }
            //     }
            // })
            .otherwise({
                redirectTo: '/'
            });
    }
]);