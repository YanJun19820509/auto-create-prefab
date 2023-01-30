import { copyFileSync, readdirSync, statSync } from "fs";
import { extname, join, normalize } from "path";

export namespace Assets {
    const types = ['.png', '.PNG', '.jpg', '.jpeg', '.JPG', '.JPEG', '.plist'];
    export async function createPrefab(srcPath: string, output: string, name: string) {
        let file = name + '.prefab';
        copyFileSync(join(srcPath, name + '.json'), join(output, name + '.json'));
        let op = output;
        let dest = normalize(op).replace(normalize(Editor.Project.path) + '\\', 'db://').replace(/\\/g, '/');
        console.log(dest + '/' + file);
        let info = await getAssetInfo(dest + '/' + file);
        if (!info) {//预制体不存在时则创建
            console.log('预制体不存在，创建')
            copyFileSync(join(Editor.Project.path, './extensions/auto-create-prefab', 'temp.prefab'), join(output, file));
            await Editor.Message.request('asset-db', 'refresh-asset', dest);
            info = await getAssetInfo(dest + '/' + file);
        } else {
            console.log('预制体存在，打开')
            await Editor.Message.request('asset-db', 'refresh-asset', dest);
        }
        await Editor.Message.request('asset-db', 'open-asset', info!.uuid);
    }

    export function importAtlas(srcPath: string, output: string) {
        const path = join(srcPath, '.output');
        readdirSync(path).forEach(sub => {
            let p = join(path, sub);
            let s = statSync(p);
            if (s.isFile() && types.includes(extname(sub))) {
                copyFileSync(p, join(output, sub));
            }
        });
    }

    async function getAssetInfo(path: string) {
        return await Editor.Message.request('asset-db', 'query-asset-info', path);
    }
}