export type MusicParam = {
    readonly assetId: string;
    /**
     * オーディオアセットのボリューム。
     * 指定がなければコンストラクタで指定したデフォルトボリュームになる。
     */
    readonly volume?: number;
};

export type SoundParam = MusicParam & {
    /**
     * このオーディオを再生するフレーム間隔。指定がなければ 1 フレーム。
     * 同じSEを同時に複数再生すると不快な音になるので 1 以上を推奨。
     */
    readonly interval?: number;
};

type Music = {
    [key: string]: {
        readonly context: g.AudioPlayContext;
    }
};

type SoundProps = {
    audio: g.AudioAsset;
    volume: number;
    interval: number;
    age: number;
};

type Sound = {
    [key: string]: SoundProps;
};

/**
 * オーディオ操作クラス。
 */
export class AudioController {

    private static readonly DEFAULT_SOUND_INTERVAL = 1;

    private musics: Music = {};
    private sounds: Sound = {};
    private _musicVolume: number;
    private _soundVolume: number;

    /**
     * @param musicVolume BGMのデフォルトボリューム。0.0 - 1.0 (0.2 前後推奨)。
     * @param soundVolume SEのデフォルトボリューム。0.0 - 1.0 (0.2 前後推奨)。
     * @param _disableSound `true` ならSEの再生をしない (BGMは再生する)。これはプレイヤーの操作がないまま音声再生を行うと、操作が行われたタイミングで一気に音が鳴るニコ生上の仕様を防ぐためである。有効化する場合は {@link enablePlaySound()} を呼び出すこと。
     */
    constructor(musicVolume: number, soundVolume: number, private _disableSound: boolean) {
        this._musicVolume = this.clamp(musicVolume);
        this._soundVolume = this.clamp(soundVolume);
    }

    /**
     * BGMを追加する。
     * @param asset AssetAccessor (=> {@link g.AssetAccessor})
     * @param params BGMパラメータ (=>{@link MusicParam})。アセットIDとボリュームを指定する。ボリューム指定がなければコンストラクタのデフォルト値になる。
     */
    addMusic = (asset: g.AssetAccessor, ...params: MusicParam[]): void => {
        for (const param of params) {
            const musicAudioSystem = new g.MusicAudioSystem({
                id: param.assetId,
                resourceFactory: g.game.resourceFactory,
            });
            const audioPlayContext = new g.AudioPlayContext({
                id: param.assetId,
                resourceFactory: g.game.resourceFactory,
                system: musicAudioSystem,
                systemId: param.assetId,
                asset: asset.getAudioById(param.assetId),
                volume: this.clamp(param.volume ?? this._musicVolume),
            })
            this.musics[param.assetId] = {
                context: audioPlayContext,
            };
        }
    };

    /**
     * 指定したアセットIDのBGMを再生する。
     * @param assetId アセットID
     * @returns AudioPlayContext (=> {@link g.AudioPlayContext})
     * @throws 指定したアセットIDが未追加の場合
     */
    playMusic = (assetId: string): g.AudioPlayContext => {
        const context = this.getAudioPlayContext(assetId);
        context.play();
        return context;
    };

    /**
     * 指定したアセットIDのBGMを停止させる。
     * @param assetId アセットID
     * @throws 指定したアセットIDが未追加の場合
     */
    stopMusic = (assetId: string): void => this.getAudioPlayContext(assetId).stop();

    /**
     * 指定したアセットIDのBGMのボリュームを取得する。
     * @param assetId アセットID  
     * @returns ボリューム
     * @throws 指定したアセットIDが未追加の場合
     */
    getMusicVolume = (assetId: string): number => this.getAudioPlayContext(assetId).volume;

    // イージング関数例
    // const volume = this.audioController.getMusicVolume(MusicId.BGM);
    // const easing = (t: number, _b: number, _c: number, d: number) => {
    //     const v = 1 - (t / d);
    //     return v * volume;
    //     or 
    //     return v * v * v * volume;
    //     etc...
    // };

