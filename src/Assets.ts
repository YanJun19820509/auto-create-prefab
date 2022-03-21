import { copyFileSync } from "fs";
import { join, normalize } from "path";

export namespace Assets {

    export async function createPrefab(srcPath: string, output: string, name: string) {
        let file = name + '.prefab';
        copyFileSync(join(srcPath, name + '.json'), join(output, name + '.json'));
        let op = output;
        let dest = normalize(op).replace(normalize(Editor.Project.path) + '\\', 'db://').replace(/\\/g,'/');
        console.log(dest + '/' + file);
        let info = await getAssetInfo(dest + '/' + file);
        if (!info) {//预制体不存在时则创建
            console.log('预制体不存在，创建')
            copyFileSync(join(Editor.Project.path, './extensions/auto-create-prefab', 'temp.prefab'), join(output, file));
            await Editor.Message.request('asset-db', 'refresh-asset', dest);
            info = await getAssetInfo(dest + '/' + file);
        } else {
            console.log('预制体存在，打开')
        }
        await Editor.Message.request('asset-db', 'open-asset', info!.uuid);
    }

    async function getAssetInfo(path: string) {
        return await Editor.Message.request('asset-db', 'query-asset-info', path);
    }
}