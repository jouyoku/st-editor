import { Component, onMount, createSignal } from 'solid-js';
import { Application, Graphics, Text, Point } from './pixi.js'

const SystemMap: Component<{ id: string }> = (props) => {
    const [offset, setOffset] = createSignal({ x: 0, y: 0 });
    const [pos, setPos] = createSignal({ x: 0, y: 0 });
    const [pos0, setPos0] = createSignal({ x: 20, y: 50 });
    const [pos1, setPos1] = createSignal({ x: 20, y: 20 });
    const [posC, setPosC] = createSignal({ x: 0, y: 0 });
    const [app, setApp] = createSignal(null);

    onMount(async () => {
        const canvas = document.getElementById(props.id) as HTMLCanvasElement;
        const app0 = new Application({
            view: canvas,
            resolution: window.devicePixelRatio || 1,
            autoDensity: true,
            backgroundColor: 0xffff80,
            width: 640,
            height: 480
        });
        const rect = canvas.getBoundingClientRect();
        setOffset({ x: rect.x, y: rect.y });

        setApp(app0);
    });

    function getPoint(R: number, angle: number) {
        return new Point(R * Math.cos(angle), R * Math.sin(angle));
    }

    function getAngle(point: Point) {
        if (point.x === 0) {
            if (point.y > 0) {
                return Math.PI * 3 / 2;
            } else {
                return Math.PI / 2;
            }
        }

        let tmp = Math.atan(point.y / point.x);
        if (point.x > 0) {
            if (point.y < 0) {
                tmp = Math.PI * 2 + tmp;
            }
        } else {
            tmp = Math.PI + tmp;
        }
        return tmp;
    }

    function isClockwise(p1: Point, p2: Point, p3: Point) {
        //y = ax + b
        if (p3.x === p1.x) {
            return !((p1.y > p3.y) != (p2.x > p1.x));
        }

        let a = (p3.y - p1.y) / (p3.x - p1.x);
        let b = (p3.x * p1.y - p1.x * p3.y) / (p3.x - p1.x);
        return !((p2.y > (a * p2.x + b)) != (p3.x > p1.x));
    }

    function getCircle(p1: Point, p2: Point, p3: Point): { X: number, Y: number, R: number } {
        //https://www.twblogs.net/a/5b7afab12b7177539c24854c
        let e = 2 * (p2.x - p1.x);
        let f = 2 * (p2.y - p1.y);
        let g = p2.x ** 2 - p1.x ** 2 + p2.y ** 2 - p1.y ** 2;

        let a = 2 * (p3.x - p2.x);
        let b = 2 * (p3.y - p2.y);
        let c = p3.x ** 2 - p2.x ** 2 + p3.y ** 2 - p2.y ** 2;

        let X = (g * b - c * f) / (e * b - a * f);
        let Y = (a * g - c * e) / (a * f - b * e);
        let R = Math.sqrt((X - p1.x) * (X - p1.x) + (Y - p1.y) * (Y - p1.y));

        return { X, Y, R };
    }

    function getDAOffset(p1: Point, p3: Point, dA: number): Point {
        let dx = 0;
        let dy = dA;
        if (p3.x != p1.x) {
            let an = getAngle(new Point(p3.x - p1.x, p3.y - p1.y));
            dx = dA * Math.cos(an);
            dy = dA * Math.sin(an);
        } else {
            if (p1.y > p3.y) {
                dy = -dy;
            }
        }

        return new Point(dx, dy);
    }

    function edge(p1: Point, p2: Point, p3: Point, color = 0x000000, directional = false, p3dA = 0, p1dA = 0) {
        let circle = getCircle(p1, p2, p3);
        let X = circle.X;
        let Y = circle.Y;
        let R = circle.R;

        if (R === Infinity || isNaN(R)) {
            let an3 = getAngle(new Point(p3.x - p1.x, p3.y - p1.y));
            let p1O = new Point(p1dA * Math.cos(an3), p1dA * Math.sin(an3));
            if (p3.x === p1.x) {
                p1O.y = - p1O.y;
            }
            let p1o = new Point(p1.x + p1O.x, p1.y + p1O.y);
            let p3O = new Point(p3dA * Math.cos(an3), p3dA * Math.sin(an3));
            if (p3.x === p1.x) {
                p3O.y = - p3O.y;
            }
            let p3o = new Point(p3.x - p3O.x, p3.y - p3O.y);

            let line = new Graphics();
            line.lineStyle(2, color);
            line.moveTo(p1o.x, p1o.y);
            line.lineTo(p3o.x, p3o.y);
            app().stage.addChild(line);

            if (!directional) {
                return;
            }
            let dA = 15;
            let p3C = new Point(dA * Math.cos(an3), dA * Math.sin(an3));
            if (p3.x === p1.x) {
                p3C.y = - p3C.y;
            }
            let p3c = new Point(p3o.x - p3C.x, p3o.y - p3C.y);
            let an4 = an3 + Math.PI / 2;

            let dR = 6;
            let p4A = new Point(dR * Math.cos(an4), dR * Math.sin(an4));
            if (p4A.x === 0) {
                p4A.y = - p4A.y;
            }
            let p4l = new Point(p3c.x - p4A.x, p3c.y - p4A.y);
            let p5l = new Point(p3c.x + p4A.x, p3c.y + p4A.y);
            let triangle = new Graphics();
            triangle.lineStyle(2, color);
            triangle.beginFill(color);
            triangle.moveTo(p3o.x, p3o.y);
            triangle.lineTo(p4l.x, p4l.y);
            triangle.lineTo(p5l.x, p5l.y);
            triangle.lineTo(p3o.x, p3o.y);
            triangle.endFill();
            app().stage.addChild(triangle);
            return;
        }

        let clockwise = isClockwise(p1, p2, p3);
        if (!clockwise) {
            p1dA = -p1dA;
            p3dA = -p3dA;
        }

        let a1 = getAngle(new Point((p1.x - X), (p1.y - Y))) - p1dA / R;
        let a3 = getAngle(new Point((p3.x - X), (p3.y - Y))) + p3dA / R;

        let curve = new Graphics();
        curve.lineStyle(2, color);
        curve.arc(X, Y, R, a1, a3, clockwise);
        app().stage.addChild(curve);

        if (!directional) {
            return;
        }
        let dA = 15 / R;
        if (!clockwise) {
            dA = -dA;
        }
        let dR = 6;
        let p32 = getPoint(R, a3);
        p32 = p32.set(p32.x + X, p32.y + Y);
        let p4 = getPoint(R + dR, a3 + dA);
        p4 = p4.set(p4.x + X, p4.y + Y);
        let p5 = getPoint(R - dR, a3 + dA);
        p5 = p5.set(p5.x + X, p5.y + Y);
        let arrow = new Graphics();
        arrow.lineStyle(2, color);
        arrow.beginFill(color);
        arrow.moveTo(p32.x, p32.y);
        arrow.lineTo(p4.x, p4.y);
        arrow.lineTo(p5.x, p5.y);
        arrow.lineTo(p32.x, p32.y);
        arrow.endFill();
        app().stage.addChild(arrow);
    }

    function handleMouseMove(event) {
        setPos1({
            x: event.clientX - offset().x,
            y: event.clientY - offset().y
        });

        app().stage.removeChildren();

        let p1 = new Point(300, 100);
        let p2 = new Point(event.clientX - offset().x, event.clientY - offset().y);
        let p3 = new Point(300, 300);
        edge(p1, p2, p3, 0x0000ff, true, 40, 20);
    }

    function handleMouseDown(event) {
        setPos1({
            x: event.clientX - offset().x,
            y: event.clientY - offset().y
        });

        let text = new Text('bala');
        text.x = pos1().x;
        text.y = pos1().y;
        app().stage.addChild(text);
    }

    return (
        <canvas id={props.id} onMouseMove={handleMouseMove} onMouseDown={handleMouseDown} />
    );
};

export default SystemMap;
