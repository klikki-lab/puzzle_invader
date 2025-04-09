
export abstract class BaseScene<T> extends g.Scene {

    public static readonly SCREEN_PADDING = 48;

    private _onFinish?: (param: T) => void;

    public get onFinish(): ((param: T) => void | undefined) { return this._onFinish; }

    public set onFinish(onFinish: (param: T) => void) { this._onFinish = onFinish; }
}