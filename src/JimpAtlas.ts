import fs, { copyFile } from 'fs';
import P from 'path'
import { MaxRects, Vec2 } from './MaxRects';
import { Frame, PList } from './PList';
import Jimp from 'jimp'

type ImageInfo = { name: string, img: Jimp, offset: Vec2, size: { width: number, height: number }, rotated: boolean };
export namespace Atlas {

    const space: number = 2;
    const types: string[] = ['.png', '.PNG', '.jpg', '.jpeg', '.JPG', '.JPEG'];
    let plist: PList;
    let imgs: ImageInfo[] = [];

    export let excludeImgs: string[];

    export function createAtlas(srcPath: string, output: string, name = 'spriteAtlas', canRotate: boolean): Promise<boolean> {
        if (!fs.existsSync(srcPath)) {
            console.error('目录不存在：', srcPath);
            return Promise.resolve(false);
        }
        // console.log('aaa', srcPath, output, name);
        // let files: string[] = [];
        excludeImgs = [];
        plist = new PList(name);
        let files: string[] = [];
        fs.readdirSync(srcPath).forEach(file => {
            let p = `${srcPath}/${file}`;
            let s = fs.statSync(p);
            if (s.isFile() && types.includes(P.extname(file))) {
                files[files.length] = file;
            }
        });

        return loadImages(files, srcPath, output, canRotate).then(() => {
            if (imgs.length == 0) return true;
            imgs.sort((a, b) => {
                return b.size.height - a.size.height;
            });
            let maxSize = getMaxSize(imgs);
            drawImagsToAtlasAndSave(maxSize, imgs, `${output}/${name}`);
            return Promise.resolve(true);
        });
    }

    async function loadImages(files: string[], srcPath: string, output: string, canRotate: boolean): Promise<void> {
        let file = files.shift();
        if (!file) return Promise.resolve();

        const aa = await getImage(`${srcPath}/${file}`);
        let size = getSize(aa);
        if (size.width * size.height > 300000) {
            excludeImgs[excludeImgs.length] = file!;
            copyFile(file!, `${output}/${file}`, () => { });
        } else {
            let r = size.width > size.height && canRotate;
            r && aa.rotate(-90);
            imgs[imgs.length] = { name: file!, img: aa, offset: new Vec2(), size: r ? { width: size.height, height: size.width } : { width: size.width, height: size.height }, rotated: r };
        }
        return await loadImages(files, srcPath, output, canRotate);
    }

    function getImage(file: string): Promise<Jimp> {
        return new Promise<Jimp>(resolve => {
            new Jimp(file, (e, a) => {
                if (e) throw e;
                resolve(a);
            });
        })
    }

    function createImage(w: number, h: number): Jimp {
        return new Jimp(w, h);
    }

    function getSize(img: Jimp): { width: number, height: number } {
        return { width: img.getWidth(), height: img.getHeight() };
    }

    function getMaxSize(imgs: ImageInfo[]): { width: number, height: number } {
        let all = 0,
            maxW = 0,
            maxH = 0;
        imgs.forEach(img => {
            let { width, height } = getSize(img.img);
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
            } else imgs[i].offset = p;
        }
        if (!a && (width < 2048 || height < 2048))
            return getMaxRectSize(imgs, width, height);

        let w = 0, h = 0;
        imgs.forEach(img => {
            let size = getSize(img.img),
                offset = img.offset;
            w = Math.max(w, offset.x + size.width);
            h = Math.max(h, offset.y + size.height);
        });
        console.log('getMaxRectSize', w, h);
        return { width: w, height: h };
    }

    function drawImagsToAtlasAndSave(size: { width: number, height: number }, imgs: ImageInfo[], savePath: string) {
        let { width, height } = size;
        let atlas = createImage(width, height);
        imgs.forEach(a => {
            let p = a.offset;
            if (p) {
                atlas.blit(a.img, p.x, p.y);
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
        atlas.write(savePath + '.png');
        plist.setSize(width, height);
        fs.writeFileSync(savePath + '.plist', plist.getContent());
    }
}