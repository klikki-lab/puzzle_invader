import { Invader } from "./invader";

export class Monolith extends Invader {

    constructor(scene: g.Scene, color: number) {
        super(scene, "img_monolith", color);
        this.hide();
    }
}