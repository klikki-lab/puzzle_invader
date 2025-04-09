export class Button extends g.Sprite {

    private _onPressed?: (button: Button) => void;
    private _onClick?: (button: Button) => void;
    private isPressed: boolean = false;

    constructor(scene: g.Scene, assetId: string) {
        const asset = scene.asset.getImageById(assetId);
        super({
            scene: scene,
            src: asset,
            srcWidth: asset.width / 2,
            width: asset.width / 2,
            touchable: true,
        });

        this.onPointDown.add((_ev: g.PointDownEvent): void => {
            if (this.isPressed) return;

            this.switchPressedState(true);
            this._onPressed?.(this);
        });

        this.onPointMove.add((ev: g.PointMoveEvent): void => {
            if (!this.isPressed) return;

            const ex = ev.point.x + ev.startDelta.x;
            const ey = ev.point.y + ev.startDelta.y;
            if (ex < 0 || ex > this.width || ey < 0 || ey > this.height) {
                this.switchPressedState(false);
            }
        });

        this.onPointUp.add((_ev: g.PointUpEvent): void => {
            if (!this.isPressed) return;

            this.switchPressedState(false);
            this._onClick?.(this);
        });
    }

    removeAllListener = (): void => {
        if (this.isPressed) {
            this.switchPressedState(false);
        }
        this.onPointDown.removeAll();
        this.onPointMove.removeAll();
        this.onPointUp.removeAll();
    };

    set onPressed(listener: (button: Button) => void) { this._onPressed = listener; };

    set onClick(listener: (button: Button) => void) { this._onClick = listener; };

    private switchPressedState = (isPressed: boolean): void => {
        this.isPressed = isPressed;
        this.srcX = isPressed ? this.width : 0;
        this.invalidate();
    };
}