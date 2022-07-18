export class Frame {
    private _name: string = '';
    private _offset: { x: number, y: number } = { x: 0, y: 0 };
    private _size: { width: number, height: number } = { width: 0, height: 0 };
    // private _sourceSize: { w: number, h: number } = { w: 0, h: 0 };
    // private _rect: { x: number, y: number, w: number, h: number } = { x: 0, y: 0, w: 0, h: 0 };
    private _rotated: boolean = false;

    constructor(name?: string) {
        this.setName(name);
    }

    public setName(name = '') {
        this._name = name;
    }

    public setOffset(x: number, y: number) {
        this._offset.x = x;
        this._offset.y = y;
    }

    public setSize(size: { width: number, height: number }) {
        this._size = size;
    }

    public setRotated(v: boolean) {
        this._rotated = v;
    }

    public getDictContent(): string {
        return `<key>${this._name}</key>
            <dict>
                <key>aliases</key>
                <array/>
                <key>spriteOffset</key>
                <string>{0,0}</string>
                <key>spriteSize</key>
                <string>{${this._size.width},${this._size.height}}</string>
                <key>spriteSourceSize</key>
                <string>{${this._size.width},${this._size.height}}</string>
                <key>textureRect</key>
                <string>{{${this._offset.x},${this._offset.y}},{${this._size.width},${this._size.height}}}</string>
                <key>textureRotated</key>
                <${this._rotated}/>
            </dict>
        `;
    }
}

export class PList {
    private _frames: Frame[] = [];
    private _name: string = '';
    private _size: { w: number, h: number } = { w: 0, h: 0 };

    constructor(name: string) {
        this._name = name;
    }

    public setSize(w: number, h: number) {
        this._size = { w: w, h: h };
    }

    public addFrame(frame: Frame) {
        this._frames[this._frames.length] = frame;
    }

    public getContent(): string {
        let framesContent = '';
        this._frames.forEach(frame => {
            framesContent += frame.getDictContent();
        });
        return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple Computer//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
    <dict>
        <key>frames</key>
        <dict>
            ${framesContent}
        </dict>
        <key>metadata</key>
        <dict>
            <key>format</key>
            <integer>3</integer>
            <key>pixelFormat</key>
            <string>RGBA8888</string>
            <key>premultiplyAlpha</key>
            <false/>
            <key>realTextureFileName</key>
            <string>${this._name}.png</string>
            <key>size</key>
            <string>{${this._size.w},${this._size.h}}</string>
            <key>textureFileName</key>
            <string>${this._name}.png</string>
        </dict>
    </dict>
</plist>`;
    }
}