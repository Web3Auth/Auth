/// <reference types="node" />
import { Duplex } from "stream";
export default class PostMessageStream extends Duplex {
    _init: boolean;
    _haveSyn: boolean;
    _name: string;
    _target: string;
    _targetWindow: Window;
    _origin: string;
    _onMessage: any;
    constructor({ name, target, targetWindow }: {
        name: string;
        target: string;
        targetWindow: any;
    });
    _handShake(): void;
    _onData(data: any): void;
    _postMessage(data: any): void;
    onMessage(event: MessageEvent): void;
    _read(): void;
    _write(data: any, _: any, cb: () => void): void;
}
