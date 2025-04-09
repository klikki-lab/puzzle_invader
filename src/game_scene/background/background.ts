import { Star } from "./star";

export class Background extends g.FilledRect {

    private stars: Star[] = [];

    constructor(scene: g.Scene) {
        super({
            scene: scene,
            x: 0,
            y: 0,
            width: g.game.width,
            height: g.game.height,
            cssColor: "black",
            opacity: 0.9,
        });

        for (let i = 0; i < 16; i++) {
            const star = new Star(scene);
            this.append(star);
            this.stars.push(star);
        }
    }

    startWarp = (): void => this.stars.forEach(star => star.startWarp());

    finishWarp = (): void => this.stars.forEach(star => star.finishWarp());

    hideStars = (): void => this.stars.forEach(star => star.hide());
}