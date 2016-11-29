var loggedUser = null;

var auth = null;
var database = null;

$(document).ready(function() {
    auth = new firebase.auth();
    database = new firebase.database();

    auth.onAuthStateChanged(function(user) {
        handleLogin(user);
    });

    $('.social-login-google').click(function() {
        signInWithGoogle(auth, database);
    });

    $('.social-login-twitter').click(function() {
        signInWithTwitter(auth, database);
    });
});

function signInWithGoogle(auth, database) {
    signIn(auth, database, new firebase.auth.GoogleAuthProvider());
}

function signInWithTwitter(auth, database) {
    signIn(auth, database, new firebase.auth.TwitterAuthProvider());
}

function signIn(auth, database, provider) {
    auth.signInWithPopup(provider).then(function(result) {
        handleLogin(result.user);
    }).catch(function(error) {
        alert(error.toString());
    });
}

function handleLogin(user) {
    var usersRef = database.ref('/users');

    usersRef.once('value').then(function(snapshot) {
        var firstLogin = loggedUser === null;

        var foundUser = snapshotHasProperty(snapshot, { uid: user.uid });
        if (!foundUser) {
            loggedUser = addNewUser(user.uid, user.displayName, usersRef);
        } else {
            loggedUser = foundUser;
        }

        if (firstLogin) {
            afterLogin();
        }
    });
}

function addNewUser(uid, displayName, ref) {
    var user = {
        uid:   uid,
        name:  displayName,
        theme: BUILTIN_THEMES.poly_green /* default theme */,
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

