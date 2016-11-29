app.factory('Auth', function($firebaseAuth, $firebaseObject, Extensions) {
    var auth = $firebaseAuth();
    var db   = new firebase.database();

    var Auth = {
        loggedUser: null,

        getAuth: function() {
            return auth;
        },

        getDatabase: function() {
            return db;
        },

        getUser: function() {
            return this.loggedUser;
        },

        isSignedIn: function() {
            return this.loggedUser !== null;
        },

        handleLogin: function(user, callback) {
            var usersRef = db.ref('/users');
            usersRef.once('value').then((snapshot) => {
                var foundUser = snapshotHasProperty(snapshot, { 
                    uid: user.uid 
                });

                if (!foundUser) {
                    this.loggedUser = this.addNewUser(user.uid, user.displayName, usersRef);
                } else {
                    this.loggedUser = foundUser;
                }

                callback();
            });
        },

        addNewUser: function(uid, displayName, ref) {
            var user = {
                uid:   uid,
                name:  displayName,
                theme: Extensions.builtinThemes['poly_green'] /* default theme */,
                projects: { },
                viewport: {
                    zoom: 1.0,
                    zoomLevel: 0,
                    left: 0,
                    top: 0
                }
            };

            var userRef = ref.push(user);
            user.key = userRef.key;
            return user;
        }
    };

    return Auth;
})