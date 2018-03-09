
// GameBoard code below4
var socket = io.connect("http://24.16.255.56:8888");

socket.on("load", function (data) {
    for (var i = 0; i < gameEngine.entities.length; i++) {
        gameEngine.entities[i].removeFromWorld = true;
    }
    var json = JSON.parse(data.data);
    json.forEach(function (circle) {
        if (circle !== null) {
          var ent = new Circle(gameEngine);
          console.log(circle);
          ent.player = 1;
          ent.radius = 20;
          ent.visualRadius = 500;
          ent.colors = ["Red", "Green", "Blue", "White"];
          if (circle.color === 1) {
              ent.setGreen();
          }
          ent.color = circle.color;
          ent.it = circle.it;
          ent.x = circle.x;
          ent.y = circle.y;
          ent.velocity = { x: Math.random() * 1000, y: Math.random() * 1000 };
          gameEngine.addEntity(ent);
      }
    });
});

function save() {
    var circles = [];
    ents = JSON.stringify(gameEngine.entities, function (key, value) {
        if (typeof value === 'object' && value !== null) {
            if (circles.indexOf(value) !== -1) {
                return;
            }
            circles.push(value);
        }
        return value;
    });
    console.log(ents);
    circles = null;
    socket.emit("save", {studentname: "Marshall Freed", statename: "state", data: ents});
}

function load() {
    socket.emit("load", {studentname: "Marshall Freed", statename: "state"});
}

function distance(a, b) {
    var dx = a.x - b.x;
    var dy = a.y - b.y;
    return Math.sqrt(dx * dx + dy * dy);
}

function Circle(game) {
    this.player = 1;
    this.radius = 20;
    this.visualRadius = 500;
    this.colors = ["Red", "Green", "Blue", "White"];
    this.setNotIt();
    Entity.call(this, game, this.radius + Math.random() * (800 - this.radius * 2), this.radius + Math.random() * (800 - this.radius * 2));

    this.velocity = { x: Math.random() * 1000, y: Math.random() * 1000 };
    var speed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
    if (speed > maxSpeed) {
        var ratio = maxSpeed / speed;
        this.velocity.x *= ratio;
        this.velocity.y *= ratio;
    }
};

Circle.prototype = new Entity();
Circle.prototype.constructor = Circle;

Circle.prototype.setIt = function () {
    this.it = true;
    this.color = 2;
    this.visualRadius = 500;
};

Circle.prototype.setNotIt = function () {
    this.it = false;
    this.color = 3;
    this.visualRadius = 200;
};

Circle.prototype.setGreen = function () {
    this.green = true;
    this.color = 1;
    this.visualRadius = 200;
}

Circle.prototype.collide = function (other) {
    return distance(this, other) < this.radius + other.radius;
};

Circle.prototype.collideLeft = function () {
    return (this.x - this.radius) < 0;
};

Circle.prototype.collideRight = function () {
    return (this.x + this.radius) > 800;
};

Circle.prototype.collideTop = function () {
    return (this.y - this.radius) < 0;
};

Circle.prototype.collideBottom = function () {
    return (this.y + this.radius) > 800;
};

