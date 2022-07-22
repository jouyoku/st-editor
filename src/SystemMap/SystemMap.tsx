import { Component, onMount, createSignal } from 'solid-js';
import { Application, Graphics } from 'pixi.js'

const SystemMap: Component<{id: string}> = (props) => {
    const [pos, setPos] = createSignal({ x: 0, y: 0 });
    const [pos0, setPos0] = createSignal({ x: 20, y: 50 });
    const [pos1, setPos1] = createSignal({ x: 20, y: 20 });
    const [posC, setPosC] = createSignal({ x: 0, y: 0 });
    const [app, setApp] = createSignal(null);

    onMount(async () => {
        const app0 = new Application({
            view: document.getElementById(props.id) as HTMLCanvasElement,
            resolution: window.devicePixelRatio || 1,
            autoDensity: true,
            backgroundColor: 0xffff80,
            width: 640,
            height: 480
        });

        setApp(app0);
    });

    function handleMouseMove(event) {
        setPos1({
            x: event.clientX,
            y: event.clientY
        });

    }

    function handleMouseDown(event) {
        setPos1({
            x: event.clientX,
            y: event.clientY
        });

        let curve = new Graphics();
        curve.lineStyle(2, 0xff0000);
        curve.moveTo(pos0().x, pos0().y);
        curve.quadraticCurveTo((pos0().x + pos1().x) / 1, (pos0().y + pos1().y) / 1, pos1().x, pos1().y);
        app().stage.removeChildren();
        app().stage.addChild(curve);
    }

    return (
        <canvas id={props.id} onMouseMove={handleMouseMove} onMouseDown={handleMouseDown} />
    );
};

export default SystemMap;
