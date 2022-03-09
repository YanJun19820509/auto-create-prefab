import { copyFileSync, readFileSync, writeFileSync } from "fs";
import { join, normalize } from "path";
import { AssetInfo } from "../@types/packages/asset-db/@types/public";

export namespace Assets {
    // export async function importAtlas(from: string, to: string) {
    //     let result = await Editor.Message.request('asset-db', 'import-asset', from + '.png', to);
    //     console.log(result);
    //     result = await Editor.Message.request('asset-db', 'import-asset', from + '.plist', to);
    //     console.log(result);
    // }

    export async function createPrefab(srcPath: string, output: string, name: string) {
        let file = name + '.prefab';
        copyFileSync(join(Editor.Project.path, './extensions/auto-create-prefab', 'temp.prefab'), join(output, file));

        let buffer = readFileSync(join(srcPath, name + '.json'), 'utf-8');
        let config = JSON.parse(buffer);
        let dest = normalize(output).replace(normalize(Editor.Project.path) + '\\', 'db://');
        await Editor.Message.request('asset-db', 'refresh-asset', dest);
        await editPrefab(dest + '/' + file, config);
    }

    async function editPrefab(prefabFile: string, config: any) {
        let a = await Editor.Message.request('asset-db', 'query-asset-info', prefabFile);
        if (!a) return;
        console.log(a);
        await Editor.Message.request('asset-db', 'open-asset', prefabFile);
        config.nodes.forEach(async (node: any) => {
            await createNode(node, a!.uuid);
        });
    }

    async function createNode(prop: any, prefabUuid: string) {
        let uuid = await Editor.Message.request('scene', 'create-node', {
            parent: 'Canvas',
            components: [
                'cc.UITransform',
                'cc.Sprite'
            ],
            name: prop.name,
            type: 'cc.Node',
            dump: {
                name: {
                    value: prop.name
                },
                position: {
                    x: prop.x,
                    y: prop.y,
                    z: 0
                }
            }
        });
    }
}