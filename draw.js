const INTERVAL = 25;
const G = 0.5;
const FORCE_SCALE = 7;
const MAX_PARTICLES = 20;

let painter;
let canvas;
let center;
let mouseMass;

function Particle(x, y, velocity, mass, radius, particles) {
    this.position = new Vector(x, y);
    this.velocity = velocity;
    this.mass = mass;
    this.radius = radius;
    this.particles = particles;
    this.forces = [];
    this.update = (interval) => {
        let forceSum = new Vector(0, 0);
        this.forces = [];
        for (let particle of this.particles) {
            if (particle !== this) {
                let r = this.position.sum(particle.position.product(-1));
                let force = r.getVersor().product(-1).product(G * this.mass * particle.mass / Math.pow(r.getMagnitude(), 2));
                this.forces.push(force);
                forceSum = forceSum.sum(force);
            }
        }
        let acceleration = forceSum.product(1.0 / this.mass);
        this.velocity = this.velocity.sum(acceleration.product(interval / 1000));
        let tempPosition = this.position.sum(this.velocity.product(interval / 1000));
        for (let particle of this.particles) {
            if (particle !== this) {
                if (tempPosition.distance(particle.position) < this.radius + particle.radius) {
                    tempPosition = tempPosition.sum(tempPosition.sum(particle.position.product(-1)).getVersor().product(-tempPosition.distance(particle.position) + this.radius + particle.radius));
                    let momentum = this.velocity.product(this.mass).sum(particle.velocity.product(particle.mass));
                    this.velocity = momentum.product(1.0 / (this.mass + particle.mass));
                    particle.velocity = this.velocity;
                }
            }
        }
        this.position = tempPosition;
    };
    this.paint = () => {
        painter.beginPath();
        painter.arc(this.position.x + center.x, this.position.y + center.y, this.radius, 0, 2 * Math.PI);
        painter.fill();
        painter.closePath();
        for (let force of this.forces) {
            painter.drawArrow(this.position.sum(center), this.position.sum(center).sum(force.product(FORCE_SCALE)));
        }
        painter.stroke();
    };
}


function Vector(x, y, z) {
    this.x = x;
    this.y = y;
    if (z !== undefined) {
        this.z = z;
    } else {
        this.z = 0;
    }
    
    this.getMagnitude = () => {
        return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2) + Math.pow(this.z, 2));
    };
    this.getVersor = () => {
        return new Vector(this.x / this.getMagnitude(), this.y / this.getMagnitude(), this.z / this.getMagnitude());
    };
    this.scalarProduct = (vector) => {
        return this.x * vector.x + this.y * vector.y + this.z * vector.z;
    };
    this.vectorProduct = (vector) => {
        return new Vector(this.y * vector.z - this.z * vector.y,
                          this.z * vector.x - this.x * vector.z,
                          this.x * vector.y - this.y * vector.x);
    };
    this.product = (value) => {
        return new Vector(this.x * value, this.y * value, this.z * value);
    };
    this.sum = (vector) => {
        return new Vector(this.x + vector.x, this.y + vector.y, this.z + vector.z);
    };
    this.distance = (vector) => {
        return vector.sum(this.product(-1)).getMagnitude();
    };
}

function updateMousePosition(e) {
    mouseMass.position.x = e.clientX - center.x;
    mouseMass.position.y = e.clientY - center.y;
}

let particles = [];

function init() {
    canvas = document.getElementById("painting");
    canvas.setAttribute("width", window.innerWidth);
    canvas.setAttribute("height", window.innerHeight);
    canvas.setAttribute("onmousemove", "updateMousePosition(event)");
    document.addEventListener("keydown", e => e.key === 's' && cannon());
    painter = document.getElementById("painting").getContext("2d");
    center = new Vector(canvas.width / 2, canvas.height / 2);
    painter.drawArrow = drawArrow;
    mouseMass = new Particle(0, 0, new Vector(0, 0), 1000, 50);
    mouseMass.update = () => { };
    particles.push(mouseMass);
    
    requestAnimationFrame(refreshCanvas);
    for (let i = 0; i < .1 * MAX_PARTICLES; i++) {
        cannon();
    }
}

function refreshCanvas() {
    for (let particle of particles) {
        particle.update(1000);
    }
    
    painter.clearRect(0, 0, canvas.width, canvas.height);
    
    for (let particle of particles) {
        particle.paint();
    }
    
    painter.stroke();

    requestAnimationFrame(refreshCanvas);
}

function cannon() {
    let particle = new Particle(Math.random() * 2 * center.x - center.x, Math.random() * 2 * center.y - center.y, new Vector(Math.random() * 3 - 1.5, Math.random() * 3 - 1.5), Math.random() * 400 + 50, Math.random() * 50 + 10);
    particle.particles = particles;
    if (particles.length < MAX_PARTICLES) {
        particles.push(particle);
    }
}

function drawArrow(from, to) {
    const ARROW_ANGLE = Math.PI / 6;
    const strokeStyle = painter.strokeStyle;
    painter.strokeStyle = "#AFAFAF";
    
    painter.moveTo(from.x, from.y);
    painter.lineTo(to.x, to.y);
    let angle = Math.atan2(to.y - from.y, to.x - from.x);
    let angleOffset = ARROW_ANGLE;
    let length = to.sum(from.product(-1)).getMagnitude() / 10;
    painter.moveTo(to.x, to.y);
    painter.lineTo(to.x - length * Math.cos(angle + angleOffset), to.y - length * Math.sin(angle + angleOffset));
    painter.moveTo(to.x, to.y);
    painter.lineTo(to.x - length * Math.cos(angle - angleOffset), to.y - length * Math.sin(angle - angleOffset));
}
