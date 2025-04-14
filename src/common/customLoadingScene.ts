import * as tl from "@akashic-extension/akashic-timeline";

export class CustomLoadingScene extends g.LoadingScene {

    private timeline: tl.Timeline;
    private waitingAssetCount = 0;

    constructor(fadeOutDuration: number) {
        super({
            game: g.game,
            assetIds: ["img_loading", "img_loading_now"],
            explicitEnd: true,
        });

        this.timeline = new tl.Timeline(this);

        this.onLoad.add(() => {
            new g.FilledRect({
                scene: this,
                parent: this,
                width: g.game.width,
                height: g.game.height,
                cssColor: "black",
                opacity: 0.9,
            });

            const alien = new g.Sprite({
                scene: this,
                src: this.asset.getImageById("img_loading"),
            });

            const rect = new g.FilledRect({
                scene: this,
                width: alien.width,
                height: alien.height,
                cssColor: "black",
                compositeOperation: "source-atop",
            });

            const pane = new g.Pane({
                scene: this,
                width: alien.width,
                height: alien.height,
                x: g.game.width - alien.width * 0.75,
                y: g.game.height - alien.height * 0.75,
                anchorX: 0.5,
                anchorY: 0.5,
            });
            pane.append(alien);
            pane.append(rect);
            this.append(pane);

            const loadingNow = new g.Sprite({
                scene: this,
                src: this.asset.getImageById("img_loading_now"),
                anchorX: 0.5,
                anchorY: 0.5,
            });
            loadingNow.moveTo(pane.x, pane.y - pane.height / 2 - loadingNow.height);
            this.append(loadingNow);

            const progress = (): void => {
                const rate = this.getTargetWaitingAssetsCount() / this.waitingAssetCount;
                rect.height = pane.height * rate;
                rect.modified();
            }

            this.onTargetReset.add(_scene => {
                rect.height = pane.height;
                rect.modified();

                pane.opacity = 1;
                pane.x = g.game.width - alien.width * 0.75;
                pane.y = g.game.height - alien.height * 0.75;
                pane.modified();

                loadingNow.opacity = 1;
                loadingNow.modified();

                this.waitingAssetCount = this.getTargetWaitingAssetsCount();
            });

            this.onTargetAssetLoad.add(_asset => progress());

            this.onTargetReady.add(_scene => {
                progress();

                this.timeline.create(loadingNow)
                    .fadeOut(fadeOutDuration, tl.Easing.easeInCubic);

                this.timeline.create(pane)
                    .fadeOut(fadeOutDuration, tl.Easing.easeInCubic)
                    .call(() => this.end());
            });
        });
    }
}