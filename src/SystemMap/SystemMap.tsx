import { Component, onMount, createSignal } from 'solid-js';
import { Application, Graphics, Text } from './pixi.js'
//import {  } from '@pixi/graphics'
//import { Text } from '@pixi/text'

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
        setOffset({x: rect.x, y: rect.y});

        setApp(app0);
    });

    function handleMouseMove(event) {
        setPos1({
            x: event.clientX - offset().x,
            y: event.clientY - offset().y
        });

        let curve = new Graphics();
        curve.lineStyle(2, 0xff0000);
        curve.arc(pos1().x, pos1().y, 100, 0, 2 * Math.PI);
        app().stage.removeChildren();
        app().stage.addChild(curve);

        
        let text = new Text('bala');
        text.x = pos1().x;
        text.y = pos1().y;
        app().stage.addChild(text);
    }

    function handleMouseDown(event) {
        setPos1({
            x: event.clientX - offset().x,
            y: event.clientY - offset().y
        });


        let curve = new Graphics();
        curve.lineStyle(2, 0xff0000);
        curve.arc(pos1().x, pos1().y, 100, 0, 2 * Math.PI);
        app().stage.removeChildren();
        app().stage.addChild(curve);

        
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
