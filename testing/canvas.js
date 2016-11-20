var canvas = null;
var ctx    = null;
var timer  = null;
var parallaxVelocity = { x: 0, y: 0 }; 
var parallaxOffset   = { x: 0, y: 0 };
var lastMouse = null;

var circleInfo = [
    {
        x: 0.86,
        y: 0.13,
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
        x: 0.9,
        y: 0.88,
        radius: 90,
        color: "#4E7993"
    },
    {
        x: 0.88,
        y: 0.45,
        radius: 30,
        color: "#6ABB47"
    },
    {
        x: 0.32,
        y: 0.13,
        radius: 26,
        color: "#7B539B"
    },
    {
        x: 0.12,
        y: 0.15,
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
        (canvas.width > 600 ? this.radius : (this.radius * (canvas.width / 600))), 
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
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
    // fill background
    ctx.fillStyle = "#3E454C";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

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