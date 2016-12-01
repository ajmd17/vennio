var app = angular.module('vennio', [
    'ngRoute',
    'firebase'
]).controller('MainController', function($scope) {
}).config(function($routeProvider) {
    $routeProvider.when('/', {
        templateUrl: 'landing.html',
        controller: 'LandingPageController',
        resolve: {
            LoggedUser: function(Auth) {
                return Auth.loggedUser;
            }
        }
    }).when('/home/:project*?', {
        templateUrl: 'main.html',
        controller: 'HomeController',
        resolve: {
            AuthWaitForSignIn: function(Auth) {
                return Auth.getAuth().$waitForSignIn();
            }
        }
    }).otherwise({
        templateUrl: '404.html'
    });
});