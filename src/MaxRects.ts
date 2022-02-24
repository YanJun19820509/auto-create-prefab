
let _padding: number;

class Vec2 {
    public x: number;
    public y: number;

    constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }

    public equals(v: Vec2): boolean {
        return v.x == this.x && v.y == this.y;
    }
}

class Size {
    public width: number;
    public height: number;

    constructor(w = 0, h = 0) {
        this.width = w;
        this.height = h;
    }
}

class Rect {
    public origin: Vec2;
    public size: Size;

    constructor(x = 0, y = 0, w = 0, h = 0) {
        this.origin = new Vec2(x, y);
        this.size = new Size(w, h);
    }

    public get center(): Vec2 {
        return new Vec2(this.origin.x + this.size.width / 2, this.origin.y + this.size.height / 2);
    }

    public containsRect(r: Rect): boolean {
        return r.origin.x >= this.origin.x
            && r.origin.x + r.size.width <= this.origin.x + this.size.width
            && r.origin.y >= this.origin.y
            && r.origin.y + r.size.height <= this.origin.y + this.size.height;
    }

    public intersects(r: Rect): boolean {
        let c = this.center, cr = r.center;
        let a = Math.abs(c.x - cr.x) > (this.size.width + r.size.width) / 2 || Math.abs(c.y - cr.y) > (this.size.height + r.size.height) / 2;
        return !a;
    }
}

class MaxRect {
    public rect!: Rect;
    public id!: string;

    constructor(x: number, y: number, w: number, h: number) {
        this.set(x, y, w, h);
    }

    public static new(x: number, y: number, w: number, h: number): MaxRect {
        return new MaxRect(x, y, w, h);
    }

    public set(x: number, y: number, w: number, h: number) {
        this.rect = new Rect(x, y, w, h);
        this.id = `${x}_${y}_${w}_${h}`;
    }

    public cut(x: number, y: number, w: number, h: number): MaxRect[] {
        let r = this.rect!;
        let a: MaxRect[] = [];
        if (x > r.origin.x + _padding)
            a[a.length] = MaxRect.new(r.origin.x, r.origin.y, x - r.origin.x - _padding, r.size.height);
        else if (y > r.origin.y + _padding)
            a[a.length] = MaxRect.new(r.origin.x, r.origin.y, r.size.width, y - r.origin.y - _padding);

        let r1 = MaxRect.new(r.origin.x, y + h + _padding, r.size.width, r.size.height - h + r.origin.y - y - _padding);
        let r2 = MaxRect.new(x + w + _padding, r.origin.y, r.size.width - w + r.origin.x - x - _padding, r.size.height);

        if (r1.rect!.size.width > 0 && r1.rect!.size.height > 0) a[a.length] = r1;
        if (r2.rect!.size.width > 0 && r2.rect!.size.height > 0) a[a.length] = r2;
        return a;
    }

    public isEqual(x: number, y: number, w: number, h: number): boolean {
        return this.id == `${x}_${y}_${w}_${h}`;
    }

    public equalTo(r: MaxRect): boolean {
        if (!r) return false;
        return this.id == r.id;
    }

    public includes(w: number, h: number): boolean {
        return this.rect!.size.width >= w && this.rect!.size.height >= h;
    }

    public contains(r: MaxRect): boolean {
        if (!r) return false;
        return this.rect!.containsRect(r.rect!);
    }

    public sameOrigin(origin: Vec2): boolean {
        return this.rect!.origin.equals(origin);
    }
}

export class MaxRects {
    private _rects: MaxRect[] = [];
    private _width: number;
    private _height: number;

    constructor(width: number, height: number, padding = 2) {
        this._width = width;
        this._height = height;
        _padding = padding;
        this._addRect(_padding, _padding, width - _padding, height - _padding);
    }

    public get lastRects(): Rect[] {
        let a: Rect[] = [];
        this._rects.forEach(r => {
            a[a.length] = r.rect!;
        });
        return a;
    }

    public find(w: number, h: number): Vec2 | null {
        let idx = -1;
        this._rects.sort((a, b) => {
            return (a.rect!.size.width * a.rect!.size.height - b.rect!.size.width * b.rect!.size.height) || (a.rect!.origin.y - b.rect!.origin.y) || (a.rect!.origin.x - b.rect!.origin.x);
        });
        for (let i = 0, n = this._rects.length; i < n; i++) {
            let r = this._rects[i];
            if (r.includes(w, h)) {
                idx = i;
                break;
            }
        }
        if (idx == -1) return null;
        let use = this._rects.splice(idx, 1)[0];
        let r = this._getRectByOrigin(use.rect!.origin);
        if (r) {
            if (r.includes(use.rect!.size.width, use.rect!.size.height)) {
                use = r;
            }
        }
        let cuts = use.cut(use.rect!.origin.x, use.rect!.origin.y, w, h);
        let a = this._createRect(use.rect!.origin.x, use.rect!.origin.y, w, h)!;
        for (let i = this._rects.length - 1; i >= 0; i--) {
            if (a.contains(this._rects[i])) {
                this._rects.splice(i, 1);
            } else if (this._rects[i].rect.intersects(a.rect)) {
                let b = this._rects.splice(i, 1)[0];
                let c = b.cut(a.rect.origin.x, a.rect.origin.y, a.rect.size.width, a.rect.size.height);
                cuts = this._mergeRects(c, cuts);
            }
        }
        this._rects = this._mergeRects(cuts, this._rects);
        return use.rect.origin;
    }

    private _getRectByOrigin(origin: Vec2, remove = true): MaxRect | undefined {
        for (let i = 0, n = this._rects.length; i < n; i++) {
            if (this._rects[i].sameOrigin(origin)) {
                if (remove)
                    return this._rects.splice(i, 1)[0];
                return this._rects[i];
            }
        }
    }

    private _createRect(x: number, y: number, w: number, h: number): MaxRect | null {
        if (w < 0 || h < 0) return null;
        let r = MaxRect.new(x, y, w, h);
        return r;
    }

    private _addRect(x: number, y: number, w: number, h: number) {
        let r = this._createRect(x, y, w, h)!;
        this._rects[this._rects.length] = r;
    }

    private _mergeRects(arr: MaxRect[], target: MaxRect[]) {
        for (let i = arr.length - 1; i >= 0; i--) {
            let a = arr[i];
            for (let j = target.length - 1; j >= 0; j--) {
                let b = target[j];
                if (b.rect.containsRect(a.rect)) {
                    arr.splice(i, 1);
                } else if (a.rect.containsRect(b.rect)) {
                    target.splice(j, 1);
                } else if (a.id == b.id) {
                    arr.splice(i, 1);
                }
            }
        }
        target = target.concat(arr);
        return target;
    }
}