Circle.prototype.update = function () {
    Entity.prototype.update.call(this);
 //  console.log(this.velocity);

    this.x += this.velocity.x * this.game.clockTick;
    this.y += this.velocity.y * this.game.clockTick;

    if (this.collideLeft() || this.collideRight()) {
        this.velocity.x = -this.velocity.x * friction;
        if (this.collideLeft()) this.x = this.radius;
        if (this.collideRight()) this.x = 800 - this.radius;
        this.x += this.velocity.x * this.game.clockTick;
        this.y += this.velocity.y * this.game.clockTick;
    }

    if (this.collideTop() || this.collideBottom()) {
        this.velocity.y = -this.velocity.y * friction;
        if (this.collideTop()) this.y = this.radius;
        if (this.collideBottom()) this.y = 800 - this.radius;
        this.x += this.velocity.x * this.game.clockTick;
        this.y += this.velocity.y * this.game.clockTick;
    }

    for (var i = 0; i < this.game.entities.length; i++) {
        var ent = this.game.entities[i];
        if (ent !== this && this.collide(ent)) {
            var temp = { x: this.velocity.x, y: this.velocity.y };

            var dist = distance(this, ent);
            var delta = this.radius + ent.radius - dist;
            var difX = (this.x - ent.x)/dist;
            var difY = (this.y - ent.y)/dist;

            this.x += difX * delta / 2;
            this.y += difY * delta / 2;
            ent.x -= difX * delta / 2;
            ent.y -= difY * delta / 2;

            this.velocity.x = ent.velocity.x * friction;
            this.velocity.y = ent.velocity.y * friction;
            ent.velocity.x = temp.x * friction;
            ent.velocity.y = temp.y * friction;
            this.x += this.velocity.x * this.game.clockTick;
            this.y += this.velocity.y * this.game.clockTick;
            ent.x += ent.velocity.x * this.game.clockTick;
            ent.y += ent.velocity.y * this.game.clockTick;
            if (this.it) {
                if (ent.green) {
                    this.setNotIt();
                } else {
                //this.setNotIt();
                    ent.setIt();
                }
            }
            else if (ent.it) {
                if (this.green) {
                    ent.setNotIt();
                } else {
                    this.setIt();
                //ent.setNotIt();
                }
            }
        }

        if (ent != this && this.collide({ x: ent.x, y: ent.y, radius: this.visualRadius })) {
            var dist = distance(this, ent);
            // this is what makes the thing that's it chase the ones that aren't
            if (this.it && !ent.green && dist > this.radius + ent.radius + 10) {
                var difX = (ent.x - this.x)/dist;
                var difY = (ent.y - this.y)/dist;
                this.velocity.x += difX * acceleration / (dist*dist);
                this.velocity.y += difY * acceleration / (dist * dist);
                var speed = Math.sqrt(this.velocity.x*this.velocity.x + this.velocity.y*this.velocity.y);
                if (speed > maxSpeed) {
                    var ratio = maxSpeed / speed;
                    this.velocity.x *= ratio;
                    this.velocity.y *= ratio;
                }
            }

            if (this.green && ent.it && dist > this.radius + ent.radius + 10) {
                var difX = (ent.x - this.x)/dist;
                var difY = (ent.y - this.y)/dist;
                this.velocity.x += difX * acceleration / (dist*dist);
                this.velocity.y += difY * acceleration / (dist * dist);
                var speed = Math.sqrt(this.velocity.x*this.velocity.x + this.velocity.y*this.velocity.y);
                if (speed > maxSpeed) {
                    var ratio = maxSpeed / speed;
                    this.velocity.x *= ratio;
                    this.velocity.y *= ratio;
                }
            }

            if (ent.it && !this.green && dist > this.radius + ent.radius) {
                var difX = (ent.x - this.x) / dist;
                var difY = (ent.y - this.y) / dist;
                this.velocity.x -= difX * acceleration / (dist * dist);
                this.velocity.y -= difY * acceleration / (dist * dist);
                var speed = Math.sqrt(this.velocity.x * this.velocity.x + this.velocity.y * this.velocity.y);
                if (speed > maxSpeed) {
                    var ratio = maxSpeed / speed;
                    this.velocity.x *= ratio;
                    this.velocity.y *= ratio;
                }
            }
        }
    }

    var noneIt = true;
    for (var i = 0; i < this.game.entities.length; i++) {
        var ent = this.game.entities[i];
        if (ent.it) {
            noneIt = false;
        }
    }

    while (noneIt) {
        var random = Math.floor(Math.random() * 19);
        if (!this.game.entities[random].green) {
            this.game.entities[random].setIt();
            noneIt = false;
        }
    }




    this.velocity.x -= (1 - friction) * this.game.clockTick * this.velocity.x;
    this.velocity.y -= (1 - friction) * this.game.clockTick * this.velocity.y;
};

Circle.prototype.draw = function (ctx) {
    ctx.beginPath();
    ctx.fillStyle = this.colors[this.color];
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, false);
    ctx.fill();
    ctx.closePath();

};


var friction = 1;
var acceleration = 1000000;
var maxSpeed = 200;
var gameEngine = new GameEngine();

window.onload = function () {
    console.log("starting up da sheild");
    var canvas = document.getElementById('gameWorld');
    var ctx = canvas.getContext('2d');

    var circle = new Circle(gameEngine);
    circle.setIt();
    gameEngine.addEntity(circle);
    gameEngine.addEntity(circle);
    circle = new Circle(gameEngine);
    circle.setGreen();
    gameEngine.addEntity(circle);
    circle = new Circle(gameEngine);
    circle.setGreen();
    gameEngine.addEntity(circle);
    for (var i = 0; i < 20; i++) {
        circle = new Circle(gameEngine);
        gameEngine.addEntity(circle);
    }
    gameEngine.init(ctx);
    gameEngine.start();

    socket.on("connect", function () {
        console.log("Connected.");
    });

    socket.on("disconnect", function () {
        console.log("Disconnected.");
    });

    socket.on("reconnect", function () {
        console.log("Reconnected.");
    });

};
