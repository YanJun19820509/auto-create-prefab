import { copyFileSync } from "fs";
import { join, normalize } from "path";

export namespace Assets {

    export async function createPrefab(srcPath: string, output: string, name: string) {
        let file = name + '.prefab';
        copyFileSync(join(Editor.Project.path, './extensions/auto-create-prefab', 'temp.prefab'), join(output, file));
        copyFileSync(join(srcPath, name + '.json'), join(output, name + '.json'));

        let dest = normalize(output).replace(normalize(Editor.Project.path) + '\\', 'db://');
        await Editor.Message.request('asset-db', 'refresh-asset', dest);
        await editPrefab(dest + '/' + file);
    }

    async function editPrefab(prefabFile: string) {
        let a = await Editor.Message.request('asset-db', 'query-asset-info', prefabFile);
        if (!a) return;
        await Editor.Message.request('asset-db', 'open-asset', a!.uuid);
    }
}