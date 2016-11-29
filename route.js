var app = angular.module('vennio', [
    'ngRoute',
    'firebase'
])
.config(function($routeProvider) {
    $routeProvider.when('/', {
        templateUrl: 'landing.html',
        controller: 'LandingPageController',
        resolve: {
            LoggedUser: function(Auth) {
                return Auth.loggedUser;
            }
        }
    }).when('/home', {
        templateUrl: 'main.html',
        controller: 'HomeController',
        resolve: {
            AuthWaitForSignIn: function(Auth) {
                return Auth.getAuth().$waitForSignIn();
            }
        }
    }).otherwise('/');
})
.controller('MainController', function($scope) {

});