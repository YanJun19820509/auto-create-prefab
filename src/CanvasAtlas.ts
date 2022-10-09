import { Canvas, createCanvas, loadImage, Image } from 'canvas';
import fs, { copyFile, createWriteStream } from 'fs';
import P from 'path'
import { MaxRects, Vec2 } from './MaxRects';
import { Frame, PList } from './PList';

type ImageInfo = { name: string, img: Image | Canvas, offset: Vec2, size: { width: number, height: number }, rotated: boolean };
export namespace Atlas {
    const space = 2;
    let plist: PList;

    export let excludeImgs: string[];

    export function createAtlas(srcPath: string, output: string, name = 'spriteAtlas', canRotate: boolean): boolean {
        if (!fs.existsSync(srcPath)) {
            console.error('目录不存在：', srcPath);
            return false;
        }
        excludeImgs = [];
        plist = new PList(name);

        let imgs: ImageInfo[] = loadImages(srcPath, output, canRotate);
        if (imgs.length == 0) return true;
        imgs.sort((a, b) => {
            return b.size.height - a.size.height;
        });
        let maxSize = getMaxSize(imgs);
        drawImagsToAtlasAndSave(maxSize, imgs, `${output}/${name}`);
        return true;
    }

    function loadImages(srcPath: string, output: string, canRotate: boolean): ImageInfo[] {
        let types = ['.png', '.PNG', '.jpg', '.jpeg', '.JPG', '.JPEG'];
        let files = fs.readdirSync(srcPath);
        let imgs: ImageInfo[] = [];
        for (let i = 0, n = files.length; i < n; i++) {
            let file = files[i];
            let p = `${srcPath}/${file}`;
            let s = fs.statSync(p);
            if (s.isFile() && types.includes(P.extname(file))) {
                loadImage(p).then(aa => {
                    let { width, height } = aa;
                    if (width * height > 300000) {
                        excludeImgs[excludeImgs.length] = file;
                        copyFile(p, `${output}/${file}`, () => { });
                    } else {
                        let r = width > height && canRotate;
                        imgs[imgs.length] = { name: file, img: r ? rotate(aa) : aa, offset: new Vec2(), size: r ? { width: height, height: width } : { width: width, height: height }, rotated: r };
                    }
                });
            }
        }
        return imgs;
    }

    function rotate(a: Image): Canvas {
        const canvas = createCanvas(a.width, a.height);
        const ctx = canvas.getContext('2d');
        ctx.rotate(90);
        ctx.drawImage(a, 0, 0, a.width, a.height);
        return canvas;
    }

    function getMaxSize(imgs: ImageInfo[]): { width: number, height: number } {
        let all = 0,
            maxW = 0,
            maxH = 0;
        imgs.forEach(img => {
            let { width, height } = img.size;
            let b = (width + space) * (height + space);
            all += b;
            maxW = Math.max(maxW, width + space);
            maxH = Math.max(maxH, height + space);
        });
        let c = Math.ceil(Math.sqrt(all));
        let w = Math.max(c, maxW);
        let h = Math.max(c, maxH);
        return getMaxRectSize(imgs, w, h);
    }

    function getMaxRectSize(imgs: ImageInfo[], width: number, height: number): { width: number, height: number } {
        console.log('origin size', width, height);
        let maxRect = new MaxRects(width, height, space);
        let a = true;
        for (let i = 0, n = imgs.length; i < n; i++) {
            let size = imgs[i].size;
            let p = maxRect.find(size.width, size.height);
            if (!p) {
                if (size.width <= size.height) {
                    if (width + size.width + space < 2048) width += size.width + space;
                    else {
                        width = 2048;
                        height += size.height + space;
                    }
                } else {
                    if (height + size.height + space < 2048) height += size.height + space;
                    else {
                        height = 2048;
                        width += size.width + space;
                    }
                }
                width = Math.min(width, 2048);
                height = Math.min(height, 2048);
                a = false;
                break;
            } else
                imgs[i].offset = p;
        }
        if (!a && (width < 2048 || height < 2048))
            return getMaxRectSize(imgs, width, height);

        let w = 0, h = 0;
        imgs.forEach(img => {
            let size = img.size,
                offset = img.offset;
            if (offset) {
                w = Math.max(w, offset.x + size.width);
                h = Math.max(h, offset.y + size.height);
            }
        });
        console.log('getMaxRectSize', w, h);
        return { width: w, height: h };
    }

    function drawImagsToAtlasAndSave(size: { width: number, height: number }, imgs: ImageInfo[], savePath: string) {
        let { width, height } = size;
        let atlas = createCanvas(width, height);
        let ctx = atlas.getContext('2d');
        imgs.forEach(a => {
            let p = a.offset;
            if (p) {
                ctx.drawImage(a.img, p.x, p.y, a.img.width, a.img.height);
                let size = a.size;
                if (a.rotated) {
                    let w = size.width;
                    size.width = size.height;
                    size.height = w;
                }
                let frame = new Frame(a.name);
                frame.setOffset(p.x, p.y);
                frame.setSize(size);
                frame.setRotated(a.rotated);
                plist.addFrame(frame);
            }
        });
        const out = createWriteStream(savePath + '.png');
        atlas.createPNGStream().pipe(out);
        plist.setSize(width, height);
        fs.writeFileSync(savePath + '.plist', plist.getContent());
    }
}