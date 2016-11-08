var loggedUser = {};

var auth = null;
var database = null;

$(document).ready(function() {
    var config = {
        apiKey: "AIzaSyCf8zuhDihw-N4GEQdY-JvDilqj8iOkds0",
        authDomain: "vixen-a6ff1.firebaseapp.com",
        databaseURL: "https://vixen-a6ff1.firebaseio.com",
        storageBucket: "",
        messagingSenderId: "277084801664"
    };
    firebase.initializeApp(config);

    auth = new firebase.auth();
    database = new firebase.database();

    $(".social-login-google").click(function() {
        signInWithGoogle(auth, database);
    });

    $(".social-login-twitter").click(function() {
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
        var usersRef = database.ref("/users");
        var token = result.credential.accessToken;
        var user = result.user;

        usersRef.once("value").then(function(snapshot) {
            var foundUser = snapshotHasProperty(snapshot, { "uid": result.user.uid });
            if (!foundUser) {
                loggedUser = addNewUser(result, usersRef);
            } else {
                loggedUser = foundUser;
            }

            $("#after-login").show();
            $("#login-window").hide();

            afterLogin();
        });

    }).catch(function(error) {
        alert(error.toString());
    });
}

function addNewUser(result, ref) {
    var user = {
        uid: result.user.uid,
        name:  result.user.displayName,
        currentThemeName: "poly", /* default theme */
        projects: {

        }
    };

    var userRef = ref.push(user);
    user.key = userRef.key;
    return user;
}

// attrib is an object containing the key and value
// of what to search for like so
// { "email": "blahblah@blah.com" }
function snapshotHasProperty(snapshot, attrib) {
    if (!snapshot) {
        return null;
    }

    let snapshotValue = snapshot.val();
    if ((snapshotValue !== undefined && snapshotValue !== null) &&
            Object.keys(snapshotValue).length != 0) {

        let attribKeys = Object.keys(attrib);
        let attribKey = attribKeys[0].toString();
        let attribVal = attrib[attribKey];

        let snapshotKeys = Object.keys(snapshotValue);

        for (let i = 0; i < snapshotKeys.length; i++) {
            let curObject = snapshotValue[snapshotKeys[i]];
            if (curObject[attribKey] == attribVal) {
                curObject.key = snapshotKeys[i];
                return curObject;
            }
        }
    }

    return null;
}
