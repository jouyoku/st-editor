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

    function edge(p1: Point, p2: Point, p3: Point) {
        let circle = getCircle(p1, p2, p3);
        let X = circle.X;
        let Y = circle.Y;
        let R = circle.R;

        if (R === Infinity || isNaN(R)) {
            let line = new Graphics();
            line.lineStyle(2, 0xff0000);
            line.moveTo(p1.x, p1.y);
            line.lineTo(p3.x, p3.y);
            app().stage.addChild(line);
            return;
        }

        let a1 = getAngle(new Point((p1.x - X), (p1.y - Y)));
        let a3 = getAngle(new Point((p3.x - X), (p3.y - Y)));

        let curve = new Graphics();
        curve.lineStyle(2, 0xff0000);
        curve.arc(X, Y, R, a1, a3, isClockwise(p1, p2, p3));
        app().stage.addChild(curve);
    }

    function handleMouseMove(event) {
        setPos1({
            x: event.clientX - offset().x,
            y: event.clientY - offset().y
        });

        app().stage.removeChildren();

        let p1 = new Point(100, 100);
        let p2 = new Point(event.clientX - offset().x, event.clientY - offset().y);
        let p3 = new Point(300, 100);
        edge(p1, p2, p3);
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
