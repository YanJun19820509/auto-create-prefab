import fs from 'fs';
import images from 'images';
import { MaxRects } from './MaxRects';
import { Frame, PList } from './PList';

export namespace Atlas {
    const space = 2;
    let plist: PList;

    export function createAtlas(srcPath: string, output: string, name = 'spriteAtlas') {
        if (!fs.existsSync(srcPath)) {
            console.error('目录不存在：', srcPath);
            return;
        }
        let types = ['png', 'PNG', 'jpg', 'jpeg', 'JPG', 'JPEG'];
        // let files: string[] = [];
        let imgs: { name: string, img: images.Image }[] = [];
        plist = new PList(name);
        fs.readdirSync(srcPath).forEach(file => {
            let p = `${srcPath}/${file}`;
            let s = fs.statSync(p);
            if (s.isFile() && types.includes(file.split('.')[1])) {
                // files[files.length] = p;
                imgs[imgs.length] = { name: file, img: getImage(p) };
            }
        });

        drawImagsToAtlasAndSave(imgs, `${output}/${name}`);
    }

    function getImage(file: string): images.Image {
        return images(file);
    }

    function createImage(w: number, h: number): images.Image {
        return images(w, h);
    }

    function getMaxSize(imgs: { name: string, img: images.Image }[]): { width: number, height: number } {
        // let all = 0, min = 128, max = 2048, maxH = 0;
        // imgs.forEach(a => {
        //     let { width, height } = a.img.size();
        //     all += (width + space) * (height + space);
        //     if (height > maxH) maxH = height + space;
        // });
        // let a = Math.sqrt(all);
        // while (a > min) {
        //     min *= 2;
        // }
        // let w = Math.min(min, max);
        // let h = Math.max(maxH, Math.ceil(all / w));
        // return { width: w, height: h };
        let all = 0,
            min = 128,
            max = 2048,
            maxW = 0,
            maxH = 0;
        imgs.forEach(a => {
            let { width, height } = a.img.size();
            all += (width + space) * (height + space);
            if (width > maxW) maxW = width + space;
            if (height > maxH) maxH = height + space;
        });
        let a = Math.max(Math.sqrt(all), maxW);
        // if (this.isPower) {
        //     while (a > min) {
        //         min *= 2;
        //     }
        //     a = min;
        // }
        a *= 1.2;
        if (a > max) a = max;
        sortByHeightWidth(imgs, maxW > maxH);
        return {
            width: a,
            height: a
        };
    }

    function sortByHeightWidth(imgs: { name: string, img: images.Image }[], firstW: boolean) {
        imgs.sort((a, b) => {
            if (firstW)
                return (b.img.width() - a.img.width()) || (b.img.height() - a.img.height());
            else
                return (b.img.height() - a.img.height()) || (b.img.width() - a.img.width());
        });
    }

    function drawImagsToAtlasAndSave(imgs: { name: string, img: images.Image }[], savePath: string) {
        let { width, height } = getMaxSize(imgs);
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
        let lastRects = maxRect.lastRects;
        for (let i = 0, n = lastRects.length; i < n; i++) {
            let r = lastRects[i];
            if (r.origin.x == space && r.origin.x + r.size.width == width) {
                height = r.origin.y - space;
            }
        }
        atlas.resize(width, height);
        atlas.save(savePath + '.png');
        fs.writeFileSync(savePath + '.plist', plist.getContent());
    }
}