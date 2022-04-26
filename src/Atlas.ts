import fs, { copyFile } from 'fs';
import images from 'images';
import { MaxRects } from './MaxRects';
import { Frame, PList } from './PList';

export namespace Atlas {
    const space = 2;
    let plist: PList;

    export let excludeImgs: string[];

    export function createAtlas(srcPath: string, output: string, name = 'spriteAtlas'): boolean {
        if (!fs.existsSync(srcPath)) {
            console.error('目录不存在：', srcPath);
            return false;
        }
        // console.log('aaa', srcPath, output, name);
        let types = ['png', 'PNG', 'jpg', 'jpeg', 'JPG', 'JPEG'];
        // let files: string[] = [];
        let imgs: { name: string, img: images.Image }[] = [];
        excludeImgs = [];
        plist = new PList(name);
        fs.readdirSync(srcPath).forEach(file => {
            let p = `${srcPath}/${file}`;
            let s = fs.statSync(p);
            if (s.isFile() && types.includes(file.split('.')[1])) {
                // files[files.length] = p;
                let aa = getImage(p);
                let size = aa.size();
                if (size.width * size.height > 300000) {
                    excludeImgs[excludeImgs.length] = file;
                    copyFile(p, `${output}/${file}`, () => { });
                } else {
                    imgs[imgs.length] = { name: file, img: aa };
                }
            }
        });
        let sizes = sortImagesAndReturnSizes(imgs);
        drawImagsToAtlasAndSave(getMaxSize(sizes), imgs, `${output}/${name}`);
        return true;
    }

    function getImage(file: string): images.Image {
        return images(file);
    }

    function createImage(w: number, h: number): images.Image {
        return images(w, h);
    }

    function getMaxSize(sizes: { width: number, height: number }[]): { width: number, height: number } {
        let all = 0,
            maxW = 0,
            maxH = 0;
        sizes.forEach(size => {
            let { width, height } = size;
            let b = (width + space) * (height + space);
            all += b;
            maxW = Math.max(maxW, width + space);
            maxH = Math.max(maxH, height + space);
        });
        let c = Math.sqrt(all);
        let w = Math.max(c, maxW);
        let h = Math.max(c, maxH);
        return getMaxRectSize(sizes, w, h);
    }

    function getMaxRectSize(imageSizes: { width: number, height: number }[], width: number, height: number): { width: number, height: number } {
        let maxRect = new MaxRects(width, height, space);
        let a = true;
        for (let i = 0, n = imageSizes.length; i < n; i++) {
            let size = imageSizes[i];
            let p = maxRect.find(size.width, size.height);
            if (!p) {
                if (width + size.width + space < 2048) width += size.width + space;
                else {
                    width = 2048;
                    height += size.height + space;
                    if (height > 2048) height = 2048;
                }
                a = false;
            }
        }
        if (!a) return getMaxRectSize(imageSizes, width, height);
        console.log('getMaxRectSize', width, height);
        return { width: width, height: height };
    }

    function sortImagesAndReturnSizes(imgs: { name: string, img: images.Image }[]): { width: number, height: number }[] {
        imgs.sort((a, b) => {
            return (b.img.width() - a.img.width()) || (b.img.height() - a.img.height());
        });
        let sizes: { width: number, height: number }[] = [];
        imgs.forEach(img => {
            sizes[sizes.length] = img.img.size();
        });
        return sizes;
    }

    function drawImagsToAtlasAndSave(size: { width: number, height: number }, imgs: { name: string, img: images.Image }[], savePath: string) {
        let { width, height } = size;
        let atlas = createImage(width, height);
        let maxRect = new MaxRects(width, height, space);
        imgs.forEach(a => {
            let w = a.img.width(),
                h = a.img.height();
            let p = maxRect.find(w, h);
            if (p) {
                atlas.draw(a.img, p.x, p.y);
                let frame = new Frame(a.name);
                frame.setOffset(p.x, p.y);
                frame.setSize(w, h);
                plist.addFrame(frame);
            }
        });
        // atlas.save(savePath + '.png');
        let rects = maxRect.lastRects;
        let x = 0, y = 0;
        rects.forEach(rect => {
            // if (rect.origin.x > x) x = rect.origin.x;
            if (rect.origin.y > y) y = rect.origin.y;
        });
        // width = x;
        height = y;
        console.log('resizeImg', width, height);
        let resizeImg = createImage(width, height);
        resizeImg.draw(atlas, 0, 0);
        resizeImg.save(savePath + '.png');
        plist.setSize(width, height);
        fs.writeFileSync(savePath + '.plist', plist.getContent());
    }
}