import { CustomLoadingScene } from "./common/customLoadingScene";
import { GameScene } from "./game_scene/gameScene";
import { GameMainParameterObject } from "./parameterObject";
import { TitleScene } from "./title_scene/titleScene";

export function main(param: GameMainParameterObject): void {
    g.game.vars.gameState = {
        score: 0,
        playThreshold: 100,
        clearThreshold: undefined,
    };
    g.game.loadingScene = new CustomLoadingScene(50);

    const titleScene = new TitleScene(param, 9);
    titleScene.onFinish = isTouched => {
        g.game.replaceScene(new GameScene(param, isTouched, 120));
    };
    g.game.pushScene(titleScene);
}
