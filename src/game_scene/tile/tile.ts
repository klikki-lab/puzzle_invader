
type StatusType = "ACTIVATE" | "DEACTIVATE";
type StatusValue = 0 | 1;

const Status: Record<StatusType, StatusValue> = {
    ACTIVATE: 1,
    DEACTIVATE: 0,
} as const;

export class Tile extends g.Sprite {

    public static readonly DIVISION = 3;
    private static readonly STATUS_DIVISION = 3;
    private status: StatusValue = Status.DEACTIVATE;

    constructor(scene: g.Scene, private _color: number) {
        const src = scene.asset.getImageById("img_tile");
        super({
            scene: scene,
            src: src,
            width: Math.floor(src.width / (Tile.DIVISION + Tile.STATUS_DIVISION)),
            anchorX: 0.5,
            anchorY: 0.5,
        });
        this.color = _color;
    }

    override render(renderer: g.Renderer, camera?: g.Camera): void {
        if (this.parent instanceof g.Pane) {
            if (this.getRight() < 0 || this.getLeft() > this.parent.width ||
                this.getBottom() < 0 || this.getTop() > this.parent.height) {
                return;
            }
        }
        super.render(renderer, camera);
    }

    activate = (): void => {
        if (this.status === Status.ACTIVATE) return;

        this.status = Status.ACTIVATE;
        this.switchColor();
    };

    deactivate = (): void => {
        if (this.status === Status.DEACTIVATE) return;

        this.status = Status.DEACTIVATE;
        this.switchColor();
    };

    getTop = (): number => this.y - this.height * 0.5;

    getRight = (): number => this.x + this.width * 0.5;

    getBottom = (): number => this.y + this.height * 0.5;

    getLeft = (): number => this.x - this.width * 0.5;

    get color(): number { return this._color; }

    set color(color: number) {
        this._color = color;
        this.switchColor();
    }

    private switchColor = (): void => {
        this.srcX = (this.color + this.status * Tile.STATUS_DIVISION) * this.width;
        this.invalidate();
    };
}