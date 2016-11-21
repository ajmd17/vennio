var canvas = null;
var ctx    = null;
var timer  = null;
var background = null;
var parallaxVelocity = { x: 0, y: 0 }; 
var parallaxOffset   = { x: 0, y: 0 };
var lastMouse = null;

var circleInfo = [
    {
        x: 0.7,
        y: 0.21,
        radius: 60,
        color: "#E6E273"
    },
    {
        x: 0.1,
        y: 0.55,
        radius: 55,
        color: "#E68373"
    },
    {
        x: 0.8,
        y: 0.75,
        radius: 90,
        color: "#4E7993"
    },
    {
        x: 0.2,
        y: 0.24,
        radius: 34,
        color: "#FFAD6B"
    },
    {
        x: 0.16,
        y: 0.85,
        radius: 50,
        color: "#7D9EB1"
    },
];

var circles = [];

function Circle(x, y, radius, color) {
    this.initialX = x;
    this.initialY = y;
    this.x = x;
    this.y = y;
    this.radius = radius;
    this.color = color;

    this.time = randRange(50, 150);
    this.angle = Math.random() * 2 * Math.PI;
    this.rotationRadius = 1.0 + Math.random() * 4.0;
    this.incrementer = 0.01 + Math.random() * 0.1;
}

Circle.prototype.update = function() {

};

Circle.prototype.draw = function() {
    ctx.beginPath();
    ctx.arc((this.x + parallaxOffset.x) * canvas.width, 
        (this.y + parallaxOffset.y) * canvas.height, 
        (canvas.width > 600 ? (this.radius * 1.4) : (this.radius * (canvas.width / 600))), 
        0, 
        2 * Math.PI);
    ctx.fillStyle = this.color;
    ctx.fill();
    ctx.strokeStyle = this.color;
    ctx.stroke();
};

$(function() {
    canvas = document.getElementById("bg-canvas");
    ctx    = canvas.getContext("2d");

    background = new Image();
    background.src = "../img/poly-green.png";

    resizeCanvas();

    // create all circles
    for (var i = 0; i < circleInfo.length; i++) {
        circles.push(
            new Circle(circleInfo[i].x, circleInfo[i].y, circleInfo[i].radius, circleInfo[i].color));
    }

    loop();

    //$(window).resize(resizeCanvas);
    $(window).mousemove(function(e) {
        if (lastMouse !== null) {
            parallaxVelocity.x = (lastMouse.x - (e.pageX)) - ((lastMouse.x - (e.pageX))/2);
            parallaxVelocity.y = (lastMouse.y - (e.pageY)) - ((lastMouse.y - (e.pageY))/2);  
        }

        lastMouse = { 
            x: e.pageX, 
            y: e.pageY 
        };
    });
});

function resizeCanvas() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
}

function loop() {
    //var $pageHead = $("#page-head");
    canvas.width  = window.innerWidth;//$pageHead.width();
    canvas.height = window.innerHeight;//$pageHead.height();
    // fill background
    //ctx.fillStyle = "#3E454C";
    //ctx.fillRect(0, 0, canvas.width, canvas.height);
    drawImageProp(background);

    var width  = canvas.width  || 1;
    var height = canvas.height || 1;

    // update parallax
    if (Math.abs(parallaxVelocity.x) > 0.005) {
        parallaxOffset.x += Math.sign(parallaxVelocity.x) * 0.5 / width;
        parallaxVelocity.x *= 0.1;
    }
    if (Math.abs(parallaxVelocity.y) > 0.005) {
        parallaxOffset.y += Math.sign(parallaxVelocity.y) * 0.5 / height;
        parallaxVelocity.y *= 0.1;
    }

    for (var i = 0; i < circles.length; i++) {
        (function(circle) {

            circle.angle += circle.incrementer;

            circle.x = circle.initialX + ((circle.rotationRadius * Math.cos(circle.angle)) / width);
            circle.y = circle.initialY + ((circle.rotationRadius * Math.sin(circle.angle)) / height);

            if (circle.time <= 0) {
                circle.time = randRange(50, 150);
                circle.incrementer = 0.01 + Math.random() * 0.1;
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