export class Star extends g.FilledRect {

    private static readonly OFFSET_X = g.game.width * 0.1;
    private static readonly OFFSET_Y = g.game.height * 0.1;
    private static readonly WIDTH = g.game.width * 0.8;
    private static readonly HEIGHT = g.game.height * 0.8;
    private static readonly MAX_VELOCITY_Y = g.game.height / 2;
    private static readonly SIZE = 2;

    private vy = 0;
    private isWarp = false;

    constructor(scene: g.Scene) {
        const size = 2 + g.game.random.generate() * Star.SIZE;
        super({
            scene: scene,
            width: size,
            height: size,
            x: Star.OFFSET_X + g.game.random.generate() * Star.WIDTH,
            y: Star.OFFSET_Y + g.game.random.generate() * Star.HEIGHT,
            cssColor: "white",
            anchorY: 1,
            opacity: 0.75,
        });

        this.vy = this.height / 2;
        this.onUpdate.add(this.updateHandler)
    }

    startWarp = (): void => { this.isWarp = true; };

    finishWarp = (): void => { this.isWarp = false; };

    private updateHandler = (): void | boolean => {
        if (this.isWarp) {
            const rate = (1 / g.game.fps) * 64;
            this.vy += rate;
            this.height += rate * 2;
            if (this.vy > Star.MAX_VELOCITY_Y) {
                this.vy = Star.MAX_VELOCITY_Y;
                console.log(this.vy)
            }
        } else {
            if (this.isWarping()) {
                this.vy *= 0.8;
                this.height *= 0.8;
                if (this.vy < this.width / 2) {
                    this.vy < this.width / 2;
                    this.height = this.width;
                }
            }
        }
        this.y += this.vy;
        if (this.y - this.height > g.game.height) {
            this.init();
        }
        this.modified();
    };

    private isWarping = (): boolean => this.vy > this.width / 2;

    private init = (): void => {
        if (!this.isWarping()) {
            const size = 2 + g.game.random.generate() * Star.SIZE;
            this.width = size;
            this.height = size;
            this.vy = size / 2;
        }
        this.x = Star.OFFSET_X + g.game.random.generate() * Star.WIDTH;
        this.y = 0;
    };
}