    /**
     * 指定したアセットIDのBGMをフェードアウトさせる。
     * @param assetId アセットID。
     * @param duration フェードアウトの長さ (ms)。
     * @param easing イージング関数。省略時は linear が指定される。
     * @returns AudioTransitionContext (=> {@link g.AudioTransitionContext})
     * @throws 指定したアセットIDが未追加の場合
     */
    fadeOutMusic = (assetId: string, duration: number, easing?: g.EasingFunction): g.AudioTransitionContext =>
        g.AudioUtil.fadeOut(g.game, this.getAudioPlayContext(assetId), duration, easing);

    /**
     * 指定したアセットIDのBGMをフェードインさせる。
     * @param assetId アセットID。
     * @param duration フェードインの長さ (ms)。
     * @param to フェードイン後の音量 (0 - 1)。省略時は 1 。
     * @param easing イージング関数。省略時は linear が指定される。
     * @returns AudioTransitionContext (=> {@link g.AudioTransitionContext})
     */
    fadeInMusic = (assetId: string, duration: number, to: number = 1, easing?: g.EasingFunction): g.AudioTransitionContext =>
        g.AudioUtil.fadeIn(g.game, this.getAudioPlayContext(assetId), duration, Math.max(0, Math.min(to, 1)), easing);

    /**
     * SEを追加する。
     * @param asset AssetAccessor　(=> {@link g.AssetAccessor})
     * @param params SEパラメータ (=>{@link SoundParam})。アセットIDとボリューム、インターバルを指定する。ボリューム指定がなければコンストラクタのデフォルト値に、インターバル指定がなければ 1 が指定される。
     */
    addSound = (asset: g.AssetAccessor, ...params: SoundParam[]): void => {
        for (const param of params) {
            const interval = param.interval ?? AudioController.DEFAULT_SOUND_INTERVAL;
            this.sounds[param.assetId] = {
                audio: asset.getAudioById(param.assetId),
                volume: this.clamp(param.volume ?? this._soundVolume),
                interval: Math.max(AudioController.DEFAULT_SOUND_INTERVAL, interval),
                age: g.game.age,
            };
        }
    };

    /**
     * 指定したアセットIDのSEを再生する。
     * @param assetId アセットID
     * @returns SEが再生できれば `g.AudioPlayer`、SEの再生が無効化されているかインターバル値以下で再生を行おうとした場合 `undefined` が返る。
     * @throws 指定したアセットIDが未追加の場合
     */
    playSound = (assetId: string): (g.AudioPlayer | undefined) => {
        if (this._disableSound) return undefined;

        const props = this.getSoundProps(assetId);
        if (props.interval) {
            if (g.game.age - props.age < props.interval) {
                return undefined;
            }
            props.age = g.game.age;
        }
        const player = props.audio.play();
        player.changeVolume(props.volume);
        return player;
    };

    /**
     * 指定したアセットIDのSEのボリュームを取得する。
     * @param assetId アセットID。
     * @returns ボリューム。
     * @throws 指定したアセットIDが未追加の場合。
     */
    getSoundVolume = (assetId: string): number => this.getSoundProps(assetId).volume;

    /**
     * SEの再生を有効にする。
     */
    enablePlaySound = (): void => { this._disableSound = false; }

    /**
     * SEの再生が無効なら `true`、そうでなければ `false`。
     */
    get disablePlaySound(): boolean { return this._disableSound; }

    private clamp = (value: number): number => g.Util.clamp(value, 0, 1);

    private getAudioPlayContext = (assetId: string): g.AudioPlayContext => {
        const context = this.musics[assetId]?.context;
        if (!context) throw new Error(`${assetId} doesn't exist.`);
        return context;
    };

    private getSoundProps = (assetId: string): SoundProps => {
        const soundProps = this.sounds[assetId];
        if (!soundProps) throw new Error(`${assetId} doesn't exist.`);
        return soundProps;
    };
}