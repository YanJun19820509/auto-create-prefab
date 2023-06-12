//@ts-ignore
import { copyFileSync } from "fs";
import P, { normalize } from "path"
// import { Atlas } from "./Atlas";
import { Assets } from "./Assets";
import { execSync } from "child_process";
// import { Atlas } from "./CanvasAtlas";
// import { Atlas } from "./JimpAtlas";
/**
 * @en 
 * @zh 为扩展的主进程的注册方法
 */
export const methods: { [key: string]: (...any: any) => any } = {
    openPanel() {
        Editor.Panel.open("auto-create-prefab");
    },
    async ok(v: string) {
        console.log(v);
        // Editor.Message.broadcast("auto-create-prefab:setState", "开始创建图集..");
        let a = JSON.parse(v);
        // if (!await Atlas.createAtlas(a.input, a.output, a.name, a.canRotate)) {
        //     Editor.Message.broadcast("auto-create-prefab:setState", "图集创建失败！");
        //     return;
        // }
        // Editor.Message.broadcast("auto-create-prefab:setState", "图集创建完成！");
        // const args = [
        //     "--format", "cocos2d",
        //     "--texture-format", "png",
        //     "--sheet", `${a.output}/${a.name}.png`,
        //     "--data", `${a.output}/${a.name}.plist`,
        //     "--enable-rotation",
        //     "--opt", "RGBA8888",
        //     "--size-constraints", a.isP2 ? "POT" : "AnySize",
        //     "--no-trim",
        //     a.input.replace(/\//g, "\\")
        // ];
        // execFileSync("D:/TexturePacker/bin/TexturePacker.exe", args, { encoding: "utf8" });
        execSync(`"D:/TexturePacker/bin/TexturePacker.exe" --format cocos2d --texture-format png --sheet ${a.output}/${a.name}.png --data ${a.output}/${a.name}.plist --enable-rotation --opt RGBA8888 --size-constraints ${a.isP2 ? "POT" : "AnySize"} --no-trim ${a.input.replace(/\//g, "\\")}`);
        Editor.Message.broadcast("auto-create-prefab:setState", `开始导入图集..`);
        Assets.importAtlas(a.input, a.output);
        Editor.Message.broadcast("auto-create-prefab:setState", "图集导入完成！");
        if (a.onlyAtlas) {
            let op = a.output;
            let dest = normalize(op).replace(normalize(Editor.Project.path) + "\\", "db://").replace(/\\/g, "/");
            await Editor.Message.request("asset-db", "refresh-asset", dest);
            return;
        }
        Editor.Message.broadcast("auto-create-prefab:setState", `开始创建prefab ${a.name}..`);
        await Assets.createPrefab(a.input, a.output, a.name);
        Editor.Message.broadcast("auto-create-prefab:setState", "prefab创建完成！");
    },
    downloadJSX(path: string) {
        let file = "p2j.jsx";
        copyFileSync(P.join(Editor.Project.path, "./extensions/auto-create-prefab", file), P.join(path, file));
    }
};

/**
 * @en Hooks triggered after extension loading is complete
 * @zh 扩展加载完成后触发的钩子
 */
export const load = function () { };

/**
 * @en Hooks triggered after extension uninstallation is complete
 * @zh 扩展卸载完成后触发的钩子
 */
export const unload = function () { };
