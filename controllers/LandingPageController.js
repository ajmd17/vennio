app.controller('LandingPageController', function($scope, $location, Auth, LoggedUser) {
    var $loginModalContent = $('#login-modal-content');
        
    var loginModal = new Modal('Log In', $loginModalContent, [], {
        show: function() {
        },
        hide: function() {
        }
    });

    Auth.getAuth().$onAuthStateChanged(function(user) {
        if (user !== undefined && user !== null) {
            Auth.handleLogin(user, function() {
                // hide the login modal
                loginModal.hide();

                // redirect to home page
                $location.path('/home/' + Auth.getUser().key);
                $scope.isSignedIn = true;
                $scope.$apply();
            });
        }
    });

    $scope.loginWithGoogle = function() {
        Auth.getAuth().$signInWithPopup(new firebase.auth.GoogleAuthProvider())
            .then(function(res) {
                Auth.handleLogin(res.user, function() {
                    // hide the login modal
                   /* loginModal.hide();

                    // redirect to home
                    $scope.isSignedIn = true;
                    $location.path('/home/' + Auth.getUser().key);*/
                });
            }).catch(function(err) {
                window.alert(err.toString());
            });
    };

    $scope.loginWithFacebook = function() {
        Auth.getAuth().$signInWithPopup(new firebase.auth.FacebookAuthProvider())
            .then(function(res) {
                Auth.handleLogin(res.user, function() {
                    // hide the login modal
                   /* loginModal.hide();

                    // redirect to home
                    $scope.isSignedIn = true;
                    $location.path('/home/' + Auth.getUser().key);*/
                });
            }).catch(function(err) {
                window.alert(err.toString());
            });
    };

    $scope.showLoginModal = function() {
        // show login modal 
        loginModal.show();
    };

    var canvas = null;
    var ctx    = null;
    var timer  = null;
    var background = null;
    var parallaxVelocity = 0;
    var parallaxOffset   = { x: 0, y: 0 };
    var parallaxOffsetDest = { x: 0, y: 0 };
    var lastMouse = null;

    // circles used to set up the actual objects
    // that will be rendered on the screen.
    // x and y will be multiplied by the viewport size
    var circleInfo = [
        {x: 0.7, y: 0.21, radius: 60, color: '#E6E273'},
        {x: 0.1, y: 0.55, radius: 55, color: '#EC514B'},
        {x: 0.8, y: 0.75, radius: 70, color: '#914A78'},
        {x: 0.2, y: 0.24, radius: 34, color: '#409EEC'},
        {x: 0.16, y: 0.85, radius: 50, color: '#33A059'},
    ];

    // the circles that are currently on the screen
    var circles = [];

    function Circle(x, y, radius, color) {
        this.initialX = x;
        this.initialY = y;
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.color = color;

        this.time = randRange(30, 60);
        this.angle = Math.random() * 2 * Math.PI;
        this.rotationRadius = 1.0 + Math.random() * 9.0;
        this.incrementer = (0.01 + Math.random() * 0.1) * Math.sign(Math.random() - 0.5);
    }

    Circle.prototype.update = function() {

    };

    Circle.prototype.draw = function() {
        ctx.beginPath();
        ctx.arc((this.x) * canvas.width + parallaxOffset.x, 
            (this.y ) * canvas.height + parallaxOffset.y, 
            (canvas.width > 600 ? (this.radius * 1.4) : (this.radius * (canvas.width / 600))), 
            0, 2 * Math.PI);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.strokeStyle = this.color;
        ctx.stroke();
    };

    $(function() {
        canvas = document.getElementById('bg-canvas');
        ctx    = canvas.getContext('2d');

        background = new Image();
        background.src = 'img/poly-green.png';

        resizeCanvas();

        // create all circles
        for (var i = 0; i < circleInfo.length; i++) {
            circles.push(new Circle(circleInfo[i].x, circleInfo[i].y, circleInfo[i].radius, circleInfo[i].color));
        }

        loop();

        //$(window).resize(resizeCanvas);
        $(window).mousemove(function(e) {
            if (lastMouse !== null) {
                parallaxOffsetDest.x = Math.sign(e.clientX - (canvas.width/2)) * 20;
                parallaxOffsetDest.y = Math.sign(e.clientY - (canvas.height/2)) * 20;
            }

            lastMouse = { 
                x: e.clientX, 
                y: e.clientY 
            };
        });
    });

    function resizeCanvas() {
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;
    }

    function loop() {
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;
        drawImageProp(background);

        var width  = canvas.width  || 1;
        var height = canvas.height || 1;

        parallaxOffset.x = Math.lerp(parallaxOffset.x, parallaxOffsetDest.x, 0.04);
        parallaxOffset.y = Math.lerp(parallaxOffset.y, parallaxOffsetDest.y, 0.04);

        for (var i = 0; i < circles.length; i++) {
            (function(circle) {

                circle.angle += circle.incrementer;

                circle.x = circle.initialX + ((circle.rotationRadius * Math.cos(circle.angle)) / width);
                circle.y = circle.initialY + ((circle.rotationRadius * Math.sin(circle.angle)) / height);

                if (circle.time <= 0) {
                    circle.time = randRange(50, 150);
                    circle.incrementer = (0.01 + Math.random() * 0.1) * Math.sign(Math.random() - 0.5);
                }

                if (circle.angle >= Math.PI * 2) {
                    circle.angle = 0;
                }

                circle.time--;

                // draw the circle
                circle.draw();

            })(circles[i]);
        }

        timer = window.setTimeout(loop, 45);
    }

    function drawImageProp(img, x, y, w, h, offsetX, offsetY) {
        if (arguments.length === 1) {
            x = y = 0;
            w = canvas.width;
            h = canvas.height;
        }

        /// default offset is center
        offsetX = typeof offsetX === 'number' ? offsetX : 0.5;
        offsetY = typeof offsetY === 'number' ? offsetY : 0.5;

        /// keep bounds [0.0, 1.0]
        if (offsetX < 0) offsetX = 0;
        if (offsetY < 0) offsetY = 0;
        if (offsetX > 1) offsetX = 1;
        if (offsetY > 1) offsetY = 1;

        var iw = img.width,
            ih = img.height,
            r = Math.min(w / iw, h / ih),
            nw = iw * r,   /// new prop. width
            nh = ih * r,   /// new prop. height
            cx, cy, cw, ch, ar = 1;

        /// decide which gap to fill    
        if (nw < w) ar = w / nw;
        if (nh < h) ar = h / nh;
        nw *= ar;
        nh *= ar;

        /// calc source rectangle
        cw = iw / (nw / w);
        ch = ih / (nh / h);

        cx = (iw - cw) * offsetX;
        cy = (ih - ch) * offsetY;

        /// make sure source rectangle is valid
        if (cx < 0) cx = 0;
        if (cy < 0) cy = 0;
        if (cw > iw) cw = iw;
        if (ch > ih) ch = ih;

        /// fill image in dest. rectangle
        ctx.drawImage(img, cx, cy, cw, ch,  x, y, w, h);
    }
});