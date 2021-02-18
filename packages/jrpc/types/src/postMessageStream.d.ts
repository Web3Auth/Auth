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
        targetWindow: Window;
    });
    _handShake(): void;
    _onData(data: unknown): void;
    _postMessage(data: unknown): void;
    onMessage(event: MessageEvent): void;
    _read(): void;
    _write(data: unknown, _: any, cb: () => void): void;
}
