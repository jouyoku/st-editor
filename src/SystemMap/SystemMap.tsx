import { Component, onMount, createSignal } from 'solid-js';
import { Application, Graphics, Point, Text, TextStyle, LineStyle } from './pixi.js'

class Arc {
    cx: number;
    cy: number;
    radius: number;
    startAngle: number;
    endAngle: number;
    anticlockwise: Boolean;

    constructor(
        cx: number,
        cy: number,
        radius: number,
        startAngle: number,
        endAngle: number,
        anticlockwise: Boolean
    ) {
        this.cx = cx;
        this.cy = cy;
        this.radius = radius;
        this.startAngle = startAngle;
        this.endAngle = endAngle;
        this.anticlockwise = anticlockwise;
    }
}

class Line {
    start: Point;
    end: Point;
    constructor(
        start: Point,
        end: Point
    ) {
        this.start = start;
        this.end = end;
    }
}

type Edge = Arc | Line;

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
            backgroundAlpha: 0,
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

    function isAnticlockwise(
        p1: Point,
        p2: Point,
        p3: Point
    ) {
        //y = ax + b
        if (p3.x === p1.x) {
            return !((p1.y > p3.y) != (p2.x > p1.x));
        }

        let a = (p3.y - p1.y) / (p3.x - p1.x);
        let b = (p3.x * p1.y - p1.x * p3.y) / (p3.x - p1.x);
        return !((p2.y > (a * p2.x + b)) != (p3.x > p1.x));
    }

    function getCircle(
        p1: Point,
        p2: Point,
        p3: Point
    ): {
        cx: number,
        cy: number,
        radius: number
    } {
        //https://www.twblogs.net/a/5b7afab12b7177539c24854c
        let e = 2 * (p2.x - p1.x);
        let f = 2 * (p2.y - p1.y);
        let g = p2.x ** 2 - p1.x ** 2 + p2.y ** 2 - p1.y ** 2;

        let a = 2 * (p3.x - p2.x);
        let b = 2 * (p3.y - p2.y);
        let c = p3.x ** 2 - p2.x ** 2 + p3.y ** 2 - p2.y ** 2;

        let cx = (g * b - c * f) / (e * b - a * f);
        let cy = (a * g - c * e) / (a * f - b * e);
        let radius = Math.sqrt((cx - p1.x) * (cx - p1.x) + (cy - p1.y) * (cy - p1.y));

        return { cx, cy, radius };
    }

    function getXY4Arc(radius: number, angle: number): Point {
        return new Point(radius * Math.cos(angle), radius * Math.sin(angle));
    }

    function getXY4Line(radius: number, angle: number): Point {
        let point = new Point(radius * Math.cos(angle), radius * Math.sin(angle));
        if (angle === (Math.PI * 3 / 2) || angle === (Math.PI / 2)) {
            point.y = - point.y;
        }
        return point;
    }

    function getEdgeVars(
        p1: Point,
        p2: Point,
        p3: Point
    ): Edge {
        let circle = getCircle(p1, p2, p3);
        let cx = circle.cx;
        let cy = circle.cy;
        let radius = circle.radius;
        if (radius === Infinity || isNaN(radius)) {
            return new Line(p1, p3);
        }
        let startAngle = getAngle(new Point((p1.x - cx), (p1.y - cy)));
        let endAngle = getAngle(new Point((p3.x - cx), (p3.y - cy)));
        let anticlockwise = isAnticlockwise(p1, p2, p3);
        return new Arc(cx, cy, radius, startAngle, endAngle, anticlockwise);
    }

    function drawEdge(p1: Point, p2: Point, p3: Point, style = { width: 2, color: 0x000000 }, p1Offset = 0, p3Offset = 0, gap = 0, solid = 8) {
        let vars = getEdgeVars(p1, p2, p3);
        if (vars instanceof Line) {
            let angle = getAngle(new Point(p3.x - p1.x, p3.y - p1.y));
            let p1XY = getXY4Line(p1Offset, angle);
            let p3XY = getXY4Line(p3Offset, angle);

            let start = new Point(p1.x + p1XY.x, p1.y + p1XY.y);
            let end = new Point(p3.x - p3XY.x, p3.y - p3XY.y);

            let line = new Graphics();
            line.lineStyle(style);
            line.moveTo(start.x, start.y);
            if (gap === 0) {
                line.lineTo(end.x, end.y);
            } else {
                let solidXY = getXY4Line(solid, angle);
                let gapXY = getXY4Line(gap, angle);
                let index = start;
                do {
                    index = new Point(index.x + solidXY.x, index.y + solidXY.y);
                    if (((index.x - start.x) ** 2 + (index.y - start.y) ** 2) > ((end.x - start.x) ** 2 + (end.y - start.y) ** 2)) {
                        index = end;
                    }
                    line.lineTo(index.x, index.y);
                    index = new Point(index.x + gapXY.x, index.y + gapXY.y);
                    line.moveTo(index.x, index.y);
                } while (((index.x - start.x) ** 2 + (index.y - start.y) ** 2) < ((end.x - start.x) ** 2 + (end.y - start.y) ** 2));
            }
            app().stage.addChild(line);
            return;
        }

        if (!vars.anticlockwise) {
            p1Offset = -p1Offset;
            p3Offset = -p3Offset;
            gap = -gap;
            solid = -solid;
        }

        let start = vars.startAngle - p1Offset / vars.radius;
        let end = vars.endAngle + p3Offset / vars.radius;

        if (!vars.anticlockwise) {
            if (start > end) {
                end += Math.PI * 2;
            }
        } else {
            if (start < end) {
                start += Math.PI * 2;
            }
        }

        let curve = new Graphics();
        curve.lineStyle(style);
        let startXY = getXY4Arc(vars.radius, start);
        startXY = startXY.set(startXY.x + vars.cx, startXY.y + vars.cy);
        curve.moveTo(startXY.x, startXY.y);
        if (gap === 0) {
            curve.arc(
                vars.cx,
                vars.cy,
                vars.radius,
                start,
                end,
                vars.anticlockwise
            );
        } else {
            let solidA = solid / vars.radius;
            let gapA = gap / vars.radius;
            let index = start;
            do {
                let index1 = index - solidA;
                if (Math.abs(index1 - start) > Math.abs(end - start)) {
                    index1 = end;
                }
                curve.arc(
                    vars.cx,
                    vars.cy,
                    vars.radius,
                    index,
                    index1,
                    vars.anticlockwise
                );
                index = index1 - gapA;
                let indexXY = getXY4Arc(vars.radius, index);
                indexXY = indexXY.set(indexXY.x + vars.cx, indexXY.y + vars.cy);
                curve.moveTo(indexXY.x, indexXY.y);
            } while (Math.abs(index - start) < Math.abs(end - start));
        }
        app().stage.addChild(curve);
    }

    function getArrow(p1: Point, p2: Point, p3: Point, arrowLength = 15, arrowWidth = 12, p3Offset = 0): [Point, Point, Point] {
        let vars = getEdgeVars(p1, p2, p3);
        if (vars instanceof Line) {
            let angle = getAngle(new Point(p3.x - p1.x, p3.y - p1.y));
            let p3XY = getXY4Line(p3Offset, angle);
            let p3a = new Point(p3.x - p3XY.x, p3.y - p3XY.y);
            let p3C = getXY4Line(arrowLength, angle);
            let p3c = new Point(p3a.x - p3C.x, p3a.y - p3C.y);

            let angle2 = angle + Math.PI / 2;
            let p4A = getXY4Line(arrowWidth / 2, angle2);
            let p4 = new Point(p3c.x - p4A.x, p3c.y - p4A.y);
            let p5 = new Point(p3c.x + p4A.x, p3c.y + p4A.y);

            return [p3a, p4, p5];
        }
        let dA = arrowLength / vars.radius;
        if (!vars.anticlockwise) {
            dA = -dA;
            p3Offset = -p3Offset;
        }
        let dR = arrowWidth / 2;
        let angle = vars.endAngle + p3Offset / vars.radius;
        let p3a = getXY4Arc(vars.radius, angle);
        p3a = p3a.set(p3a.x + vars.cx, p3a.y + vars.cy);
        let p4 = getXY4Arc(vars.radius + dR, angle + dA);
        p4 = p4.set(p4.x + vars.cx, p4.y + vars.cy);
        let p5 = getXY4Arc(vars.radius - dR, angle + dA);
        p5 = p5.set(p5.x + vars.cx, p5.y + vars.cy);

        return [p3a, p4, p5];
    }

    function drawTriangle(p1: Point, p2: Point, p3: Point, style = { width: 2, color: 0x000000 }) {
        let triangle = new Graphics();
        triangle.lineStyle(style);
        triangle.beginFill(style.color);
        triangle.moveTo(p1.x, p1.y);
        triangle.lineTo(p2.x, p2.y);
        triangle.lineTo(p3.x, p3.y);
        triangle.lineTo(p1.x, p1.y);
        triangle.endFill();
        app().stage.addChild(triangle);
    }

    function drawArrow(p1: Point, p2: Point, p3: Point, style = { width: 2, color: 0x000000 }, arrowLength = 15, arrowWidth = 12, p3Offset = 0) {
        let points = getArrow(p1, p2, p3, arrowLength, arrowWidth, p3Offset);
        drawTriangle(points[0], points[1], points[2], style);
    }

    function getTextPointP3(p1: Point, p2: Point, p3: Point, right = 20, p3Offset = 0): Point {
        let vars = getEdgeVars(p1, p2, p3);
        if (vars instanceof Line) {
            let angle = getAngle(new Point(p3.x - p1.x, p3.y - p1.y));
            let p3XY = getXY4Line(p3Offset, angle);

            let end = new Point(p3.x - p3XY.x, p3.y - p3XY.y);

            let angle2 = angle + Math.PI / 2;
            let p4A = getXY4Line(right, angle2);

            if (angle2 === (Math.PI / 2) || angle2 === (Math.PI * 3 / 2)) {
                p4A.y = -p4A.y;
            }
            if (angle2 === (Math.PI * 2) || angle2 === Math.PI) {
                p4A.x = -p4A.x;
            }
            return new Point(end.x + p4A.x, end.y + p4A.y);
        }

        if (!vars.anticlockwise) {
            p3Offset = -p3Offset;
        }

        let end = vars.endAngle + p3Offset / vars.radius;

        let r1 = right;
        if (!vars.anticlockwise) {
            r1 = -r1;
        }

        let tmp = getXY4Arc(vars.radius + r1, end);
        return new Point(vars.cx + tmp.x, vars.cy + tmp.y);
    }

    function getTextPoint(p1: Point, p2: Point, p3: Point, percent = 50, right = 20, p1Offset = 0, p3Offset = 0): Point {
        let vars = getEdgeVars(p1, p2, p3);
        if (vars instanceof Line) {
            let angle = getAngle(new Point(p3.x - p1.x, p3.y - p1.y));
            let p1XY = getXY4Line(p1Offset, angle);
            let p3XY = getXY4Line(p3Offset, angle);

            let start = new Point(p1.x + p1XY.x, p1.y + p1XY.y);
            let end = new Point(p3.x - p3XY.x, p3.y - p3XY.y);

            let position = new Point((end.x - start.x) * percent / 100 + start.x, (end.y - start.y) * percent / 100 + start.y);
            let angle2 = angle + Math.PI / 2;
            let p4A = getXY4Line(right, angle2);
            if (angle2 === (Math.PI / 2) || angle2 === (Math.PI * 3 / 2)) {
                p4A.y = -p4A.y;
            }
            if (angle2 === (Math.PI * 2) || angle2 === Math.PI) {
                p4A.x = -p4A.x;
            }
            return new Point(position.x + p4A.x, position.y + p4A.y);
        }

        if (!vars.anticlockwise) {
            p1Offset = -p1Offset;
            p3Offset = -p3Offset;
        }

        let start = vars.startAngle - p1Offset / vars.radius;
        let end = vars.endAngle + p3Offset / vars.radius;

        if (!vars.anticlockwise) {
            if (start > end) {
                end += Math.PI * 2;
            }
        } else {
            if (start < end) {
                start += Math.PI * 2;
            }
        }

        let position = (end - start) * percent / 100 + start;
        let r1 = right;
        if (!vars.anticlockwise) {
            r1 = -r1;
        }

        let tmp = getXY4Arc(vars.radius + r1, position);
        return new Point(vars.cx + tmp.x, vars.cy + tmp.y);
    }

    function drawText(position: Point, content: string, style: TextStyle = {}) {
        let text = new Text(content, style);
        text.x = position.x - text.width / 2;
        text.y = position.y - text.height / 2;
        app().stage.addChild(text);
    }

    function handleMouseMove(event) {
        setPos1({
            x: event.clientX - offset().x,
            y: event.clientY - offset().y
        });

        app().stage.removeChildren();

        let p1 = new Point(300, 300);
        let p2 = new Point(event.clientX - offset().x, event.clientY - offset().y);
        let p3 = new Point(300, 100);

        //drawArrow(p3, p2, p1, { width: 3, color: 0xff00ff }, 15, 12, 20);
        drawEdge(p1, p2, p3, { width: 3, color: 0x0000ff }, 20, 40, 8, 8);
        drawArrow(p1, p2, p3, { width: 3, color: 0x0000ff }, 15, 12, 40);

        let pt = getTextPointP3(p1, p2, p3, 20, 80);
        drawText(pt, '+');

        let pt2 = getTextPoint(p1, p2, p3, 50, 40);
        drawText(pt2, 'bala');
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
